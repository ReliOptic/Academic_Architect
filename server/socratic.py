"""소크라테스식 닫음 판정 — *결과를 측정하기 위한* 가벼운 휴리스틱.

Deliver/Discuss/Hint 메시지가 질문/사고실험으로 닫혔는지를 단순 규칙으로 판별.
프롬프트가 의도대로 작동하는지 보고서·텔레메트리에서 확인하기 위해 쓴다.
"""

from __future__ import annotations

import re

# 닫음 판정 시 무시할 꼬리 (이모지, 닫는 따옴표/괄호, 공백)
_TRAILING = re.compile(r"[\s\"'’”)\]}】〉》」』·.…!~ㅋㅎ]+$")


def _last_sentence(text: str) -> str:
    """텍스트의 *의미 있는 마지막 문장*을 추출."""
    if not text:
        return ""
    cleaned = text.strip()
    # 코드펜스/JSON 블록을 제거해 본문 마무리만 본다
    cleaned = re.sub(r"```[\s\S]*?```", "", cleaned).strip()
    if not cleaned:
        return ""
    # 한국어/영어 문장 종결자 기준 분할 후 끝에서 비어있지 않은 것 채택
    parts = re.split(r"(?<=[.!?。?！])\s+", cleaned)
    for s in reversed(parts):
        s = s.strip()
        if s:
            return s
    return cleaned


def is_socratic_closing(text: str) -> bool:
    """텍스트가 질문(또는 사고실험)으로 닫혔는지 휴리스틱 판정.

    규칙:
    - 마지막 문장에 ``?`` 또는 한국어 ``？`` 가 포함되어 있으면 True.
    - 이모지/공백/마침표 등 꼬리는 제거하고 판단.
    """
    last = _last_sentence(text)
    if not last:
        return False
    last = _TRAILING.sub("", last)
    return "?" in last or "？" in last
