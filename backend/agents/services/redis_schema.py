"""RedisVL index schemas for Jugaad — vector search over hacks, semantic cache, sessions.

We define three distinct concerns:

1. ``hack_index_schema`` — vector index over the crowdsourced hack knowledge graph
   (used by :mod:`redis_store`). Hybrid search: cosine on a 384-dim embedding from
   ``sentence-transformers/all-MiniLM-L6-v2`` plus tag filters on domain, urgency,
   citizenship, and free-form tags. Numeric ``dollar_value_cents`` lets the
   recommender rank by potential impact.

2. ``session_namespace`` / ``profile_namespace`` — namespaced key prefixes for the
   dual-tier student memory mirrored on the Redis Agent Memory Server shape, so we
   can hot-swap to the official AMS REST API later without re-modelling data.

3. ``REALTIME_KEYS`` — Redis Streams + sorted sets that power the food-surplus
   network and the walking-buddy matching queue (Section 5, Hacks 4 & 1).
"""

from __future__ import annotations

from dataclasses import dataclass

from core.config import settings


def _prefix(suffix: str) -> str:
    return f"{settings.redis_index_prefix}:{suffix}"


@dataclass(frozen=True)
class _Namespace:
    name: str
    prefix: str


HACK_INDEX_NAME = f"{settings.redis_index_prefix}_hacks_v1"
HACK_KEY_PREFIX = _prefix("hack")
SEMCACHE_INDEX_NAME = f"{settings.redis_index_prefix}_semcache_v1"
SEMCACHE_PREFIX = _prefix("semcache")

session_namespace = _Namespace(name="session", prefix=_prefix("memory:session"))
profile_namespace = _Namespace(name="profile", prefix=_prefix("memory:profile"))

REALTIME_KEYS = {
    "food_surplus_stream": _prefix("realtime:food_surplus"),
    "food_surplus_consumer_group": "jugaad-food-consumers",
    "walking_buddy_queue": _prefix("realtime:walking_buddy"),
    "walking_buddy_geo": _prefix("realtime:walking_buddy:geo"),
    "problem_map_counter": _prefix("realtime:problem_map"),
}


def hack_index_schema() -> dict:
    """RedisVL ``IndexSchema``-compatible dict for the jugaad hack vector store."""
    return {
        "index": {
            "name": HACK_INDEX_NAME,
            "prefix": HACK_KEY_PREFIX,
            "storage_type": "hash",
        },
        "fields": [
            {"name": "hack_id", "type": "tag"},
            {"name": "name", "type": "text"},
            {"name": "domain", "type": "tag"},
            {"name": "description", "type": "text"},
            {"name": "how_to_access", "type": "text"},
            {"name": "url", "type": "text"},
            {"name": "phone", "type": "text"},
            {"name": "dollar_value", "type": "text"},
            {"name": "dollar_value_cents", "type": "numeric"},
            {"name": "effort_level", "type": "text"},
            {"name": "citizenship_required", "type": "tag", "attrs": {"separator": "|"}},
            {"name": "deadline", "type": "text"},
            {"name": "urgency", "type": "tag"},
            {"name": "tags", "type": "tag", "attrs": {"separator": ","}},
            {"name": "source", "type": "tag"},
            {
                "name": "embedding",
                "type": "vector",
                "attrs": {
                    "dims": settings.redis_vector_dim,
                    "distance_metric": "cosine",
                    "algorithm": "hnsw",
                    "datatype": "float32",
                },
            },
        ],
    }


def semantic_cache_schema() -> dict:
    """Schema RedisVL uses internally if we ever need to inspect/migrate the cache."""
    return {
        "index": {
            "name": SEMCACHE_INDEX_NAME,
            "prefix": SEMCACHE_PREFIX,
            "storage_type": "hash",
        },
    }
