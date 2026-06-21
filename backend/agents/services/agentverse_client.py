"""Send ChatMessages to hosted Agentverse agents via a temporary relay."""

from __future__ import annotations

import logging
import os

from agents.config import AGENTVERSE_API_KEY, COORDINATOR_ADDRESS
from agents.services.agentverse_relay import run_relay_chat

logger = logging.getLogger("jugaad.agentverse_client")

DEFAULT_WAIT = int(os.getenv("AGENTVERSE_CHAT_WAIT", "45"))


def chat_with_coordinator(user_message: str, *, session_id: str) -> dict:
    """
    Message the Jugaad Coordinator on Agentverse and return parsed text.

    Returns dict with keys: status ('success' | 'timeout' | 'error' | 'skipped'), text?, error?
    """
    if os.getenv("AGENTVERSE_CHAT_ENABLED", "1").strip().lower() in ("0", "false", "no"):
        return {"status": "skipped", "error": "AGENTVERSE_CHAT_ENABLED=0"}

    api_key = AGENTVERSE_API_KEY.strip()
    target = COORDINATOR_ADDRESS.strip()
    if not api_key:
        return {"status": "skipped", "error": "AGENTVERSE_API_KEY not set"}
    if not target:
        return {"status": "skipped", "error": "COORDINATOR_ADDRESS not set"}

    try:
        return run_relay_chat(
            api_key,
            target,
            user_message,
            wait_seconds=DEFAULT_WAIT,
            session_id=session_id,
        )
    except Exception as exc:
        logger.exception("Agentverse chat failed")
        return {"status": "error", "error": str(exc)}
