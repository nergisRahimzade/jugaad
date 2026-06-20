"""Legacy facade that routes ``response_builder`` to the new finder agents.

The agent code imports ``fetch_live_resources(domain, query)`` directly. We keep
that signature stable and dispatch to the right :mod:`browserbase` finder under
the hood — so the swap to the richer multi-URL crawl is transparent to callers.
"""

from __future__ import annotations

from core.config import settings

from .browserbase import (
    find_food_resources,
    find_housing_resources,
    find_scholarships,
    find_wellness_resources,
)

_DOMAIN_FINDERS = {
    "food": find_food_resources,
    "housing": find_housing_resources,
    "scholarship": find_scholarships,
    "financial_aid": find_scholarships,
    "wellness": find_wellness_resources,
}


def fetch_live_resources(domain: str, query: str) -> list[dict[str, str]] | None:
    """Run the matching finder agent and return resource dicts for the UI cards.

    Returns ``None`` when Browserbase is not configured so existing callers fall
    back to the static resource list shipped in ``DOMAIN_KNOWLEDGE``.
    """
    if not settings.browserbase_api_key:
        return None
    finder = _DOMAIN_FINDERS.get(domain)
    if finder is None:
        return None
    payload = finder()
    resources = payload.get("resources", [])
    if not resources:
        return None
    live_view_url = payload.get("live_view_url")
    return [
        {
            "name": r.get("name") or "Live Berkeley resource",
            "url": r.get("url") or "",
            "value": r.get("value") or "",
            "effort": r.get("effort") or "",
            "deadline": r.get("deadline") or "",
            "notes": r.get("notes") or "",
            "source": "browserbase",
            "live_view_url": live_view_url or "",
        }
        for r in resources
    ]
