"""RedisVL-backed vector store over the Jugaad hack knowledge graph.

This module is the heart of the team's Redis prize narrative — *Redis beyond
caching*. It stands up a real RedisVL ``SearchIndex`` over the crowdsourced hack
graph, encodes queries with a local ``sentence-transformers`` model so we do not
need an external embedding API at the venue, and gracefully falls back to the
in-memory ``DOMAIN_KNOWLEDGE`` dictionary whenever Redis (or the model) is
unavailable. That fallback lets the rest of the team keep building when offline
or when the Redis Cloud instance is temporarily down.

The public surface is split in two:

* ``search_hacks(domain, query, limit)`` — backwards-compatible string list used
  by :mod:`response_builder`.
* ``search_hacks_detailed(...)`` / ``ingest_hack(...)`` / ``index_stats()`` — the
  richer surface that newer routers (``/contribute``, ``/web-search``) and the
  frontend cards consume.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Iterable

from core.config import settings

from ..knowledge import DOMAIN_KNOWLEDGE
from .redis_schema import HACK_INDEX_NAME, HACK_KEY_PREFIX, hack_index_schema

logger = logging.getLogger("jugaad.redis_store")

# Lazily initialized singletons so importing this module is cheap even when the
# heavy ML deps (sentence-transformers, torch) are not installed yet.
_index: Any | None = None
_vectorizer: Any | None = None
_redis_client: Any | None = None
_dollar_re = re.compile(r"\$([0-9][0-9,]*)")


def _get_redis_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not settings.redis_url:
        return None
    try:
        import redis

        # Bounded timeouts so a paused/expired Redis Cloud instance (TCP accepts
        # the connection but never answers the RESP handshake) fails fast and we
        # fall back to static knowledge instead of hanging the whole app.
        client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        client.ping()
        _redis_client = client
        return client
    except Exception as exc:
        logger.warning("Redis unavailable (%s) — falling back to static knowledge", exc)
        return None


def _get_vectorizer():
    """Load the HuggingFace MiniLM embedder once.

    We do this lazily because sentence-transformers pulls in torch and a ~80 MB
    model on first use — fine at hackathon time, painful at import time.
    """
    global _vectorizer
    if _vectorizer is not None:
        return _vectorizer
    try:
        from redisvl.utils.vectorize import HFTextVectorizer

        _vectorizer = HFTextVectorizer(model="sentence-transformers/all-MiniLM-L6-v2")
        return _vectorizer
    except Exception as exc:
        logger.warning("HF vectorizer unavailable (%s) — RedisVL disabled", exc)
        return None


def _get_index():
    global _index
    if _index is not None:
        return _index
    client = _get_redis_client()
    if client is None:
        return None
    try:
        from redisvl.index import SearchIndex
        from redisvl.schema import IndexSchema

        schema = IndexSchema.from_dict(hack_index_schema())
        index = SearchIndex(schema, redis_client=client)
        index.create(overwrite=False)
        _index = index
        return index
    except Exception as exc:
        logger.warning("RedisVL index unavailable (%s) — vector search disabled", exc)
        return None


def _dollars_to_cents(value: str | None) -> int:
    if not value:
        return 0
    match = _dollar_re.search(value)
    if not match:
        return 0
    try:
        return int(float(match.group(1).replace(",", "")) * 100)
    except ValueError:
        return 0


def _serialize_hack(hack: dict[str, Any]) -> dict[str, Any]:
    """Coerce a hack JSON record into the flat shape RedisVL stores in a HASH."""
    citizenship = hack.get("citizenship_required") or []
    tags = hack.get("tags") or []
    return {
        "hack_id": hack.get("id", ""),
        "name": hack.get("name", ""),
        "domain": hack.get("domain", ""),
        "description": hack.get("description", ""),
        "how_to_access": hack.get("how_to_access", ""),
        "url": hack.get("url") or "",
        "phone": hack.get("phone") or "",
        "dollar_value": hack.get("dollar_value") or "",
        "dollar_value_cents": _dollars_to_cents(hack.get("dollar_value")),
        "effort_level": hack.get("effort_level") or "",
        "citizenship_required": "|".join(citizenship) if citizenship else "any",
        "deadline": hack.get("deadline") or "",
        "urgency": hack.get("urgency") or DOMAIN_KNOWLEDGE.get(hack.get("domain", ""), {}).get("urgency", "medium"),
        "tags": ",".join(tags),
        "source": hack.get("source", "seed"),
    }


def _embedding_text(hack: dict[str, Any]) -> str:
    """Concatenate the most semantically meaningful fields for embedding."""
    return " ".join(
        filter(
            None,
            [
                hack.get("name"),
                hack.get("description"),
                hack.get("how_to_access"),
                " ".join(hack.get("tags") or []),
            ],
        )
    )


def ingest_hacks(hacks: Iterable[dict[str, Any]]) -> int:
    """Load (or replace) a batch of hack records into the RedisVL index.

    Returns the count of records actually written; returns 0 silently when Redis
    is not available so callers can use this as a no-op seed at startup time.
    """
    index = _get_index()
    vectorizer = _get_vectorizer()
    if index is None or vectorizer is None:
        return 0

    payloads: list[dict[str, Any]] = []
    embed_texts: list[str] = []
    for hack in hacks:
        payload = _serialize_hack(hack)
        if not payload["hack_id"]:
            continue
        payloads.append(payload)
        embed_texts.append(_embedding_text(hack))

    if not payloads:
        return 0

    try:
        embeddings = vectorizer.embed_many(embed_texts, as_buffer=True)
    except Exception as exc:
        logger.warning("Embedding failed (%s) — skipping ingest", exc)
        return 0

    for payload, embedding in zip(payloads, embeddings):
        payload["embedding"] = embedding

    keys = [f"{HACK_KEY_PREFIX}:{p['hack_id']}" for p in payloads]
    try:
        index.load(payloads, keys=keys)
    except Exception as exc:
        logger.warning("RedisVL load failed (%s)", exc)
        return 0
    return len(payloads)


def ingest_hack(hack: dict[str, Any]) -> bool:
    """Single-record ingest used by the crowdsourced ``/contribute`` route."""
    return ingest_hacks([hack]) == 1


def search_hacks_detailed(
    query: str,
    domain: str | None = None,
    citizenship: str | None = None,
    urgency: str | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Hybrid vector + tag search over the hack index.

    The filter expression is built from optional ``domain`` / ``urgency`` /
    ``citizenship`` constraints — we always include ``any`` in the citizenship
    clause so universal resources still surface for a specific status.
    """
    index = _get_index()
    vectorizer = _get_vectorizer()
    if index is None or vectorizer is None:
        return _static_fallback(query, domain=domain, limit=limit)

    try:
        from redisvl.query import VectorQuery
        from redisvl.query.filter import Tag
    except Exception:
        return _static_fallback(query, domain=domain, limit=limit)

    embedding = vectorizer.embed(query, as_buffer=True)

    filter_expr = None
    if domain:
        filter_expr = Tag("domain") == domain
    if urgency:
        clause = Tag("urgency") == urgency
        filter_expr = clause if filter_expr is None else filter_expr & clause
    if citizenship:
        clause = (Tag("citizenship_required") == citizenship) | (Tag("citizenship_required") == "any")
        filter_expr = clause if filter_expr is None else filter_expr & clause

    vquery = VectorQuery(
        vector=embedding,
        vector_field_name="embedding",
        return_fields=[
            "hack_id",
            "name",
            "domain",
            "description",
            "how_to_access",
            "url",
            "phone",
            "dollar_value",
            "dollar_value_cents",
            "effort_level",
            "citizenship_required",
            "deadline",
            "urgency",
            "tags",
            "source",
        ],
        num_results=limit,
    )
    if filter_expr is not None:
        vquery.set_filter(filter_expr)

    try:
        results = index.query(vquery)
    except Exception as exc:
        logger.warning("RedisVL query failed (%s) — falling back", exc)
        return _static_fallback(query, domain=domain, limit=limit)

    return [_hydrate_result(doc) for doc in results]


