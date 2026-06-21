"""Profile completeness, missing-field detection, and chat extraction."""

from __future__ import annotations

import json
from dataclasses import dataclass

from models.student import StudentProfile, profile_to_context
import core.claude_client as _claude

FIELD_QUESTIONS: dict[str, str] = {
    "major": "What's your major? Some aid and department resources depend on it.",
    "citizenship": "What's your citizenship or immigration status? (US citizen, DACA, undocumented, permanent resident) — this affects CalFresh and aid eligibility.",
    "housing_situation": "Are you on-campus, off-campus, or unstably housed right now?",
    "enrollment_status": "Are you full-time undergrad, part-time, or grad?",
    "meal_plan": "Do you have an active meal plan, an expired one, or none?",
    "efc_sai": "Roughly what's your SAI/EFC on FAFSA? (0 if you're not sure — 0 means highest need)",
    "current_aid": "Do you currently get any aid — Pell, Cal Grant, work-study, or none yet?",
    "gpa_band": "What GPA range are you in — below 2.0, 2.0–3.0, 3.0–3.5, or 3.5+?",
    "work_hours_per_week": "About how many hours do you work per week?",
}

DOMAIN_FIELD_PRIORITY: dict[str, list[str]] = {
    "food": ["citizenship", "housing_situation", "meal_plan", "major", "efc_sai"],
    "financial_aid": ["citizenship", "efc_sai", "current_aid", "enrollment_status", "major"],
    "scholarship": ["major", "gpa_band", "citizenship", "current_aid"],
    "housing": ["housing_situation", "efc_sai", "citizenship", "dependents"],
    "wellness": ["enrollment_status", "housing_situation", "major"],
    "safety": ["housing_situation", "major"],
    "academic": ["major", "gpa_band", "enrollment_status"],
}

GLOBAL_PRIORITY = [
    "major",
    "citizenship",
    "housing_situation",
    "enrollment_status",
    "efc_sai",
    "meal_plan",
    "current_aid",
    "gpa_band",
    "work_hours_per_week",
]

_UNSET_MAJORS = {"", "undecided", "unknown", "n/a"}


@dataclass
class ProfileAnalysis:
    missing_fields: list[str]
    completeness: int
    top_question: str | None
    context: str | None
    has_usable_profile: bool


def _is_missing(profile: StudentProfile, field: str) -> bool:
    if field == "major":
        return profile.major.strip().lower() in _UNSET_MAJORS
    if field == "citizenship":
        return profile.citizenship.strip().lower() in ("", "unknown", "prefer not to say")
    if field == "housing_situation":
        return not profile.housing_situation.strip()
    if field == "enrollment_status":
        return not profile.enrollment_status.strip()
    if field == "meal_plan":
        return not profile.meal_plan.strip()
    if field == "gpa_band":
        return not profile.gpa_band.strip()
    if field == "current_aid":
        return len(profile.current_aid) == 0
    if field == "efc_sai":
        return profile.efc_sai < 0
    if field == "work_hours_per_week":
        return profile.work_hours_per_week < 0
    if field == "dependents":
        return profile.dependents < 0
    return False


def _ordered_missing(profile: StudentProfile | None, domains: list[str]) -> list[str]:
    if profile is None:
        return GLOBAL_PRIORITY[:5]

    priority: list[str] = []
    for domain in domains:
        for field in DOMAIN_FIELD_PRIORITY.get(domain, []):
            if field not in priority:
                priority.append(field)
    for field in GLOBAL_PRIORITY:
        if field not in priority:
            priority.append(field)

    return [f for f in priority if _is_missing(profile, f)]


def profile_completeness(profile: StudentProfile | None) -> int:
    if not profile:
        return 0
    tracked = ["major", "citizenship", "housing_situation", "enrollment_status", "gpa_band"]
    filled = sum(1 for f in tracked if not _is_missing(profile, f))
    return round(filled / len(tracked) * 100)


