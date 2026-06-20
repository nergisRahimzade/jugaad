"""Housing Finder — browses Berkeley Student Cooperative + emergency housing pages."""

from __future__ import annotations

from typing import Any

from .session import run_finder

_HOUSING_URLS = [
    "https://bsc.coop",
    "https://basicneeds.berkeley.edu/housing/emergency",
    "https://rent.berkeleyca.gov",
]

_INSTRUCTION = (
    "Extract every live housing resource: BSC co-op availability and pricing, "
    "emergency housing intake info, rent control rules and current annual cap, "
    "rapid rehousing eligibility. Flag rolling-admission options separately from "
    "fixed-deadline ones."
)


def find_housing_resources(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    situation = (student_profile or {}).get("housing")
    instruction = _INSTRUCTION
    if situation == "unstably_housed":
        instruction += (
            " Prioritize same-day emergency placements over long-term solutions."
        )
    cache_key = f"housing:{situation or 'any'}"
    return run_finder(
        domain="housing",
        urls=_HOUSING_URLS,
        instruction=instruction,
        cache_key=cache_key,
    )
