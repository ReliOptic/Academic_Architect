"""FastAPI 서버 — Academic Architect 백엔드.

라우트:
- POST   /api/sessions                  세션 생성 (스크립트 업로드)
- GET    /api/sessions                  세션 목록
- GET    /api/sessions/{id}             세션 상세
- DELETE /api/sessions/{id}             세션 삭제
- POST   /api/sessions/{id}/preview     Preview 예측 저장
- POST   /api/sessions/{id}/skip-preview  Preview 건너뛰기
- GET    /api/sessions/{id}/probe       Probe 질문 생성
- POST   /api/sessions/{id}/answer      답변 제출 → 분석 + Deliver
- POST   /api/sessions/{id}/discuss     Discuss Q&A
- GET    /api/sessions/{id}/challenge   Challenge 질문 생성
- POST   /api/sessions/{id}/challenge   Challenge 답변 → 피드백
- POST   /api/sessions/{id}/skip-challenge  Challenge 건너뛰기
- GET    /api/sessions/{id}/constellation  Knowledge Constellation 데이터
"""

from __future__ import annotations

import logging
import shutil

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from server.config import settings
from server.models import (
    DepthLabel,
    EventRequest,
    Phase,
    PreviewRequest,
    Session,
    SessionEvent,
    UserMessageRequest,
)
from server.llm.cli_backend import CLIBackend
from server.orchestrator import Orchestrator
from server.script_loader import read_script, save_upload
from server import session_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Academic Architect", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM 백엔드 (현재 CLI만 구현)
backend = CLIBackend()


