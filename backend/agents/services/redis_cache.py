"""Semantic LLM cache backed by RedisVL.

Repeat queries like "how do I get CalFresh?" cost real Claude tokens and real
seconds of latency at demo time. RedisVL's ``SemanticCache`` short-circuits those
calls by embedding each prompt and matching it against previously answered
prompts under a cosine distance threshold.

We intentionally keep the surface tiny: ``check`` and ``store``. The wider
``response_builder`` doesn't need to know whether the hit came from cache or LLM.
"""

from __future__ import annotations

import logging
from typing import Any

from core.config import settings

from .redis_schema import SEMCACHE_INDEX_NAME, SEMCACHE_PREFIX

logger = logging.getLogger("jugaad.redis_cache")

_cache: Any | None = None


def _get_cache():
    global _cache
    if _cache is not None:
        return _cache
    if not settings.redis_url:
        return None
    try:
        from redisvl.extensions.llmcache import SemanticCache
        from redisvl.utils.vectorize import HFTextVectorizer

        _cache = SemanticCache(
            name=SEMCACHE_INDEX_NAME,
            prefix=SEMCACHE_PREFIX,
            redis_url=settings.redis_url,
            distance_threshold=settings.redis_semantic_cache_threshold,
            vectorizer=HFTextVectorizer(model="sentence-transformers/all-MiniLM-L6-v2"),
            ttl=60 * 60 * 6,
        )
        return _cache
    except Exception as exc:
        logger.warning("Semantic cache unavailable (%s)", exc)
        return None


def check(prompt: str) -> dict[str, Any] | None:
    """Return the cached response payload if a semantically similar prompt exists."""
    cache = _get_cache()
    if cache is None:
        return None
    try:
        hits = cache.check(prompt=prompt, num_results=1)
    except Exception as exc:
        logger.warning("Cache lookup failed (%s)", exc)
        return None
    if not hits:
        return None
    hit = hits[0]
    response = hit.get("response")
    if response is None:
        return None
    return {
        "response": response,
        "cached_prompt": hit.get("prompt"),
        "distance": hit.get("vector_distance"),
        "metadata": hit.get("metadata") or {},
    }


def store(prompt: str, response: str, metadata: dict[str, Any] | None = None) -> bool:
    """Persist a (prompt, response) pair so the next semantically-similar prompt hits cache."""
    cache = _get_cache()
    if cache is None:
        return False
    try:
        cache.store(prompt=prompt, response=response, metadata=metadata or {})
        return True
    except Exception as exc:
        logger.warning("Cache store failed (%s)", exc)
        return False


def stats() -> dict[str, Any]:
    cache = _get_cache()
    if cache is None:
        return {"available": False}
    return {
        "available": True,
        "threshold": settings.redis_semantic_cache_threshold,
        "name": SEMCACHE_INDEX_NAME,
    }
