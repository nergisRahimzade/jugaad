"""Mental Health Finder — Tang Center / CAPS / SHIP off-campus providers."""

from __future__ import annotations

from typing import Any

from .session import run_finder

_WELLNESS_URLS = [
    "https://uhs.berkeley.edu/counseling",
    "https://uhs.berkeley.edu/counseling/lets-talk",
    "https://uhs.berkeley.edu/wellness-coaching",
]

_INSTRUCTION = (
    "Extract every live mental-health resource: Let's Talk drop-in locations and "
    "this week's schedule, CAPS urgent same-day pathway, peer wellness coaching "
    "openings, and SHIP off-campus therapist directory access. Include phone "
    "numbers when they appear on the page."
)


def find_wellness_resources(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    stress = (student_profile or {}).get("stress_level")
    instruction = _INSTRUCTION
    if stress == "high":
        instruction += " Surface same-day or 24/7 options first."
    cache_key = f"wellness:{stress or 'any'}"
    return run_finder(
        domain="wellness",
        urls=_WELLNESS_URLS,
        instruction=instruction,
        cache_key=cache_key,
    )
