"""Financial Aid Finder — appeals, grants, emergency loans, and scholarships.

The scholarship use case lives here intentionally: from a student's point of
view "where's money I qualify for" is one question regardless of whether the
answer is a Pell appeal, an emergency grant, or a departmental award. Merging
the two finders avoids spinning up two Browserbase sessions for one demand.
"""

from __future__ import annotations

from typing import Any

from ..redis_cache import check as cache_check, store as cache_store
from ._schema import RESOURCE_LIST_SCHEMA
from .session import fetch_json, search_web

_AID_URLS = [
    "https://financialaid.berkeley.edu/types-of-aid/scholarships/",
    "https://financialaid.berkeley.edu/professional-judgment",
    "https://financialaid.berkeley.edu/types-of-aid/grants/",
    "https://financialaid.berkeley.edu/apply-now/apply-for-aid/federal-updates/",
]


def find_financial_aid_resources(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    profile = student_profile or {}
    major = profile.get("major")
    cache_key = f"jugaad/financial_aid/{major or 'general'}"

    cached = cache_check(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    resources: list[dict[str, Any]] = []
    visited: list[str] = []
    for url in _AID_URLS:
        payload = fetch_json(url, RESOURCE_LIST_SCHEMA)
        if not payload:
            continue
        visited.append(url)
        resources.extend(payload.get("resources", []) or [])

    # Department-specific micro-scholarships rarely live on the central page —
    # delegate that long tail to the Browserbase Search API.
    search_hits: list[dict[str, Any]] = []
    if major:
        search_hits = search_web(
            f"UC Berkeley {major} department scholarship application 2026",
            num_results=5,
        )

    deduped = _dedupe(resources)
    result = {
        "domain": "financial_aid",
        "resources": deduped,
        "search_suggestions": [
            {"name": hit.get("title"), "url": hit.get("url")}
            for hit in search_hits
            if hit.get("title") and hit.get("url")
        ],
        "visited_urls": visited,
        "source": "live" if deduped or search_hits else "empty",
    }
    if deduped:
        cache_store(cache_key, result, metadata={"domain": "financial_aid", "major": major or ""})
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
