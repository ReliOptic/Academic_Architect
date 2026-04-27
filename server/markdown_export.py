"""세션 → 마크다운 보고서 변환 (LLM 호출 없음).

완료된 세션의 메타데이터, 세그먼트별 요약/Q&A, 세그먼트 간 연결을
Obsidian/Notion 호환 마크다운 문서로 직렬화한다.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone

from server.models import Phase, Session, SegmentState, MessageRole


_FILENAME_SAFE = re.compile(r"[^\w\-]+", re.UNICODE)


def _format_date(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _segment_title(session: Session, segment_id: int) -> str:
    seg = next((s for s in session.segments if s.id == segment_id), None)
    return seg.title if seg else f"#{segment_id}"


def _delivery_text(state: SegmentState) -> str:
    for msg in state.messages:
        if msg.phase == Phase.DELIVERING and msg.role == MessageRole.ASSISTANT:
            return msg.content.strip()
    return ""


_TRACKED_PHASES = {Phase.DELIVERING, Phase.HINTING, Phase.DISCUSSING}


def _socratic_counts(session: Session) -> tuple[int, int]:
    """추적 대상 AI 응답 중 소크라테스식으로 닫힌 비율 계산."""
    total = 0
    hit = 0
    for st in session.segment_states:
        for msg in st.messages:
            if msg.role != MessageRole.ASSISTANT or msg.phase not in _TRACKED_PHASES:
                continue
            if "is_socratic" not in msg.metadata:
                continue
            total += 1
            if msg.metadata["is_socratic"]:
                hit += 1
    return total, hit


def build_markdown(session: Session) -> str:
    """세션을 마크다운 문서 문자열로 변환."""
    lines: list[str] = []

    lines.append(f"# {session.title or 'Academic Architect 학습 노트'}")
    lines.append("")
    lines.append(f"- 생성일: {_format_date(session.created_at)}")
    lines.append(f"- 세그먼트 수: {len(session.segments)}")
    lines.append(f"- 완료된 세그먼트: {session.completed_count}")
    total_tokens = session.total_input_tokens + session.total_output_tokens
    lines.append(f"- 총 토큰: {total_tokens:,}")
    lines.append(f"- 비용: ${session.cost_usd:.4f}")
    if session.script_filename:
        lines.append(f"- 원본 파일: `{session.script_filename}`")

    levels = session.level_trend
    if levels:
        avg = sum(levels) / len(levels)
        lines.append(f"- 평균 도달 레벨: L{avg:.1f}")

    socratic_total, socratic_hit = _socratic_counts(session)
    if socratic_total > 0:
        ratio = socratic_hit / socratic_total
        lines.append(
            f"- 소크라테스 닫음 비율: {socratic_hit}/{socratic_total} "
            f"({ratio:.0%}) — Deliver/Hint/Discuss 응답 중 질문·사고실험으로 닫은 비율"
        )
    lines.append("")

    # 세그먼트별 상세
    lines.append("## 세그먼트별 학습 기록")
    lines.append("")

    for seg in session.segments:
        state = next(
            (s for s in session.segment_states if s.segment_id == seg.id),
            None,
        )

        lines.append(f"### {seg.id}. {seg.title}")
        lines.append("")
        if seg.core_concept:
            lines.append(f"- **핵심 개념**: {seg.core_concept}")
        if seg.key_terms:
            terms = ", ".join(f"`{t}`" for t in seg.key_terms)
            lines.append(f"- **주요 용어**: {terms}")

        if state:
            lines.append(
                f"- **탐구 깊이**: {state.level_info.depth_label.value} "
                f"(L{state.level_info.level})"
            )
            lines.append(f"- **완료 여부**: {'예' if state.completed else '아니오'}")

            if state.preview_prediction:
                lines.append("")
                lines.append("#### Preview 예측")
                lines.append("")
                lines.append(f"> {state.preview_prediction.strip()}")

            if state.level_info.probe_question:
                lines.append("")
                lines.append("#### Probe")
                lines.append("")
                lines.append(f"- **질문**: {state.level_info.probe_question.strip()}")
                if state.level_info.user_answer:
                    lines.append(
                        f"- **답변**: {state.level_info.user_answer.strip()}"
                    )
                if state.level_info.reasoning:
                    lines.append(
                        f"- **분석**: {state.level_info.reasoning.strip()}"
                    )

            delivery = _delivery_text(state)
            if delivery:
                lines.append("")
                lines.append("#### Deliver 설명")
                lines.append("")
                lines.append(delivery)

            if state.summary:
                lines.append("")
                lines.append("#### 요약")
                lines.append("")
                lines.append(state.summary.strip())

            if state.cross_segment_links:
                linked = ", ".join(
                    f"#{lid} ({_segment_title(session, lid)})"
                    for lid in state.cross_segment_links
                )
                lines.append("")
                lines.append(f"#### 다른 세그먼트와의 연결")
                lines.append("")
                lines.append(linked)
        lines.append("")

    # 전체 cross_segment_links
    cross_links: list[tuple[int, int]] = []
    for st in session.segment_states:
        for lid in st.cross_segment_links:
            cross_links.append((st.segment_id, lid))

    if cross_links:
        lines.append("## 세그먼트 간 연결")
        lines.append("")
        for source, target in cross_links:
            lines.append(
                f"- {source}. {_segment_title(session, source)} ↔ "
                f"{target}. {_segment_title(session, target)}"
            )
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def safe_filename(session: Session) -> str:
    """다운로드 파일명 (확장자 제외)."""
    base = session.title or f"session-{session.id}"
    base = _FILENAME_SAFE.sub("-", base).strip("-")
    return base or f"session-{session.id}"
