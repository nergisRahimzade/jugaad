"""Redis vector search over jugaad hacks — falls back to static knowledge."""

from __future__ import annotations

import json
import os
from typing import Any

from ..knowledge import DOMAIN_KNOWLEDGE

REDIS_URL = os.getenv("REDIS_URL", "")

_client: Any | None = None


def _get_client() -> Any | None:
    global _client
    if not REDIS_URL:
        return None
    if _client is not None:
        return _client
    try:
        import redis

        _client = redis.from_url(REDIS_URL, decode_responses=True)
        _client.ping()
        return _client
    except Exception:
        return None


def search_hacks(domain: str, query: str, limit: int = 5) -> list[str] | None:
    """Return hack strings from Redis if available, else None (caller uses static)."""
    client = _get_client()
    if client is None:
        return None

    cache_key = f"jugaad:search:{domain}:{query[:80].lower()}"
    cached = client.get(cache_key)
    if cached:
        return json.loads(cached)

    index_key = f"jugaad:hacks:{domain}"
    if not client.exists(index_key):
        seed_redis_from_static(client)

    try:
        results = client.ft(f"jugaad_{domain}").search(query, limit=limit)
        hacks = [doc.hacks for doc in results.docs if hasattr(doc, "hacks")]
        if hacks:
            client.setex(cache_key, 3600, json.dumps(hacks))
            return hacks
    except Exception:
        pass

    static = DOMAIN_KNOWLEDGE.get(domain, {}).get("recommendations", [])
    return static[:limit] if static else None


def seed_redis_from_static(client: Any) -> None:
    """Seed Redis hashes from static knowledge (Person 3 can replace with vectors)."""
    for domain, data in DOMAIN_KNOWLEDGE.items():
        key = f"jugaad:hacks:{domain}"
        for idx, hack in enumerate(data.get("recommendations", [])):
            client.hset(key, f"hack_{idx}", hack)
        client.hset(key, "summary", data.get("summary", ""))
