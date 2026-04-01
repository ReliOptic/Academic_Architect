from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncIterator

from server.models import LLMUsage


class LLMBackend(ABC):
    """LLM 백엔드 추상 인터페이스.

    경로 A (CLI subprocess) 와 경로 B (Anthropic API) 모두
    이 인터페이스를 구현한다.
    """

    @abstractmethod
    async def call(
        self,
        prompt: str,
        system: str = "",
        model: str | None = None,
    ) -> tuple[str, LLMUsage]:
        """단일 호출. (응답 텍스트, 사용량) 반환."""

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system: str = "",
        model: str | None = None,
    ) -> AsyncIterator[str]:
        """스트리밍 호출. 텍스트 청크를 yield."""
