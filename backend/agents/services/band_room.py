"""Band shared room for cross-agent context — SDK/REST when configured, in-memory fallback."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger("jugaad.band")

BAND_API_KEY = os.getenv("BAND_API_KEY", "")
BAND_ROOM_ID = os.getenv("BAND_ROOM_ID", "")
BAND_HANDLE = os.getenv("BAND_HANDLE", "")
BAND_REST_URL = os.getenv("BAND_REST_URL", "https://app.band.ai")

_sessions: dict[str, list[dict[str, Any]]] = {}
_resolved_chat_id: str | None = None

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


def _band_headers() -> dict[str, str]:
    return {"X-API-Key": BAND_API_KEY, "Content-Type": "application/json"}


def _resolve_chat_id() -> str | None:
    """Return a valid Band chat room id (env, list, or create)."""
    global _resolved_chat_id
    if _resolved_chat_id:
        return _resolved_chat_id
    if not BAND_API_KEY:
        return None

    if BAND_ROOM_ID:
        try:
            resp = httpx.get(
                f"{BAND_REST_URL}/api/v1/agent/chats/{BAND_ROOM_ID}",
                headers=_band_headers(),
                timeout=8.0,
            )
            if resp.status_code == 200:
                _resolved_chat_id = BAND_ROOM_ID
                return _resolved_chat_id
            logger.warning(
                "BAND_ROOM_ID %s is not a chat room (HTTP %s) — resolving another",
                BAND_ROOM_ID[:8],
                resp.status_code,
            )
        except Exception as exc:
            logger.warning("Band chat lookup failed: %s", exc)

    try:
        resp = httpx.get(
            f"{BAND_REST_URL}/api/v1/agent/chats",
            headers=_band_headers(),
            timeout=8.0,
        )
        resp.raise_for_status()
        chats = resp.json().get("data") or []
        if chats:
            _resolved_chat_id = chats[0]["id"]
            logger.info("Using existing Band chat %s", _resolved_chat_id[:8])
            return _resolved_chat_id
    except Exception as exc:
        logger.warning("Band list chats failed: %s", exc)

    try:
        resp = httpx.post(
            f"{BAND_REST_URL}/api/v1/agent/chats",
            headers=_band_headers(),
            json={"chat": {}},
            timeout=8.0,
        )
        resp.raise_for_status()
        _resolved_chat_id = resp.json()["data"]["id"]
        logger.info(
            "Created Band chat %s — set BAND_ROOM_ID in .env to persist",
            _resolved_chat_id,
        )
        return _resolved_chat_id
    except Exception as exc:
        logger.warning("Band create chat failed: %s", exc)
        return None


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

    if BAND_API_KEY:
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
    """Post cross-agent insight to Band room via Agent API events endpoint."""
    chat_id = _resolve_chat_id()
    if not chat_id:
        return

    prefix = BAND_HANDLE or "jugaad"
    content = (
        f"[{event['agent']}] {event['insight']}: {event['summary']} "
        f"(triggers: {', '.join(event['triggers']) or 'none'})"
    )
    url = f"{BAND_REST_URL}/api/v1/agent/chats/{chat_id}/events"
    try:
        resp = httpx.post(
            url,
            headers=_band_headers(),
            json={
                "event": {
                    "content": content,
                    "message_type": "thought",
                    "metadata": {
                        "session_id": session_id,
                        "agent": event["agent"],
                        "triggers": event["triggers"],
                        "room": prefix,
                    },
                }
            },
            timeout=8.0,
        )
        resp.raise_for_status()
        logger.info("Band event posted (chat %s)", chat_id[:8])
    except Exception as exc:
        logger.warning("Band REST post failed (using in-memory room): %s", exc)
