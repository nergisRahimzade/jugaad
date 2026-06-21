"""Shared services for the Jugaad data layer.

Scope is intentionally narrow: a RedisVL vector index over the hack knowledge
graph (``redis_store``), a managed LangCache wrapper (``redis_cache``), a
managed Agent Memory Server wrapper (``redis_memory``), and a Browserbase
subpackage that powers food / housing / financial-aid live crawls.
"""

from . import redis_cache, redis_memory, redis_seed, redis_store  # noqa: F401
