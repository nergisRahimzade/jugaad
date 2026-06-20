"""Shared services for Redis, Browserbase, Band, and ASI:One.

The Person 3 data layer exposes four Redis modules — ``redis_store`` for the
RedisVL vector index, ``redis_cache`` for the semantic LLM cache,
``redis_memory`` for dual-tier student memory, and ``redis_realtime`` for the
food-surplus + walking-buddy + problem-map queues — plus a ``browserbase``
subpackage that drives live Berkeley site crawls.
"""

from . import redis_cache, redis_memory, redis_realtime, redis_seed, redis_store  # noqa: F401
