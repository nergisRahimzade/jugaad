"""Enforce Jugaad 1, Jugaad 2… format on streamed and complete responses."""

from __future__ import annotations

from typing import Any

from prompts.jugaad_format import JUGAAD_ASSISTANT_PREFILL, JUGAAD_CONTINUATION_HINT

DOMAIN_CTA: dict[str, str] = {
    "food": "start your CalFresh application at benefitscal.com",
    "housing": "draft your BSC co-op application answers",
    "financial_aid": "walk you through the Special Circumstances appeal",
    "scholarship": "find department scholarships for your major",
    "wellness": "find today's Let's Talk drop-in location",
    "safety": "map your SafeWalk route for tonight",
    "academic": "check BerkeleyTime for open sections",
}


def append_jugaad_system_hint(system: str) -> str:
    return f"{system}\n\n{JUGAAD_CONTINUATION_HINT}"


def strip_duplicate_jugaad_one_prefix(text: str) -> str:
    """Remove a leading 'Jugaad 1:' if the UI already printed it."""
    stripped = text.lstrip()
    for prefix in ("Jugaad 1:", "Jugaad 1: "):
        if stripped.startswith(prefix):
            return stripped[len(prefix) :].lstrip()
    return text


def ensure_jugaad_format(text: str) -> str:
    """Ensure non-streaming responses include numbered Jugaad lines."""
    if "Jugaad 1:" in text:
        return text
    return f"{JUGAAD_ASSISTANT_PREFILL}{text.lstrip()}"


def _first_sentence(text: str) -> str:
    text = text.strip()
    for sep in (". ", ".\n", "! ", "? "):
        if sep in text:
            return text.split(sep, 1)[0] + sep.strip()
    return text


def _format_resource(resource: dict[str, Any]) -> str | None:
    name = resource.get("name") or resource.get("title")
    if not name:
        return None
    url = resource.get("url") or ""
    detail = resource.get("detail") or resource.get("description") or ""
    line = str(name)
    if detail:
        line += f" — {detail}"
    if url:
        line += f" ({url})"
    return line


def _pick_cta(domains: list[str]) -> str:
    for domain in domains:
        if domain in DOMAIN_CTA:
            return DOMAIN_CTA[domain]
    return "walk through the highest-impact hack first"


def build_jugaad_response_from_intel(
    responses_by_domain: dict[str, dict[str, Any]],
    domains: list[str],
    profile_question: str | None = None,
) -> str | None:
    """
    Render guaranteed Jugaad 1, Jugaad 2… output from specialist agent payloads.
    Returns None when there are no hacks to list (caller should fall back to Claude).
    """
    hacks: list[str] = []
    intro = ""

    for domain in domains:
        response = responses_by_domain.get(domain) or {}
        if not intro and response.get("summary"):
            intro = _first_sentence(str(response["summary"]))
        for rec in response.get("recommendations") or []:
            line = str(rec).strip()
            if line and line not in hacks:
                hacks.append(line)
        for resource in response.get("resources") or []:
            if isinstance(resource, dict):
                line = _format_resource(resource)
                if line and line not in hacks:
                    hacks.append(line)

    if not hacks:
        return None

    if not intro:
        intro = "I hear you — here are the specific Berkeley hacks I'd stack:"

    lines = [intro, ""]
    for index, hack in enumerate(hacks[:8], start=1):
        lines.append(f"Jugaad {index}: {hack}")
    lines.append("")
    lines.append(f"Want me to {_pick_cta(domains)}?")

    if profile_question:
        lines.append("")
        lines.append(profile_question)

    return "\n".join(lines)
