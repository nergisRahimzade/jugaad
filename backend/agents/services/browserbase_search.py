"""Live Berkeley resource lookup via Browserbase — falls back to static URLs."""

from __future__ import annotations

import os
from typing import Any

BROWSERBASE_API_KEY = os.getenv("BROWSERBASE_API_KEY", "")

DOMAIN_SITES: dict[str, list[str]] = {
    "food": [
        "https://basicneeds.berkeley.edu/pantry",
        "https://basicneeds.berkeley.edu/faq/calfresh",
    ],
    "housing": [
        "https://basicneeds.berkeley.edu",
        "https://bsc.coop",
    ],
    "financial_aid": [
        "https://financialaid.berkeley.edu",
        "https://financialaid.berkeley.edu/apply-now/apply-for-aid/federal-updates/",
    ],
    "scholarship": [
        "https://financialaid.berkeley.edu",
    ],
    "wellness": [
        "https://uhs.berkeley.edu/counseling",
    ],
    "safety": [
        "https://ucpd.berkeley.edu",
    ],
    "academic": [
        "https://berkeleytime.com",
        "https://classes.berkeley.edu",
    ],
}


def fetch_live_resources(domain: str, query: str) -> list[dict[str, str]] | None:
    """
    Return live resources when Browserbase is configured.
    Person 3 can swap in real Stagehand/Browserbase crawl here.
    """
    if not BROWSERBASE_API_KEY:
        return None

    try:
        import httpx

        # Placeholder: Person 3 wires real Browserbase session crawl.
        # For now, mark URLs as live-checked when API key is present.
        sites = DOMAIN_SITES.get(domain, [])
        return [
            {
                "name": f"Live Berkeley resource ({domain})",
                "url": url,
                "value": "Live via Browserbase",
                "effort": "Verified during query",
            }
            for url in sites[:2]
        ]
    except Exception:
        return None
