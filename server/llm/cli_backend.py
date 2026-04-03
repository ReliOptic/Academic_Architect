from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import AsyncIterator

from server.config import settings
from server.models import LLMUsage
from server.llm.base import LLMBackend

logger = logging.getLogger(__name__)

# LLM 응답에서 마크다운 코드블록을 제거하고 순수 텍스트만 추출
_CODE_BLOCK_RE = re.compile(r"```(?:json)?\s*\n?(.*?)\n?\s*```", re.DOTALL)


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
            "--max-turns", "1",
        ]
        if model:
            cmd.extend(["--model", model])
        if system:
            cmd.extend(["--system-prompt", system])
        return cmd

    @staticmethod
    def _parse_usage(data: dict) -> LLMUsage:
        """Claude CLI 실제 응답 구조에서 usage 추출.

        CLI 응답은 두 가지 usage 위치를 가짐:
        1. data["usage"] — snake_case (input_tokens, output_tokens)
        2. data["modelUsage"][model] — camelCase (inputTokens, outputTokens)
        어느 쪽이든 처리.
        """
        usage = data.get("usage", {})
        # snake_case 우선 (실제 CLI 응답), camelCase fallback (이전 호환)
        input_t = (
            usage.get("input_tokens")
            or usage.get("inputTokens")
            or 0
        )
        output_t = (
            usage.get("output_tokens")
            or usage.get("outputTokens")
            or 0
        )

        # modelUsage에서도 시도 (cache 토큰 포함)
        model_usage = data.get("modelUsage", {})
        if model_usage and (input_t == 0 or output_t == 0):
            for _model, mu in model_usage.items():
                input_t = input_t or mu.get("inputTokens", 0)
                output_t = output_t or mu.get("outputTokens", 0)

        return LLMUsage(
            input_tokens=input_t,
            output_tokens=output_t,
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

        # Claude CLI는 결과를 마크다운 코드블록(```json ... ```)으로 감쌀 수 있음.
        # 호출자가 json.loads(text)를 기대하므로 코드블록을 제거.
        match = _CODE_BLOCK_RE.search(text)
        if match:
            text = match.group(1).strip()

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
