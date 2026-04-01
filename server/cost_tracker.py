"""비용 추적.

세션별 input/output 토큰 및 USD 비용 누적.
"""

from __future__ import annotations

import logging

from server.models import LLMUsage, Session

logger = logging.getLogger(__name__)


def accumulate(session: Session, usage: LLMUsage) -> None:
    """사용량을 세션에 누적."""
    session.total_input_tokens += usage.input_tokens
    session.total_output_tokens += usage.output_tokens
    session.cost_usd += usage.cost_usd
    logger.debug(
        "Cost +$%.4f (in=%d, out=%d) → total $%.4f",
        usage.cost_usd,
        usage.input_tokens,
        usage.output_tokens,
        session.cost_usd,
    )
