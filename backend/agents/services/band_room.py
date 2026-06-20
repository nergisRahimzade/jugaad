"""Band shared room for cross-agent context — SDK/REST when configured, in-memory fallback."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger("jugaad.band")

BAND_API_KEY = os.getenv("BAND_API_KEY", "")
BAND_ROOM_ID = os.getenv("BAND_ROOM_ID", "")
BAND_REST_URL = os.getenv("BAND_REST_URL", "https://app.band.ai")

_sessions: dict[str, list[dict[str, Any]]] = {}

CROSS_DOMAIN_INSIGHTS: dict[str, dict[str, Any]] = {
    "financial_aid": {
        "insight": "Financial stress or aid gap detected",
        "triggers": ["food", "wellness"],
    },
    "food": {
        "insight": "Food insecurity may indicate unclaimed aid",
        "triggers": ["financial_aid", "scholarship"],
    },
    "academic": {
        "insight": "Academic struggle — mental health support recommended",
        "triggers": ["wellness", "financial_aid"],
    },
    "wellness": {
        "insight": "Mental health stress may affect aid eligibility or housing stability",
        "triggers": ["financial_aid"],
    },
    "scholarship": {
        "insight": "Scholarship search active — check fee payment plan if aid delayed",
        "triggers": ["financial_aid"],
    },
}


def create_session(session_id: str) -> None:
    _sessions.setdefault(session_id, [])


def publish(session_id: str, agent_domain: str, summary: str) -> list[str]:
    """Publish agent insight to Band room; return extra domains to notify."""
    meta = CROSS_DOMAIN_INSIGHTS.get(agent_domain, {})
    triggers = list(meta.get("triggers", []))
    insight = meta.get("insight", f"{agent_domain} agent responded")

    event = {
        "agent": agent_domain,
        "insight": insight,
        "summary": summary[:200],
        "triggers": triggers,
    }
    _sessions.setdefault(session_id, []).append(event)
    logger.info("Band room [%s]: %s → triggers %s", session_id[:8], insight, triggers)

    if BAND_API_KEY and BAND_ROOM_ID:
        _post_to_band(session_id, event)

    return triggers


def get_session_events(session_id: str) -> list[dict[str, Any]]:
    return _sessions.get(session_id, [])


def format_band_context(session_id: str) -> str:
    events = get_session_events(session_id)
    if not events:
        return ""
    lines = ["\n### Band cross-agent context"]
    for event in events:
        lines.append(
            f"- **{event['agent']}**: {event['insight']} → activated {', '.join(event['triggers'])}"
        )
    return "\n".join(lines)


def _post_to_band(session_id: str, event: dict[str, Any]) -> None:
    """Post agent event to Band room when API credentials are configured."""
    try:
        httpx.post(
            f"{BAND_REST_URL}/api/v1/chat_rooms/{BAND_ROOM_ID}/messages",
            headers={"Authorization": f"Bearer {BAND_API_KEY}"},
            json={
                "content": f"[Jugaad/{event['agent']}] {event['insight']}: {event['summary']}",
                "metadata": {"session_id": session_id, "triggers": event["triggers"]},
            },
            timeout=5.0,
        )
    except Exception as exc:
        logger.warning("Band REST post failed (using in-memory room): %s", exc)
