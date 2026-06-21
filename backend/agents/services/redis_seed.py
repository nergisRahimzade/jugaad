"""Idempotently seed the RedisVL hack index from ``data/seed_hacks.json``.

Called once at FastAPI startup. If Redis is offline we silently no-op; the
in-memory ``DOMAIN_KNOWLEDGE`` fallback in :mod:`redis_store` still serves
queries.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from .redis_store import ingest_hacks, index_stats

logger = logging.getLogger("jugaad.redis_seed")

_SEED_PATH = Path(__file__).resolve().parents[2] / "data" / "seed_hacks.json"


def _load_seed_hacks() -> list[dict[str, Any]]:
    if not _SEED_PATH.exists():
        logger.warning("seed_hacks.json not found at %s", _SEED_PATH)
        return []
    with _SEED_PATH.open() as f:
        return json.load(f)


def seed_if_needed() -> dict[str, Any]:
    """Load seed hacks only if the live index is empty.

    Returns a status dict for logging / the ``/health`` endpoint.
    """
    before = index_stats()
    if not before["available"]:
        return {"status": "skipped", "reason": "redis unavailable"}
    if before["count"] > 0:
        return {"status": "already_seeded", "count": before["count"]}

    hacks = _load_seed_hacks()
    if not hacks:
        return {"status": "empty_seed_file"}

    written = ingest_hacks(hacks)
    after = index_stats()
    logger.info("Seeded %d hacks into %s (now %d docs)", written, after["name"], after["count"])
    return {"status": "seeded", "written": written, "total": after["count"]}
