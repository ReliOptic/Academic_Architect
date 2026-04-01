"""세션 영속화 — JSON 파일 기반.

data/sessions/{session_id}.json 에 저장/로드.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from server.config import settings
from server.models import Session

logger = logging.getLogger(__name__)


def _path(session_id: str) -> Path:
    return settings.SESSIONS_DIR / f"{session_id}.json"


def save(session: Session) -> None:
    path = _path(session.id)
    path.write_text(session.model_dump_json(indent=2), encoding="utf-8")
    logger.debug("Session saved: %s", path)


def load(session_id: str) -> Session:
    path = _path(session_id)
    if not path.exists():
        raise FileNotFoundError(f"Session not found: {session_id}")
    data = json.loads(path.read_text(encoding="utf-8"))
    return Session.model_validate(data)


def list_sessions() -> list[Session]:
    """모든 세션 목록 반환 (최신순)."""
    sessions = []
    for p in sorted(settings.SESSIONS_DIR.glob("*.json"), reverse=True):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            sessions.append(Session.model_validate(data))
        except Exception as e:
            logger.warning("Failed to load session %s: %s", p.name, e)
    return sessions


def delete(session_id: str) -> None:
    path = _path(session_id)
    if path.exists():
        path.unlink()
        logger.info("Session deleted: %s", session_id)
