"""스크립트 파일 로딩 + 인코딩 감지.

지원 형식: .txt, .md, .srt
chardet로 인코딩 자동 감지.
"""

from __future__ import annotations

import logging
from pathlib import Path

import chardet

from server.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".txt", ".md", ".srt"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_file(filename: str, size: int) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"지원하지 않는 형식: {ext}. "
            f"허용: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if size > MAX_FILE_SIZE:
        raise ValueError(f"파일 크기 초과: {size / 1024 / 1024:.1f}MB (최대 5MB)")


async def save_upload(filename: str, content: bytes) -> Path:
    """업로드 파일을 data/uploads/ 에 저장하고 경로 반환."""
    validate_file(filename, len(content))
    dest = settings.UPLOADS_DIR / filename
    dest.write_bytes(content)
    logger.info("Saved upload: %s (%d bytes)", dest, len(content))
    return dest


def read_script(path: Path) -> str:
    """파일을 읽어 텍스트 반환. 인코딩 자동 감지."""
    raw = path.read_bytes()
    detected = chardet.detect(raw)
    encoding = detected.get("encoding") or "utf-8"
    logger.info("Detected encoding: %s (confidence: %.2f)", encoding, detected.get("confidence", 0))

    text = raw.decode(encoding, errors="replace")

    # SRT 파일: 타임스탬프 + 번호 제거
    if path.suffix.lower() == ".srt":
        text = _strip_srt(text)

    return text.strip()


def _strip_srt(text: str) -> str:
    """SRT 자막에서 번호와 타임스탬프를 제거하고 텍스트만 추출."""
    import re
    lines = text.split("\n")
    result = []
    for line in lines:
        line = line.strip()
        # 순번 (숫자만 있는 줄)
        if re.match(r"^\d+$", line):
            continue
        # 타임스탬프 (00:00:00,000 --> 00:00:00,000)
        if re.match(r"\d{2}:\d{2}:\d{2}", line):
            continue
        if line:
            result.append(line)
    return " ".join(result)
