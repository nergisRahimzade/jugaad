"""Semantic cache backed by Redis LangCache (hosted) with a graceful no-op fallback.

LangCache is Redis's managed semantic-cache-as-a-service. When the three env
vars (``REDIS_LANGCACHE_URL`` / ``REDIS_LANGCACHE_ID`` / ``REDIS_LANGCACHE_API_KEY``)
are set, we use the official ``langcache`` SDK and inherit its embeddings,
vector index, TTL handling, and observability — no local model needed.

The interface is intentionally identical to what we'd build by hand: ``check``
returns a cached payload (or ``None``), ``store`` persists a new entry. Finder
agents treat the cache as a black box.

Two notes on shape:

* We marshal the cached payload to/from JSON so callers can stash structured
  data (a list of resources, the Browserbase live-view URL, etc.) — LangCache
  is a string-in / string-out store.
* The ``metadata`` dict on ``store`` becomes LangCache attributes, which means
  you can later prune the cache by domain (e.g. ``delete_query`` on
  ``{"domain": "food"}``).
"""

from __future__ import annotations

import json
import logging
from typing import Any

from core.config import settings

logger = logging.getLogger("jugaad.redis_cache")

_client: Any | None = None
_disabled: bool = False


def _get_client():
    global _client, _disabled
    if _disabled:
        return None
    if _client is not None:
        return _client
    if not (
        settings.redis_langcache_url
        and settings.redis_langcache_id
        and settings.redis_langcache_api_key
    ):
        _disabled = True
        return None
    try:
        from langcache import LangCache

        _client = LangCache(
            settings.redis_langcache_url,
            cache_id=settings.redis_langcache_id,
            api_key=settings.redis_langcache_api_key,
        )
        return _client
    except Exception as exc:
        logger.warning("LangCache client unavailable (%s)", exc)
        _disabled = True
        return None


def check(prompt: str) -> dict[str, Any] | None:
    """Return the cached payload for a semantically similar prompt, or ``None``."""
    client = _get_client()
    if client is None:
        return None
    try:
        result = client.search(prompt=prompt)
    except Exception as exc:
        logger.warning("LangCache search failed (%s)", exc)
        return None
    entries = _extract_entries(result)
    if not entries:
        return None
    response = entries[0].get("response")
    if not isinstance(response, str):
        return None
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw": response}


def store(prompt: str, payload: dict[str, Any] | str, metadata: dict[str, Any] | None = None) -> bool:
    """Persist ``payload`` under ``prompt`` so the next near-duplicate query hits cache.

    ``metadata`` is forwarded as LangCache attributes *only if* the cache was
    provisioned with matching attribute definitions. If LangCache rejects them
    (HTTP 400 ``no attributes are configured``), we retry without attributes so
    the cache still gets populated — losing only the ability to delete-by-tag.
    """
    client = _get_client()
    if client is None:
        return False
    serialized = payload if isinstance(payload, str) else json.dumps(payload, default=str)

    def _set(with_attrs: bool) -> None:
        kwargs: dict[str, Any] = {"prompt": prompt, "response": serialized}
        if with_attrs and metadata:
            kwargs["attributes"] = {k: str(v) for k, v in metadata.items() if v is not None}
        client.set(**kwargs)

    try:
        _set(with_attrs=bool(metadata))
        return True
    except Exception as exc:
        if metadata and "attributes" in str(exc).lower():
            try:
                _set(with_attrs=False)
                return True
            except Exception as exc2:
                logger.warning("LangCache set retry failed (%s)", exc2)
                return False
        logger.warning("LangCache set failed (%s)", exc)
        return False


def _extract_entries(result: Any) -> list[dict[str, Any]]:
    """LangCache's SDK returns a Pydantic model; normalize to a list of dicts."""
    if result is None:
        return []
    for attr in ("entries", "data", "results"):
        entries = getattr(result, attr, None)
        if entries:
            return [_to_dict(e) for e in entries]
    if isinstance(result, list):
        return [_to_dict(e) for e in result]
    return []


def _to_dict(entry: Any) -> dict[str, Any]:
    if isinstance(entry, dict):
        return entry
    for method in ("model_dump", "dict"):
        if hasattr(entry, method):
            try:
                return getattr(entry, method)()
            except Exception:
                pass
    return {
        "prompt": getattr(entry, "prompt", None),
        "response": getattr(entry, "response", None),
        "attributes": getattr(entry, "attributes", None),
    }


def stats() -> dict[str, Any]:
    return {
        "available": _get_client() is not None,
        "cache_id": settings.redis_langcache_id or None,
    }
