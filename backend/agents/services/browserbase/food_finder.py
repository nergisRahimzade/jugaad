"""Food Resource Finder — browses Basic Needs Center + CalFresh updates live."""

from __future__ import annotations

from typing import Any

from .session import run_finder

_FOOD_URLS = [
    "https://basicneeds.berkeley.edu/food-pantry",
    "https://basicneeds.berkeley.edu/faq/calfresh",
    "https://basicneeds.berkeley.edu/food",
]

_INSTRUCTION = (
    "Extract every live food resource the page mentions: pantry hours, CalFresh "
    "eligibility rules and deadlines, Grab N Go meal pickups, emergency meal "
    "swipes, free-food events, and surplus redistribution programs. Include the "
    "current hours-of-operation when stated."
)


def find_food_resources(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    citizenship = (student_profile or {}).get("citizenship")
    instruction = _INSTRUCTION
    if citizenship:
        instruction += (
            f" The student's citizenship status is {citizenship} — flag the "
            "exemption pathway that applies (e.g. CFAP for DACA, ABAWD work "
            "exemption for half-time + work-study)."
        )
    cache_key = f"food:{citizenship or 'any'}"
    return run_finder(
        domain="food",
        urls=_FOOD_URLS,
        instruction=instruction,
        cache_key=cache_key,
    )