def analyze_profile(
    profile: StudentProfile | None,
    domains: list[str],
    profile_initialized: bool = False,
) -> ProfileAnalysis:
    missing = _ordered_missing(profile, domains)

    if profile and not profile_initialized:
        if "citizenship" not in missing:
            missing.insert(0, "citizenship")
        # Re-apply domain priority while keeping citizenship first if unconfirmed
        priority: list[str] = []
        if "citizenship" in missing:
            priority.append("citizenship")
        for domain in domains:
            for field in DOMAIN_FIELD_PRIORITY.get(domain, []):
                if field in missing and field not in priority:
                    priority.append(field)
        for field in missing:
            if field not in priority:
                priority.append(field)
        missing = priority[:5]

    completeness = profile_completeness(profile)
    top = missing[0] if missing else None
    top_question = FIELD_QUESTIONS.get(top) if top else None

    context = None
    has_usable = False
    if profile:
        has_usable = completeness >= 40 or profile.major.strip().lower() not in _UNSET_MAJORS
        if has_usable or profile_initialized:
            context = profile_to_context(profile)

    return ProfileAnalysis(
        missing_fields=missing[:5],
        completeness=completeness,
        top_question=top_question,
        context=context,
        has_usable_profile=has_usable or profile_initialized,
    )


def build_profile_addendum(analysis: ProfileAnalysis, domains: list[str]) -> str:
    if not analysis.missing_fields:
        return """PROFILE — student saved their profile. Personalize every answer:
- Reference their major, housing, citizenship, aid, and enrollment when relevant.
- Tailor CalFresh/aid/housing hacks to their exact situation.
- Do NOT ask intake questions — you already have their context."""

    missing_labels = ", ".join(analysis.missing_fields)
    question = analysis.top_question or "Tell me a bit more about your situation."

    partial = ""
    if analysis.context:
        partial = f"\nPartial profile already known:\n{analysis.context}\n"

    return f"""PROFILE — missing fields for this topic: {missing_labels}
{partial}
RULES:
1. ALWAYS use mandatory JUGAAD RESPONSE FORMAT first — Jugaad 1, Jugaad 2, Jugaad 3… with concrete hacks (dollar amounts, phones, addresses). Never replace hacks with a plain paragraph.
2. End hacks with: Want me to [specific next step]?
3. ONLY AFTER that line, add ONE short profile question on its own line: {question}
4. Do NOT ask multiple questions. Do NOT send them to a profile page."""


EXTRACT_SYSTEM = """Extract student profile fields from a Berkeley student chat.
Return ONLY valid JSON with keys to update from this set:
major, citizenship, housing_situation, enrollment_status, meal_plan, efc_sai, work_hours_per_week, dependents, gpa_band, current_aid (array of strings).

Rules:
- Only include fields clearly stated in the latest user message.
- citizenship: one of "US citizen", "DACA", "undocumented", "permanent resident"
- housing_situation: "on-campus", "off-campus", or "unstably-housed"
- enrollment_status: "full-time undergrad", "part-time", or "grad"
- meal_plan: "active", "expired", or "none"
- gpa_band: "below-2.0", "2.0-3.0", "3.0-3.5", or "3.5+"
- Return {{}} if nothing new."""


def extract_profile_updates(
    profile: StudentProfile,
    messages: list[dict],
    missing_fields: list[str],
) -> dict | None:
    if not missing_fields:
        return None

    recent = messages[-6:]
    convo = "\n".join(f"{m['role']}: {m['content']}" for m in recent)
    prompt = f"""Current profile: {profile.model_dump_json()}
Still missing: {", ".join(missing_fields)}

Conversation:
{convo}

Extract any profile fields the student just provided."""

    try:
        raw = _claude.complete(
            system=EXTRACT_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250,
        )
        clean = raw.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        updates = json.loads(clean.strip())
        if not isinstance(updates, dict) or not updates:
            return None
        allowed = set(StudentProfile.model_fields)
        return {k: v for k, v in updates.items() if k in allowed}
    except Exception:
        return None


def merge_profile(profile: StudentProfile, updates: dict) -> StudentProfile:
    data = profile.model_dump()
    data.update(updates)
    return StudentProfile(**data)
