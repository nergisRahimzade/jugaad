"""Live specialist agent execution — Redis, Browserbase, and domain knowledge per agent."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from agents.response_builder import build_domain_response
from agents.services.redis_store import index_stats, search_hacks_detailed
from models.student import StudentProfile

logger = logging.getLogger("jugaad.data_layer")

AGENT_LABELS = {
    "food": "Food Agent",
    "housing": "Housing Agent",
    "financial_aid": "Financial Aid Agent",
    "safety": "Safety Agent",
    "academic": "Academic Agent",
    "wellness": "Wellness Agent",
    "scholarship": "Scholarship Agent",
}


def _profile_dict(profile: StudentProfile | None) -> dict[str, Any] | None:
    if profile is None:
        return None
    return profile.model_dump()


def _run_specialist(
    domain: str,
    message: str,
    profile_payload: dict[str, Any] | None,
    citizenship: str | None,
) -> tuple[str, list[dict], dict[str, Any]]:
    """Execute one specialist: Redis RAG, Browserbase (if wired), domain response."""
    domain_events: list[dict] = []

    try:
        hacks = search_hacks_detailed(
            query=message,
            domain=domain,
            citizenship=citizenship,
            limit=5,
        )
    except Exception as exc:
        logger.warning("Redis search failed for %s: %s", domain, exc)
        hacks = []

    redis_live = bool(index_stats().get("available"))
    if hacks:
        source = "RedisVL vector index" if redis_live else "static jugaad knowledge (offline fallback)"
        hack_names = ", ".join(h.get("name", "?") for h in hacks[:3])
        domain_events.append(
            {
                "agentId": domain,
                "type": "search",
                "message": f"Redis RAG ({source}) → {len(hacks)} hacks: {hack_names}",
                "meta": {"source": source, "count": len(hacks)},
            }
        )
    else:
        domain_events.append(
            {
                "agentId": domain,
                "type": "search",
                "message": "Redis RAG — no indexed hacks matched (using domain knowledge base)",
            }
        )

    try:
        response = build_domain_response(domain, message, profile_payload)
    except Exception as exc:
        logger.warning("Specialist %s failed: %s", domain, exc)
        response = {
            "summary": f"{AGENT_LABELS.get(domain, domain)} could not complete (error).",
            "recommendations": [],
            "resources": [],
            "urgency": "medium",
        }

    live_resources = [
        r for r in (response.get("resources") or [])
        if isinstance(r, dict) and r.get("source") == "browserbase"
    ]
    if live_resources:
        names = ", ".join(r.get("name", "?") for r in live_resources[:3])
        domain_events.append(
            {
                "agentId": domain,
                "type": "search",
                "message": f"Browserbase live crawl → {len(live_resources)} resources: {names}",
                "meta": {"count": len(live_resources), "source": "browserbase"},
            }
        )
    elif domain in ("food", "housing", "financial_aid", "scholarship"):
        domain_events.append(
            {
                "agentId": domain,
                "type": "search",
                "message": "Browserbase — no live pages returned (check BROWSERBASE_* env or cache hit)",
            }
        )

    summary = (response.get("summary") or "").strip()
    recs = response.get("recommendations") or []
    rec_preview = " | ".join(str(r)[:80] for r in recs[:2])
    response_wire = f"JUGAAD_RESPONSE|{domain}|{summary[:120]}||{rec_preview}"
    domain_events.append(
        {
            "agentId": domain,
            "type": "response",
            "message": f"SEND → coordinator  payload: {response_wire}",
            "meta": {
                "domain": domain,
                "summary": summary,
                "recommendations": recs[:5],
                "urgency": response.get("urgency"),
            },
        }
    )

    context_block = _format_agent_context(domain, response, hacks)
    return context_block, domain_events, response


def _format_agent_context(
    domain: str,
    response: dict[str, Any],
    hacks: list[dict],
) -> str:
    label = AGENT_LABELS.get(domain, domain)
    lines = [f"\n### {label} — specialist findings"]
    summary = response.get("summary")
    if summary:
        lines.append(f"Summary: {summary}")
    for rec in (response.get("recommendations") or [])[:4]:
        lines.append(f"- {rec}")
    for resource in (response.get("resources") or [])[:3]:
        if isinstance(resource, dict):
            name = resource.get("name") or resource.get("title") or "Resource"
            url = resource.get("url") or ""
            line = f"- Live/static resource: {name}"
            if url:
                line += f" ({url})"
            lines.append(line)
    if hacks:
        lines.append("Indexed hacks (Redis):")
        for hack in hacks[:3]:
            lines.append(f"  • {hack.get('name', '?')}")
    return "\n".join(lines)


def gather_domain_intel(
    message: str,
    domains: list[str],
    profile: StudentProfile | None = None,
) -> tuple[str, dict[str, list[dict]], dict[str, dict[str, Any]]]:
    """
    Run each specialist agent in parallel.
    Returns (LLM context, per-domain activity events, per-domain response payloads).
    """
    if not domains:
        return "", {}, {}

    profile_payload = _profile_dict(profile)
    citizenship = profile.citizenship if profile else None
    events_by_domain: dict[str, list[dict]] = {}
    responses_by_domain: dict[str, dict[str, Any]] = {}
    context_by_domain: dict[str, str] = {}

    with ThreadPoolExecutor(max_workers=min(len(domains), 4)) as pool:
        futures = {
            pool.submit(_run_specialist, domain, message, profile_payload, citizenship): domain
            for domain in domains
        }
        for future in as_completed(futures):
            domain = futures[future]
            try:
                context_block, domain_events, response = future.result()
                events_by_domain[domain] = domain_events
                responses_by_domain[domain] = response
                context_by_domain[domain] = context_block
            except Exception as exc:
                logger.warning("Specialist future failed for %s: %s", domain, exc)
                events_by_domain[domain] = [
                    {
                        "agentId": domain,
                        "type": "search",
                        "message": f"Specialist error ({type(exc).__name__})",
                    }
                ]
                responses_by_domain[domain] = {}

    ordered_blocks = [context_by_domain[d] for d in domains if d in context_by_domain]
    if not ordered_blocks:
        return "", events_by_domain, responses_by_domain

    block = (
        "\n\nLIVE SPECIALIST AGENT OUTPUT (each agent ran Redis + domain tools — cite these in your answer):\n"
        + "\n".join(ordered_blocks)
    )
    return block, events_by_domain, responses_by_domain