def _hydrate_result(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc.get("hack_id"),
        "name": doc.get("name"),
        "domain": doc.get("domain"),
        "description": doc.get("description"),
        "how_to_access": doc.get("how_to_access"),
        "url": doc.get("url") or None,
        "phone": doc.get("phone") or None,
        "dollar_value": doc.get("dollar_value") or None,
        "effort_level": doc.get("effort_level") or None,
        "citizenship_required": (doc.get("citizenship_required") or "").split("|"),
        "deadline": doc.get("deadline") or None,
        "urgency": doc.get("urgency") or "medium",
        "tags": (doc.get("tags") or "").split(","),
        "source": doc.get("source") or "seed",
        "match_score": float(doc.get("vector_distance") or 0.0),
    }


def search_hacks(domain: str, query: str, limit: int = 5) -> list[str] | None:
    """Backwards-compatible API for :mod:`response_builder`.

    Returns a list of one-line recommendation strings sourced from the live
    vector index, or ``None`` to signal "use static knowledge instead".
    """
    hits = search_hacks_detailed(query=query, domain=domain, limit=limit)
    if not hits:
        return None
    return [_format_one_liner(hit) for hit in hits]


def _format_one_liner(hit: dict[str, Any]) -> str:
    parts = [hit["name"]]
    if hit.get("dollar_value"):
        parts.append(f"({hit['dollar_value']})")
    if hit.get("how_to_access"):
        parts.append("— " + hit["how_to_access"])
    return " ".join(parts)


def _static_fallback(query: str, domain: str | None, limit: int) -> list[dict[str, Any]]:
    """Surface static domain hacks when Redis/RedisVL is offline.

    ``query`` is intentionally accepted but unused — keeping the signature aligned
    with :func:`search_hacks_detailed` so the call site is uniform.
    """
    _ = query  # explicitly mark as deliberately unused
    domains = [domain] if domain else list(DOMAIN_KNOWLEDGE.keys())
    out: list[dict[str, Any]] = []
    for d in domains:
        block = DOMAIN_KNOWLEDGE.get(d, {})
        for idx, rec in enumerate(block.get("recommendations", [])):
            out.append(
                {
                    "id": f"static-{d}-{idx}",
                    "name": rec.split(":", 1)[0] if ":" in rec else rec[:60],
                    "domain": d,
                    "description": rec,
                    "how_to_access": rec.split("—", 1)[-1].strip() if "—" in rec else "",
                    "url": (block.get("resources") or [{}])[0].get("url"),
                    "phone": None,
                    "dollar_value": (block.get("resources") or [{}])[0].get("value"),
                    "effort_level": (block.get("resources") or [{}])[0].get("effort"),
                    "citizenship_required": ["any"],
                    "deadline": None,
                    "urgency": block.get("urgency", "medium"),
                    "tags": [d],
                    "source": "static",
                    "match_score": 1.0,
                }
            )
    return out[:limit]


def index_stats() -> dict[str, Any]:
    """Lightweight introspection for the ``/health`` route and devpost screenshots."""
    index = _get_index()
    if index is None:
        return {"available": False, "name": HACK_INDEX_NAME, "count": 0}
    try:
        info = index.info()
        return {
            "available": True,
            "name": HACK_INDEX_NAME,
            "count": info.get("num_docs", 0),
            "vector_dim": settings.redis_vector_dim,
        }
    except Exception:
        return {"available": True, "name": HACK_INDEX_NAME, "count": 0}
