"""Browserbase live-web agents for the Jugaad data layer.

This subpackage owns the Browserbase prize. Each finder agent here drives a real
Browserbase session against a Berkeley resource portal, hands the rendered text
to Claude for structured extraction, then caches results into Redis so repeated
queries skip the (slow, paid) browser round-trip. The session-replay URL is
surfaced to the frontend so judges can watch the agent actually browse.
"""

from .session import BrowserbaseSession, get_or_create_session, crawl_url, run_finder
from .food_finder import find_food_resources
from .housing_finder import find_housing_resources
from .scholarship_finder import find_scholarships
from .wellness_finder import find_wellness_resources

__all__ = [
    "BrowserbaseSession",
    "get_or_create_session",
    "crawl_url",
    "run_finder",
    "find_food_resources",
    "find_housing_resources",
    "find_scholarships",
    "find_wellness_resources",
]
