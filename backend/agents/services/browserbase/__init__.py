"""Browserbase live-web agents for the Jugaad data layer.

We focus on three high-impact domains: **food**, **housing**, and
**financial aid** (which absorbs the scholarship use case). Each finder calls
the Browserbase Fetch API with a JSON schema so the platform itself returns
structured records — no Playwright session needed for the common path.
"""

from .session import (
    fetch_json,
    fetch_markdown,
    search_web,
    create_live_session,
)
from .food_finder import find_food_resources
from .housing_finder import find_housing_resources
from .financial_aid_finder import find_financial_aid_resources

__all__ = [
    "fetch_json",
    "fetch_markdown",
    "search_web",
    "create_live_session",
    "find_food_resources",
    "find_housing_resources",
    "find_financial_aid_resources",
]
