"""Housing Finder — Berkeley Student Cooperative, emergency housing, rent rights."""

from __future__ import annotations

from typing import Any

from ..redis_cache import check as cache_check, store as cache_store
from ._schema import RESOURCE_LIST_SCHEMA
from .session import fetch_json

_HOUSING_URLS = [
    "https://bsc.coop",
    "https://basicneeds.berkeley.edu/housing/emergency",
    "https://rent.berkeleyca.gov",
]


def find_housing_resources(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    situation = (student_profile or {}).get("housing") or "any"
    cache_key = f"jugaad/housing/{situation}"

    cached = cache_check(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resources: list[dict[str, Any]] = []
    visited: list[str] = []
    for url in _HOUSING_URLS:
        payload = fetch_json(url, RESOURCE_LIST_SCHEMA)
        if not payload:
            continue
        visited.append(url)
        resources.extend(payload.get("resources", []) or [])

    deduped = _dedupe(resources)
    result = {
        "domain": "housing",
        "resources": deduped,
        "visited_urls": visited,
        "source": "live" if deduped else "empty",
    }
    if deduped:
        cache_store(cache_key, result, metadata={"domain": "housing"})
    return result


def _dedupe(resources: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for r in resources:
        name = (r.get("name") or "").strip().lower()
        if not name or name in seen:
            continue
        seen.add(name)
        out.append(r)
    return out
