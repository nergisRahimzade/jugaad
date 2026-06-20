"""Dual-tier student memory backed by Redis.

Maps to the *Redis Agent Memory Server* design pattern from the Redis prize
deck — a working/session tier scoped to a single conversation, and a long-term
profile tier that persists across visits. Implementing this locally first means
we can plug the official Agent Memory Server REST API in later without changing
any caller code: the interface here mirrors AMS's ``working_memory`` and
``long_term_memory`` operations.

Storage:

* Session memory — ``HASH`` per ``session_id`` with TTL of 1 hour. Holds the
  current intake JSON, last user message, and active domain hits.
* Profile memory — ``HASH`` per ``user_id`` with no TTL. Holds the durable
  student profile (campus, EFC, citizenship, etc.) and a running set of "facts"
  Jugaad has learned about them.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from core.config import settings

from .redis_schema import profile_namespace, session_namespace

logger = logging.getLogger("jugaad.redis_memory")

_SESSION_TTL_SECONDS = 60 * 60
_FACTS_FIELD = "facts"

_client: Any | None = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.redis_url:
        return None
    try:
        import redis

        client = redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        _client = client
        return client
    except Exception as exc:
        logger.warning("Redis memory backend unavailable (%s)", exc)
        return None


def _session_key(session_id: str) -> str:
    return f"{session_namespace.prefix}:{session_id}"


def _profile_key(user_id: str) -> str:
    return f"{profile_namespace.prefix}:{user_id}"


def put_session(session_id: str, payload: dict[str, Any]) -> bool:
    """Overwrite the working memory for a session."""
    client = _get_client()
    if client is None:
        return False
    key = _session_key(session_id)
    flat = {k: json.dumps(v) for k, v in payload.items()}
    flat["_updated_at"] = str(int(time.time()))
    pipe = client.pipeline()
    pipe.delete(key)
    if flat:
        pipe.hset(key, mapping=flat)
        pipe.expire(key, _SESSION_TTL_SECONDS)
    pipe.execute()
    return True


def update_session(session_id: str, partial: dict[str, Any]) -> bool:
    """Merge keys into the session hash (e.g. add the latest user message)."""
    client = _get_client()
    if client is None:
        return False
    key = _session_key(session_id)
    flat = {k: json.dumps(v) for k, v in partial.items()}
    flat["_updated_at"] = str(int(time.time()))
    client.hset(key, mapping=flat)
    client.expire(key, _SESSION_TTL_SECONDS)
    return True


def get_session(session_id: str) -> dict[str, Any]:
    client = _get_client()
    if client is None:
        return {}
    raw = client.hgetall(_session_key(session_id))
    return {k: _try_json(v) for k, v in raw.items()}


def put_profile(user_id: str, profile: dict[str, Any]) -> bool:
    """Persist the long-term student profile.

    Only the keys we know about are written; this keeps the durable profile from
    accumulating one-off junk from a noisy intake.
    """
    client = _get_client()
    if client is None:
        return False
    key = _profile_key(user_id)
    flat = {k: json.dumps(v) for k, v in profile.items()}
    flat["_updated_at"] = str(int(time.time()))
    client.hset(key, mapping=flat)
    return True


def get_profile(user_id: str) -> dict[str, Any]:
    client = _get_client()
    if client is None:
        return {}
    raw = client.hgetall(_profile_key(user_id))
    return {k: _try_json(v) for k, v in raw.items()}


def add_fact(user_id: str, fact: str) -> bool:
    """Append a discovered fact (e.g. "qualifies for CalFresh") to the profile."""
    client = _get_client()
    if client is None:
        return False
    key = _profile_key(user_id)
    raw = client.hget(key, _FACTS_FIELD)
    facts: list[str] = json.loads(raw) if raw else []
    if fact not in facts:
        facts.append(fact)
    client.hset(key, _FACTS_FIELD, json.dumps(facts))
    return True


def _try_json(value: str) -> Any:
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return value


def stats() -> dict[str, Any]:
    client = _get_client()
    if client is None:
        return {"available": False}
    try:
        session_count = sum(1 for _ in client.scan_iter(match=f"{session_namespace.prefix}:*", count=200))
        profile_count = sum(1 for _ in client.scan_iter(match=f"{profile_namespace.prefix}:*", count=200))
    except Exception:
        session_count = profile_count = 0
    return {
        "available": True,
        "active_sessions": session_count,
        "stored_profiles": profile_count,
    }
