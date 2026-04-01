from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncIterator

from server.config import settings
from server.models import LLMUsage
from server.llm.base import LLMBackend

logger = logging.getLogger(__name__)


class CLIBackend(LLMBackend):
    """경로 A: Claude Code CLI subprocess 백엔드.

    `claude -p` 를 subprocess 로 호출한다.
    구독 기반이므로 API 키 불필요.

    ACR-1 실제 응답 구조:
    {
      "result": "응답 텍스트",
      "usage": {
        "inputTokens": 1234,       # CamelCase, 중첩
        "outputTokens": 567
      },
      "total_cost_usd": 0.0042,    # 최상위, snake_case
      "session_id": "..."
    }
    """

    def _build_cmd(
        self,
        prompt: str,
        system: str,
        model: str | None,
        output_format: str = "json",
    ) -> list[str]:
        cmd = [
            "claude", "-p", prompt,
            "--output-format", output_format,
            "--verbose",
            "--max-turns", "1",
        ]
        if model:
            cmd.extend(["--model", model])
        if system:
            cmd.extend(["--system-prompt", system])
        return cmd

    @staticmethod
    def _parse_usage(data: dict) -> LLMUsage:
        """ACR-1 필드 매핑: 중첩 CamelCase → LLMUsage."""
        usage = data.get("usage", {})
        return LLMUsage(
            input_tokens=usage.get("inputTokens", 0),
            output_tokens=usage.get("outputTokens", 0),
            cost_usd=data.get("total_cost_usd", 0.0),
            model=data.get("model", settings.CLI_MODEL),
            session_id=data.get("session_id", ""),
        )

    async def call(
        self,
        prompt: str,
        system: str = "",
        model: str | None = None,
    ) -> tuple[str, LLMUsage]:
        cmd = self._build_cmd(prompt, system, model, output_format="json")

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=settings.CLI_TIMEOUT,
        )

        if proc.returncode != 0:
            err = stderr.decode().strip()
            logger.error("CLI subprocess failed (rc=%d): %s", proc.returncode, err)
            raise RuntimeError(f"Claude CLI error: {err}")

        data = json.loads(stdout.decode())
        text = data.get("result", "")
        usage = self._parse_usage(data)
        return text, usage

    async def stream(
        self,
        prompt: str,
        system: str = "",
        model: str | None = None,
    ) -> AsyncIterator[str]:
        cmd = self._build_cmd(prompt, system, model, output_format="stream-json")

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        assert proc.stdout is not None
        async for raw_line in proc.stdout:
            line = raw_line.decode().strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                # stream-json 형식: {"type": "assistant", "content": "..."} 등
                if event.get("type") == "assistant":
                    content = event.get("content", "")
                    if content:
                        yield content
            except json.JSONDecodeError:
                logger.debug("Non-JSON stream line: %s", line[:100])

        await proc.wait()
