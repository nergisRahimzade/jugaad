"""Food Resource Finder — crawls Basic Needs Center + CalFresh pages."""

from __future__ import annotations

from typing import Any

from ..redis_cache import check as cache_check, store as cache_store
from ._schema import RESOURCE_LIST_SCHEMA
from .session import fetch_json

_FOOD_URLS = [
    "https://basicneeds.berkeley.edu/food-pantry",
    "https://basicneeds.berkeley.edu/faq/calfresh",
    "https://basicneeds.berkeley.edu/food",
]


def find_food_resources(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    """Aggregate live food resources for the dashboard.

    We hit three Basic Needs pages in sequence (no need to parallelise for a
    handful of fetches), deduplicate by name, and return a flat list. Results
    are semantic-cached so repeated queries from the same demo run skip the
    paid Browserbase round-trip.
    """
    citizenship = (student_profile or {}).get("citizenship") or "any"
    cache_key = f"jugaad/food/{citizenship}"

    cached = cache_check(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resources: list[dict[str, Any]] = []
    visited: list[str] = []
    for url in _FOOD_URLS:
        payload = fetch_json(url, RESOURCE_LIST_SCHEMA)
        if not payload:
            continue
        visited.append(url)
        resources.extend(payload.get("resources", []) or [])

    deduped = _dedupe(resources)
    result: dict[str, Any] = {
        "domain": "food",
        "resources": deduped,
        "visited_urls": visited,
        "source": "live" if deduped else "empty",
    }
    if deduped:
        cache_store(cache_key, result, metadata={"domain": "food"})
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