def _get_orchestrator(session_id: str) -> Orchestrator:
    try:
        session = session_store.load(session_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Session not found: {session_id}")
    return Orchestrator(session, backend)


# ── 세션 CRUD ──


@app.post("/api/sessions")
async def create_session(file: UploadFile):
    """스크립트 업로드 → 세그먼트 분할 → 세션 생성."""
    if not file.filename:
        raise HTTPException(400, "파일명이 없습니다")

    content = await file.read()
    path = await save_upload(file.filename, content)
    script_text = read_script(path)

    session = Session(
        title=path.stem,
        script_filename=file.filename,
        setup_state="pending",
    )
    session_store.save(session)

    orch = Orchestrator(session, backend)
    try:
        segments = await orch.segment_script(script_text)
    except Exception as exc:
        logger.exception("Session bootstrap failed: %s", session.id)
        session.setup_state = "error"
        session.error_message = str(exc)
        session_store.save(session)
        raise HTTPException(500, f"세션 초기화 실패: {exc}")

    return {
        "session_id": session.id,
        "title": session.title,
        "segment_count": len(segments),
        "setup_state": session.setup_state,
        "segments": [
            {"id": s.id, "title": s.title, "core_concept": s.core_concept}
            for s in segments
        ],
    }


@app.get("/api/sessions")
async def list_sessions():
    sessions = session_store.list_sessions()
    result = []
    for s in sessions:
        # 평균 깊이 계산 (§G-6: 숫자 아닌 서술적 레이블로 표시)
        completed_states = [st for st in s.segment_states if st.completed]
        if completed_states:
            avg_level = sum(st.level_info.level for st in completed_states) / len(completed_states)
            avg_depth_label = DepthLabel.from_level(round(avg_level)).value
        else:
            avg_depth_label = None

        result.append({
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at,
            "segment_count": len(s.segments),
            "completed_count": s.completed_count,
            "completed": s.completed,
            "cost_usd": s.cost_usd,
            "phase": s.phase.value,
            "setup_state": s.setup_state,
            "error_message": s.error_message,
            "avg_depth_label": avg_depth_label,
        })
    return result


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    orch = _get_orchestrator(session_id)
    s = orch.session
    return {
        "id": s.id,
        "title": s.title,
        "created_at": s.created_at,
        "phase": s.phase.value,
        "segments": [
            {"id": seg.id, "title": seg.title, "core_concept": seg.core_concept}
            for seg in s.segments
        ],
        "segment_states": [
            {
                "segment_id": st.segment_id,
                "phase": st.phase.value,
                "level": st.level_info.level,
                "depth_label": st.level_info.depth_label.value,
                "completed": st.completed,
                "preview_prediction": st.preview_prediction,
                "summary": st.summary,
                "messages": [
                    {
                        "id": m.id,
                        "role": m.role.value,
                        "content": m.content,
                        "timestamp": m.timestamp,
                        "phase": m.phase.value,
                        "metadata": m.metadata,
                    }
                    for m in st.messages
                ],
            }
            for st in s.segment_states
        ],
        "current_segment_index": s.current_segment_index,
        "completed_count": s.completed_count,
        "completed": s.completed,
        "cost_usd": s.cost_usd,
        "total_input_tokens": s.total_input_tokens,
        "total_output_tokens": s.total_output_tokens,
        "setup_state": s.setup_state,
        "error_message": s.error_message,
        "events": [
            {
                "timestamp": e.timestamp,
                "event_type": e.event_type,
                "segment_id": e.segment_id,
            }
            for e in s.events
        ],
        "preview_participation_rate": s.preview_participation_rate,
    }


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    session_store.delete(session_id)
    return {"ok": True}


# ── Preview (Phase 0) ──


@app.post("/api/sessions/{session_id}/preview")
async def save_preview(session_id: str, req: PreviewRequest):
    orch = _get_orchestrator(session_id)
    orch.save_prediction(req.prediction)
    return {"ok": True, "phase": orch.session.phase.value}


@app.post("/api/sessions/{session_id}/skip-preview")
async def skip_preview(session_id: str):
    orch = _get_orchestrator(session_id)
    orch.skip_preview()
    return {"ok": True, "phase": orch.session.phase.value}


# ── Probe (Phase 1) ──


@app.get("/api/sessions/{session_id}/probe")
async def get_probe(session_id: str):
    orch = _get_orchestrator(session_id)
    question = await orch.generate_probe()
    seg = orch.session.current_segment
    return {
        "question": question,
        "segment": {
            "id": seg.id if seg else 0,
            "title": seg.title if seg else "",
        },
        "phase": orch.session.phase.value,
    }


# ── Answer → Analyze → (Hint →) Deliver ──


@app.post("/api/sessions/{session_id}/answer")
async def submit_answer(session_id: str, req: UserMessageRequest):
    orch = _get_orchestrator(session_id)

    # 1. 답변 분석
    result = await orch.analyze_answer(req.content)

    # 2. L0~L1 → 힌트
    hint = None
    if result.level <= 1 and not _already_hinted(orch):
        hint = await orch.generate_hint()
        return {
            "phase": "hinting",
            "level": result.level,
            "confidence": result.confidence,
            "hint": hint,
            "needs_reanswer": True,
        }

    # 3. Deliver
    delivery = await orch.deliver()

    return {
        "phase": orch.session.phase.value,
        "level": result.level,
        "confidence": result.confidence,
        "depth_label": DepthLabel.from_level(result.level).value,
        "delivery": delivery,
        "needs_reanswer": False,
    }


def _already_hinted(orch: Orchestrator) -> bool:
    state = orch.session.current_state
    if not state:
        return False
    return any(m.phase == Phase.HINTING for m in state.messages)


# ── Discuss (Phase 3) ──


@app.post("/api/sessions/{session_id}/discuss")
async def discuss(session_id: str, req: UserMessageRequest):
    orch = _get_orchestrator(session_id)
    result = await orch.discuss(req.content)

    response = {
        "reply": result.get("reply", ""),
        "cross_segment_link": result.get("cross_segment_link", False),
        "end_segment": result.get("end_segment", False),
        "phase": orch.session.phase.value,
    }

    # 세그먼트 종료 시 추가 정보
    if result.get("end_segment"):
        response["next_phase"] = orch.session.phase.value
        if orch.session.phase == Phase.CHALLENGE_PROMPT:
            response["challenge_available"] = True

    return response


# ── Next Segment (명시적 전환) ──


@app.post("/api/sessions/{session_id}/next-segment")
async def next_segment(session_id: str):
    """Discuss에서 명시적으로 다음 세그먼트로 전환."""
    orch = _get_orchestrator(session_id)
    await orch.advance_from_discuss()
    return {
        "ok": True,
        "phase": orch.session.phase.value,
        "current_segment_index": orch.session.current_segment_index,
    }


# ── Challenge (§G-5) ──


@app.get("/api/sessions/{session_id}/challenge")
async def get_challenge(session_id: str):
    orch = _get_orchestrator(session_id)
    question = await orch.generate_challenge()
    return {"question": question}


@app.post("/api/sessions/{session_id}/challenge")
async def submit_challenge(session_id: str, req: UserMessageRequest):
    orch = _get_orchestrator(session_id)
    feedback = await orch.challenge_feedback("", req.content)
    return {
        "feedback": feedback,
        "phase": orch.session.phase.value,
    }


@app.post("/api/sessions/{session_id}/finish-challenge")
async def finish_challenge(session_id: str):
    """챌린지 피드백 확인 후 다음 세그먼트로 진행."""
    orch = _get_orchestrator(session_id)
    orch.finish_challenge()
    return {"ok": True, "phase": orch.session.phase.value}


@app.post("/api/sessions/{session_id}/skip-challenge")
async def skip_challenge(session_id: str):
    orch = _get_orchestrator(session_id)
    orch.skip_challenge()
    return {"ok": True, "phase": orch.session.phase.value}


# ── Constellation (§G-2) ──


@app.get("/api/sessions/{session_id}/constellation")
async def get_constellation(session_id: str):
    orch = _get_orchestrator(session_id)
    data = orch.get_constellation()
    return data.model_dump()


# ── Events (§G-7 KPI) ──



@app.post("/api/sessions/{session_id}/events")
async def log_event(session_id: str, req: EventRequest):
    """KPI 이벤트 기록 — Preview 참여율, Discuss 전환률 등."""
    try:
        session = session_store.load(session_id)
    except FileNotFoundError:
        raise HTTPException(404, f"Session not found: {session_id}")

    event = SessionEvent(
        event_type=req.event_type,
        segment_id=req.segment_id,
        metadata=req.metadata,
    )
    session.events.append(event)
    session_store.save(session)
    return {"ok": True}


# ── Health ──


@app.get("/api/health")
async def health():
    return {"status": "ok", "backend": settings.LLM_BACKEND}


@app.get("/api/status")
async def status():
    cli_path = shutil.which("claude")
    return {
        "backend": settings.LLM_BACKEND,
        "server_ok": True,
        "llm_ready": bool(cli_path) if settings.LLM_BACKEND == "cli" else True,
        "cli_available": bool(cli_path),
        "cli_path": cli_path or "",
        "sessions_dir": str(settings.SESSIONS_DIR),
        "uploads_dir": str(settings.UPLOADS_DIR),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
