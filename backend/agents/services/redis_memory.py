"""Student memory backed by managed Redis Cloud Agent Memory.

Two tiers, exactly the ones the managed service models for us:

* **Working memory** — session-scoped conversation/intake state. We stash the
  live intake JSON as a session event so it can be replayed next visit.
* **Long-term memory** — searchable per-user facts ("qualifies for CalFresh",
  "off-campus near Telegraph") surfaced semantically on the next visit.

This wraps the official ``redis-agent-memory`` SDK (``AgentMemory``), which talks
directly to the hosted ``*.memory.redis.io`` service. The service requires a
``store_id`` alongside the API key — without it the edge rejects every request
with an nginx 403. The SDK is synchronous, so the FastAPI routes can call us
directly with no event-loop juggling.

The public surface (``put_session`` / ``get_session`` / ``add_fact`` /
``search_facts`` / ``stats``) is unchanged so existing callers keep working.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Any

from core.config import settings

logger = logging.getLogger("jugaad.redis_memory")

_client_lock = Lock()
_client: Any | None = None
_disabled: bool = False

# Actor used for session events that carry raw intake state rather than a real
# conversational turn. Kept stable so a session round-trips deterministically.
_SESSION_ACTOR = f"{settings.redis_index_prefix}-session"


def _get_client():
    """Lazily build the managed Agent Memory client.

    Returns ``None`` when the service isn't fully configured (URL + store_id),
    so callers degrade gracefully instead of raising.
    """
    global _client, _disabled
    if _disabled:
        return None
    if _client is not None:
        return _client
    if not (settings.redis_agent_mem_url and settings.redis_agent_mem_store_id):
        _disabled = True
        return None
    with _client_lock:
        if _client is not None:
            return _client
        try:
            from redis_agent_memory import AgentMemory

            _client = AgentMemory(
                settings.redis_agent_mem_url,
                api_key=settings.redis_agent_mem_api_key or None,
                store_id=settings.redis_agent_mem_store_id,
                timeout_ms=15000,
            )
            return _client
        except Exception as exc:
            logger.warning("Agent Memory client unavailable (%s)", exc)
            _disabled = True
            return None


def _message_role():
    from redis_agent_memory import models as m

    return m.MessageRole


# ---------------------------------------------------------------------------
# Working memory (session)
# ---------------------------------------------------------------------------


def put_session(session_id: str, payload: dict[str, Any]) -> bool:
    """Persist a session's working-memory payload as a session event.

    The managed service models working memory as a stream of events, so we
    serialise the intake dict into one USER event. :func:`get_session` reverses
    this to return the original dict.
    """
    client = _get_client()
    if client is None:
        return False
    try:
        client.add_session_event(
            actor_id=_SESSION_ACTOR,
            session_id=session_id,
            role=_message_role().USER,
            content=[{"text": json.dumps(payload, default=str)}],
            created_at=datetime.now(timezone.utc),
        )
        return True
    except Exception as exc:
        logger.warning("AMS add_session_event(%s) failed: %s", session_id, exc)
        return False


def get_session(session_id: str) -> dict[str, Any]:
    """Return the most recent working-memory payload for ``session_id``.

    We read the session's events and parse the latest one that round-trips as
    JSON (i.e. was written by :func:`put_session`).
    """
    client = _get_client()
    if client is None:
        return {}
    try:
        from redis_agent_memory.errors import NotFoundErrorResponseContent

        try:
            saved = client.get_session_memory(session_id=session_id)
        except NotFoundErrorResponseContent:
            return {}
    except Exception as exc:
        logger.warning("AMS get_session_memory(%s) failed: %s", session_id, exc)
        return {}

    events = getattr(saved, "events", None) or []
    for event in reversed(events):
        content = getattr(event, "content", None) or []
        if not content:
            continue
        text = getattr(content[0], "text", None)
        if not text:
            continue
        try:
            parsed = json.loads(text)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(parsed, dict):
            return parsed
    return {}


# ---------------------------------------------------------------------------
# Long-term memory (per-user facts)
# ---------------------------------------------------------------------------


def add_fact(user_id: str, fact: str, *, topics: list[str] | None = None) -> bool:
    client = _get_client()
    if client is None:
        return False
    memory: dict[str, Any] = {
        "id": uuid.uuid4().hex,
        "owner_id": user_id,
        "text": fact,
    }
    if topics:
        memory["topics"] = topics
    try:
        client.bulk_create_long_term_memories(memories=[memory])
        return True
    except Exception as exc:
        # Retry without optional topics if the service rejects the extra field.
        if topics:
            memory.pop("topics", None)
            try:
                client.bulk_create_long_term_memories(memories=[memory])
                return True
            except Exception as exc2:
                logger.warning("AMS create_long_term_memory retry failed: %s", exc2)
                return False
        logger.warning("AMS create_long_term_memory failed: %s", exc)
        return False


def search_facts(user_id: str, query: str, *, limit: int = 5) -> list[dict[str, Any]]:
    client = _get_client()
    if client is None:
        return []
    try:
        result = client.search_long_term_memory(
            request={
                "text": query,
                "limit": limit,
                "filter": {"ownerId": {"eq": user_id}},
            }
        )
    except Exception as exc:
        logger.warning("AMS search_long_term_memory failed: %s", exc)
        return []
    items = getattr(result, "items", None) or []
    return [_coerce_dict(item) for item in items]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _coerce_dict(obj: Any) -> dict[str, Any]:
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    for method in ("model_dump", "dict"):
        if hasattr(obj, method):
            try:
                return getattr(obj, method)()
            except Exception:
                pass
    text = getattr(obj, "text", None)
    return {"text": text} if text is not None else {}


def stats() -> dict[str, Any]:
    return {
        "available": _get_client() is not None,
        "namespace": settings.redis_index_prefix,
        "base_url": settings.redis_agent_mem_url or None,
        "store_id": settings.redis_agent_mem_store_id or None,
    }
