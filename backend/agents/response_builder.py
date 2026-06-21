"""Build specialist responses from Redis, Browserbase, static knowledge, and ASI:One."""

from __future__ import annotations

from typing import Any

from .knowledge import DOMAIN_KNOWLEDGE
from .services.asi_one import enhance_summary
from .services.browserbase_search import fetch_live_resources
from .services.redis_store import search_hacks


def build_domain_response(
    domain: str,
    user_message: str,
    student_profile: dict | None = None,
) -> dict[str, Any]:
    base = DOMAIN_KNOWLEDGE.get(domain)
    if not base:
        return {
            "summary": "No resources found for this domain.",
            "recommendations": [],
            "resources": [],
            "urgency": "low",
        }

    recommendations = search_hacks(domain, user_message) or base["recommendations"]
    resources = list(base["resources"])

    live = fetch_live_resources(domain, user_message, student_profile)
    if live:
        resources = live + resources

    summary = enhance_summary(domain, user_message, base["summary"], recommendations)

    if student_profile:
        profile_note = _profile_note(student_profile, domain)
        if profile_note:
            recommendations = [profile_note] + list(recommendations)

    return {
        "summary": summary,
        "recommendations": recommendations,
        "resources": resources,
        "urgency": base["urgency"],
    }


def _profile_note(profile: dict, domain: str) -> str | None:
    """Light personalization from student profile until Claude lead wires full logic."""
    notes: list[str] = []
    if domain == "food" and profile.get("meal_plan") in (None, "none", "expired"):
        notes.append("Your profile shows no active meal plan — prioritize CalFresh + pantry stacking.")
    if domain == "financial_aid" and profile.get("efc"):
        notes.append(f"EFC/SAI on file ({profile['efc']}) — check Special Circumstances if income changed.")
    if domain == "wellness" and profile.get("stress_level") == "high":
        notes.append("High stress flagged — start with Let's Talk drop-in (no appointment).")
    if domain == "scholarship" and profile.get("major"):
        notes.append(f"Scan department scholarships for {profile['major']} — often fewer applicants.")
    return notes[0] if notes else None
