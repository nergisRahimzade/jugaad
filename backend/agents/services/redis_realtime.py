"""Realtime peer-to-peer queues backed by Redis.

Two flagship demo features from Section 5 of the strategy doc live here:

* **Food surplus network** — a Redis Stream of postings
  ("12 servings of pasta, Soda Hall lobby, available next 45 min"). Consumers
  pop the oldest still-available posting; we expire entries past their window.
* **Walking-buddy matching** (Problem 5, Hack 1) — a geo-indexed sorted set of
  pending walking requests. We match by destination + departure time so
  late-night students walking the same direction can group up.

Both features are *demo-critical*: the walking-buddy match and the food-surplus
notification are the moments Demo Script 1 & 2 in the doc are built around.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any

from core.config import settings

from .redis_schema import REALTIME_KEYS

logger = logging.getLogger("jugaad.redis_realtime")

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
        logger.warning("Realtime Redis backend unavailable (%s)", exc)
        return None


# ---------------------------------------------------------------------------
# Food surplus stream
# ---------------------------------------------------------------------------


def post_food_surplus(
    item: str,
    location: str,
    servings: int,
    available_minutes: int,
    poster: str = "anonymous",
    notes: str = "",
) -> dict[str, Any] | None:
    """Append a surplus posting onto the food stream.

    We use ``XADD`` with a stream so consumers can tail in real time (the
    frontend ``AgentActivityFeed`` subscribes via SSE).
    """
    client = _get_client()
    if client is None:
        return None
    expires_at = int(time.time()) + max(60, available_minutes * 60)
    posting = {
        "id": str(uuid.uuid4()),
        "item": item,
        "location": location,
        "servings": str(servings),
        "available_until": str(expires_at),
        "poster": poster,
        "notes": notes,
    }
    try:
        client.xadd(REALTIME_KEYS["food_surplus_stream"], posting, maxlen=200, approximate=True)
        return posting
    except Exception as exc:
        logger.warning("Food stream XADD failed (%s)", exc)
        return None


def list_active_food_surplus(limit: int = 20) -> list[dict[str, Any]]:
    """Return the most recent active surplus postings."""
    client = _get_client()
    if client is None:
        return []
    now = int(time.time())
    try:
        entries = client.xrevrange(REALTIME_KEYS["food_surplus_stream"], count=limit)
    except Exception:
        return []
    active = []
    for _entry_id, payload in entries:
        if int(payload.get("available_until", "0")) > now:
            active.append(payload)
    return active


# ---------------------------------------------------------------------------
# Walking-buddy matching
# ---------------------------------------------------------------------------


def join_walking_buddy(
    user_id: str,
    origin: str,
    destination: str,
    leaving_at: int,
    lat: float | None = None,
    lon: float | None = None,
) -> str | None:
    """Add a request to the walking-buddy queue, scored by departure time."""
    client = _get_client()
    if client is None:
        return None
    request_id = str(uuid.uuid4())
    payload = {
        "request_id": request_id,
        "user_id": user_id,
        "origin": origin,
        "destination": destination,
        "leaving_at": leaving_at,
        "lat": lat,
        "lon": lon,
    }
    pipe = client.pipeline()
    pipe.zadd(REALTIME_KEYS["walking_buddy_queue"], {json.dumps(payload): leaving_at})
    if lat is not None and lon is not None:
        try:
            pipe.geoadd(REALTIME_KEYS["walking_buddy_geo"], (lon, lat, request_id))
        except Exception:
            pass
    pipe.execute()
    return request_id


def find_walking_buddies(
    destination: str,
    leaving_at: int,
    window_minutes: int = 15,
) -> list[dict[str, Any]]:
    """Return pending requests heading to the same destination in a time window."""
    client = _get_client()
    if client is None:
        return []
    min_t = leaving_at - window_minutes * 60
    max_t = leaving_at + window_minutes * 60
    try:
        candidates = client.zrangebyscore(REALTIME_KEYS["walking_buddy_queue"], min_t, max_t)
    except Exception:
        return []
    matches: list[dict[str, Any]] = []
    for raw in candidates:
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if _normalize_destination(payload.get("destination", "")) == _normalize_destination(destination):
            matches.append(payload)
    return matches


def _normalize_destination(text: str) -> str:
    return "".join(ch for ch in text.lower().strip() if ch.isalnum() or ch.isspace())


# ---------------------------------------------------------------------------
# Berkeley Problem Map counter — anonymous domain reports
# ---------------------------------------------------------------------------


def record_problem(domain: str) -> int:
    """Increment the per-domain problem counter that powers the Problem Map."""
    client = _get_client()
    if client is None:
        return 0
    try:
        return int(client.hincrby(REALTIME_KEYS["problem_map_counter"], domain, 1))
    except Exception:
        return 0


def problem_map_snapshot() -> dict[str, int]:
    client = _get_client()
    if client is None:
        return {}
    try:
        raw = client.hgetall(REALTIME_KEYS["problem_map_counter"])
    except Exception:
        return {}
    return {k: int(v) for k, v in raw.items()}


def stats() -> dict[str, Any]:
    client = _get_client()
    if client is None:
        return {"available": False}
    try:
        food_count = client.xlen(REALTIME_KEYS["food_surplus_stream"])
    except Exception:
        food_count = 0
    try:
        buddy_count = client.zcard(REALTIME_KEYS["walking_buddy_queue"])
    except Exception:
        buddy_count = 0
    return {
        "available": True,
        "food_surplus_pending": food_count,
        "walking_buddy_pending": buddy_count,
    }
