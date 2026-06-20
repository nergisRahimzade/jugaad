"""Scholarship Finder — browses Berkeley financial aid pages for live opportunities."""

from __future__ import annotations

from typing import Any

from .session import run_finder

_SCHOLARSHIP_URLS = [
    "https://financialaid.berkeley.edu/types-of-aid/scholarships/",
    "https://financialaid.berkeley.edu/professional-judgment",
    "https://financialaid.berkeley.edu/grants/",
]

_INSTRUCTION = (
    "Extract every scholarship, grant, or one-time award the page mentions. "
    "Capture the program name, dollar value if quoted, application URL, "
    "deadline, and any eligibility filter (major, citizenship, year). "
    "Skip generic navigation links."
)


def find_scholarships(student_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    """Crawl Berkeley scholarship pages and return current opportunities.

    Personalization is light at this layer — we hint the agent with the student's
    major so the page text is filtered before extraction. The richer ranking
    happens upstream in :mod:`response_builder`.
    """
    major = (student_profile or {}).get("major")
    instruction = _INSTRUCTION
    if major:
        instruction += f" The student's major is {major} — flag any department-specific awards that match."
    cache_key = f"scholarships:{major or 'general'}"
    return run_finder(
        domain="scholarship",
        urls=_SCHOLARSHIP_URLS,
        instruction=instruction,
        cache_key=cache_key,
    )
