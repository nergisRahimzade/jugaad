"""Legacy facade that routes ``response_builder`` to the new finder agents.

Only three domains are wired up — food, housing, financial_aid (which absorbs
scholarship requests). For anything else we return ``None`` so the response
builder falls back to the static ``DOMAIN_KNOWLEDGE`` block.
"""

from __future__ import annotations

from core.config import settings

from .browserbase import (
    find_financial_aid_resources,
    find_food_resources,
    find_housing_resources,
)

_DOMAIN_FINDERS = {
    "food": find_food_resources,
    "housing": find_housing_resources,
    "financial_aid": find_financial_aid_resources,
    "scholarship": find_financial_aid_resources,  # merged
}


def fetch_live_resources(
    domain: str,
    query: str,
    student_profile: dict | None = None,
) -> list[dict[str, str]] | None:
    """Run the matching finder and shape its output for the dashboard cards."""
    _ = query  # the finders pull from a curated URL set; the query just routes here
    if not settings.browserbase_api_key:
        return None
    finder = _DOMAIN_FINDERS.get(domain)
    if finder is None:
        return None
    payload = finder(student_profile)
    resources = payload.get("resources") or []
    if not resources:
        return None
    return [
        {
            "name": r.get("name") or "Live Berkeley resource",
            "url": r.get("url") or "",
            "value": r.get("dollar_value") or "",
            "effort": r.get("effort_level") or "",
            "deadline": r.get("deadline") or "",
            "notes": r.get("description") or r.get("eligibility") or "",
            "source": "browserbase",
        }
        for r in resources
    ]
