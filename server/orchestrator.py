"""FSM Orchestrator — 학습 루프 상태 머신.

Phase 흐름:
IDLE → SEGMENTING → PREVIEW → PROBING → (HINTING →) ANALYZING
→ DELIVERING → DISCUSSING → COMPRESSING → (CHALLENGE_PROMPT → CHALLENGE_FEEDBACK →)
→ 다음 세그먼트 or COMPLETE
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator

from server.config import settings
from server.models import (
    ConstellationData,
    ConstellationEdge,
    ConstellationNode,
    DepthLabel,
    LLMUsage,
    LevelInfo,
    Message,
    MessageRole,
    Phase,
    ProbeResult,
    Segment,
    SegmentState,
    Session,
)
from server.llm.base import LLMBackend
from server.prompts import segment as seg_prompts
from server.prompts import probe as probe_prompts
from server.prompts import deliver as deliver_prompts
from server.prompts import discuss as discuss_prompts
from server.prompts import compress as compress_prompts
from server.prompts import challenge as challenge_prompts
from server import cost_tracker, session_store

logger = logging.getLogger(__name__)


class Orchestrator:
    """세션 하나의 학습 루프를 관리."""

    def __init__(self, session: Session, backend: LLMBackend) -> None:
        self.session = session
        self.backend = backend

    # ── 세그먼트 분할 ──

    async def segment_script(self, script_text: str) -> list[Segment]:
        """스크립트를 세그먼트로 분할."""
        self.session.phase = Phase.SEGMENTING

        prompt = seg_prompts.SEGMENT_USER.format(script=script_text)
        text, usage = await self.backend.call(
            prompt=prompt,
            system=seg_prompts.SEGMENT_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        data = json.loads(text)
        segments = [Segment.model_validate(s) for s in data["segments"]]

        # §1-10 품질 검증
        segments = self._validate_segments(segments)

        self.session.segments = segments
        self.session.segment_states = [
            SegmentState(segment_id=s.id) for s in segments
        ]
        self.session.phase = Phase.PREVIEW
        session_store.save(self.session)

        return segments

    def _validate_segments(self, segments: list[Segment]) -> list[Segment]:
        """§1-10 분할 품질 자동 검증 (코드 레벨, LLM 호출 없음)."""
        validated = []
        i = 0
        while i < len(segments):
            seg = segments[i]

            # 하한 검사: 150 토큰 미달 → 다음과 병합
            if seg.token_count < 150 and i + 1 < len(segments):
                next_seg = segments[i + 1]
                seg.title = f"{seg.title} + {next_seg.title}"
                seg.transcript = f"{seg.transcript}\n{next_seg.transcript}"
                seg.token_count += next_seg.token_count
                seg.key_terms = list(set(seg.key_terms + next_seg.key_terms))
                logger.info("Merged short segment %d into %d", next_seg.id, seg.id)
                i += 2
                validated.append(seg)
                continue

            # depends_on 길이 경고
            if len(seg.depends_on) > 1:
                logger.warning(
                    "Segment %d has %d dependencies (max 1 recommended)",
                    seg.id, len(seg.depends_on),
                )

            # 메타데이터 완결성
            if not seg.core_concept or not seg.key_terms:
                logger.warning(
                    "Segment %d missing metadata (core_concept=%r, key_terms=%r)",
                    seg.id, seg.core_concept, seg.key_terms,
                )

            validated.append(seg)
            i += 1

        # ID 재부여
        for idx, seg in enumerate(validated):
            seg.id = idx + 1

        return validated

    # ── Preview (Phase 0, §G-7) ──

    def save_prediction(self, prediction: str) -> None:
        """사용자 예측 저장 (프론트엔드 전용, LLM 호출 없음)."""
        state = self.session.current_state
        if state:
            state.preview_prediction = prediction
            self.session.phase = Phase.PROBING
            session_store.save(self.session)

    def skip_preview(self) -> None:
        """Preview 건너뛰기."""
        self.session.phase = Phase.PROBING
        session_store.save(self.session)

    # ── Probe (Phase 1) ──

    async def generate_probe(self) -> str:
        """Probe 질문 1개 생성."""
        seg = self.session.current_segment
        if not seg:
            raise ValueError("No current segment")

        self.session.phase = Phase.PROBING

        prompt = probe_prompts.PROBE_USER.format(
            segment_title=seg.title,
            core_concept=seg.core_concept,
            key_terms=", ".join(seg.key_terms),
            transcript=seg.transcript,
            prev_level=self._prev_level(),
            understood_concepts=", ".join(self.session.understood_concepts) or "없음",
        )

        text, usage = await self.backend.call(
            prompt=prompt,
            system=probe_prompts.PROBE_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        # 메시지 기록
        state = self.session.current_state
        if state:
            state.messages.append(
                Message(role=MessageRole.ASSISTANT, content=text, phase=Phase.PROBING)
            )
            state.level_info.probe_question = text

        session_store.save(self.session)
        return text

    async def analyze_answer(self, user_answer: str) -> ProbeResult:
        """사용자 답변 분석 → 레벨 판정."""
        seg = self.session.current_segment
        state = self.session.current_state
        if not seg or not state:
            raise ValueError("No current segment/state")

        self.session.phase = Phase.ANALYZING

        # 메시지 기록
        state.messages.append(
            Message(role=MessageRole.USER, content=user_answer, phase=Phase.PROBING)
        )
        state.level_info.user_answer = user_answer

        prompt = probe_prompts.ANALYZE_USER.format(
            core_concept=seg.core_concept,
            key_terms=", ".join(seg.key_terms),
            probe_question=state.level_info.probe_question,
            user_answer=user_answer,
        )

        text, usage = await self.backend.call(
            prompt=prompt,
            system=probe_prompts.ANALYZE_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        result = ProbeResult.model_validate(json.loads(text))

        state.level_info.level = result.level
        state.level_info.confidence = result.confidence
        state.level_info.reasoning = result.reasoning
        state.level_info.depth_label = DepthLabel.from_level(result.level)

        session_store.save(self.session)
        return result

    async def generate_hint(self) -> str:
        """L0~L1 시 힌트 1회 생성."""
        seg = self.session.current_segment
        state = self.session.current_state
        if not seg or not state:
            raise ValueError("No current segment/state")

        self.session.phase = Phase.HINTING

        prompt = probe_prompts.HINT_USER.format(
            user_answer=state.level_info.user_answer,
            core_concept=seg.core_concept,
        )

        text, usage = await self.backend.call(
            prompt=prompt,
            system=probe_prompts.PROBE_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        state.messages.append(
            Message(role=MessageRole.ASSISTANT, content=text, phase=Phase.HINTING)
        )
        session_store.save(self.session)
        return text

    # ── Deliver (Phase 2) ──

    async def deliver(self) -> str:
        """수준별 맞춤 전달."""
        seg = self.session.current_segment
        state = self.session.current_state
        if not seg or not state:
            raise ValueError("No current segment/state")

        self.session.phase = Phase.DELIVERING

        # confidence 보정: low → 한 단계 위 전략
        effective_level = state.level_info.level
        if state.level_info.confidence == "low":
            effective_level = min(effective_level + 1, 5)

        prompt = deliver_prompts.DELIVER_USER.format(
            segment_title=seg.title,
            core_concept=seg.core_concept,
            key_terms=", ".join(seg.key_terms),
            transcript=seg.transcript,
            level=effective_level,
            probe_question=state.level_info.probe_question,
            user_answer=state.level_info.user_answer,
            reasoning=state.level_info.reasoning,
        )

        text, usage = await self.backend.call(
            prompt=prompt,
            system=deliver_prompts.DELIVER_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        state.messages.append(
            Message(role=MessageRole.ASSISTANT, content=text, phase=Phase.DELIVERING)
        )
        self.session.phase = Phase.DISCUSSING
        session_store.save(self.session)
        return text

    # ── Discuss (Phase 3) ──

    async def discuss(self, user_message: str) -> dict:
        """사용자 Q&A 응답. cross_segment_link 감지."""
        seg = self.session.current_segment
        state = self.session.current_state
        if not seg or not state:
            raise ValueError("No current segment/state")

        state.messages.append(
            Message(role=MessageRole.USER, content=user_message, phase=Phase.DISCUSSING)
        )

        # 대화 이력 구성
        history = "\n".join(
            f"{'사용자' if m.role == MessageRole.USER else 'AI'}: {m.content}"
            for m in state.messages[-10:]  # 최근 10턴
        )

        prompt = discuss_prompts.DISCUSS_USER.format(
            segment_title=seg.title,
            core_concept=seg.core_concept,
            transcript=seg.transcript,
            understood_concepts=", ".join(self.session.understood_concepts) or "없음",
            conversation_history=history,
            user_message=user_message,
        )

        text, usage = await self.backend.call(
            prompt=prompt,
            system=discuss_prompts.DISCUSS_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        result = json.loads(text)

        state.messages.append(
            Message(
                role=MessageRole.ASSISTANT,
                content=result.get("reply", ""),
                phase=Phase.DISCUSSING,
                metadata={"cross_segment_link": result.get("cross_segment_link", False)},
            )
        )

        # cross_segment_link 감지 시 연결 기록
        if result.get("cross_segment_link"):
            prev_ids = [
                st.segment_id
                for st in self.session.segment_states
                if st.completed and st.segment_id != seg.id
            ]
            if prev_ids:
                state.cross_segment_links.append(prev_ids[-1])

        # 세그먼트 종료 감지
        if result.get("end_segment"):
            await self._complete_segment()

        session_store.save(self.session)
        return result

    # ── 세그먼트 완료 + 압축 ──

    async def _complete_segment(self) -> None:
        """세그먼트 완료 처리: 압축 → 다음 세그먼트 or 챌린지 or 완료."""
        state = self.session.current_state
        if not state:
            return

        state.completed = True
        self.session.phase = Phase.COMPRESSING

        # Sliding Summary 압축
        conversation = "\n".join(
            f"{'사용자' if m.role == MessageRole.USER else 'AI'}: {m.content}"
            for m in state.messages
        )
        prompt = compress_prompts.COMPRESS_USER.format(
            segment_id=state.segment_id,
            conversation=conversation,
        )
        text, usage = await self.backend.call(
            prompt=prompt,
            system=compress_prompts.COMPRESS_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)
        state.summary = text

        # Integration Challenge 트리거 판단 (§G-5)
        completed = self.session.completed_count
        if (
            completed > 0
            and completed % settings.CHALLENGE_EVERY_N_SEGMENTS == 0
            and self.session.current_segment_index + 1 < len(self.session.segments)
        ):
            self.session.phase = Phase.CHALLENGE_PROMPT
        else:
            self._advance_segment()

    def _advance_segment(self) -> None:
        """다음 세그먼트로 이동 or 세션 완료."""
        next_idx = self.session.current_segment_index + 1
        if next_idx < len(self.session.segments):
            self.session.current_segment_index = next_idx
            self.session.phase = Phase.PREVIEW
        else:
            self.session.phase = Phase.COMPLETE
            self.session.completed = True

    # ── Integration Challenge (§G-5) ──

    async def generate_challenge(self) -> str:
        """통합 질문 생성."""
        completed_info = self._completed_segments_info()

        prompt = challenge_prompts.CHALLENGE_USER.format(
            completed_segments=completed_info,
        )
        text, usage = await self.backend.call(
            prompt=prompt,
            system=challenge_prompts.CHALLENGE_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)
        session_store.save(self.session)
        return text

    async def challenge_feedback(self, question: str, user_answer: str) -> str:
        """통합 질문 답변 피드백."""
        completed_info = self._completed_segments_info()

        prompt = challenge_prompts.CHALLENGE_FEEDBACK_USER.format(
            challenge_question=question,
            completed_segments=completed_info,
            user_answer=user_answer,
        )
        text, usage = await self.backend.call(
            prompt=prompt,
            system=challenge_prompts.CHALLENGE_FEEDBACK_SYSTEM,
        )
        cost_tracker.accumulate(self.session, usage)

        self._advance_segment()
        self.session.phase = Phase.CHALLENGE_FEEDBACK
        session_store.save(self.session)
        return text

    def skip_challenge(self) -> None:
        """챌린지 건너뛰기."""
        self._advance_segment()
        session_store.save(self.session)

    # ── Knowledge Constellation (§G-2) ──

    def get_constellation(self) -> ConstellationData:
        """현재 세션의 별자리 데이터 생성."""
        nodes = []
        edges = []

        for seg in self.session.segments:
            state = next(
                (s for s in self.session.segment_states if s.segment_id == seg.id),
                None,
            )
            nodes.append(
                ConstellationNode(
                    id=seg.id,
                    title=seg.title,
                    depth_label=(
                        state.level_info.depth_label if state else DepthLabel.SURFACE
                    ),
                    level=state.level_info.level if state else 0,
                    completed=state.completed if state else False,
                )
            )

            # depends_on 연결선
            for dep_id in seg.depends_on:
                edges.append(
                    ConstellationEdge(source=dep_id, target=seg.id, is_dependency=True)
                )

            # cross_segment_links 연결선
            if state:
                for link_id in state.cross_segment_links:
                    edges.append(
                        ConstellationEdge(
                            source=link_id,
                            target=seg.id,
                            is_dependency=False,
                            is_cross_link=True,
                        )
                    )

        return ConstellationData(nodes=nodes, edges=edges)

    # ── 유틸리티 ──

    def _prev_level(self) -> str:
        idx = self.session.current_segment_index
        if idx > 0:
            prev_state = self.session.segment_states[idx - 1]
            return f"L{prev_state.level_info.level}"
        return "첫 파트"

    def _completed_segments_info(self) -> str:
        lines = []
        for st in self.session.segment_states:
            if st.completed:
                seg = next(
                    (s for s in self.session.segments if s.id == st.segment_id), None
                )
                if seg:
                    lines.append(
                        f"- {seg.title}: {seg.core_concept} "
                        f"(용어: {', '.join(seg.key_terms)})"
                    )
        return "\n".join(lines) or "없음"
