"""Live Redis + Browserbase intel for coordinator chat."""

from __future__ import annotations

import logging
from typing import Any

from agents.services.browserbase import (
    find_financial_aid_resources,
    find_food_resources,
    find_housing_resources,
)
from agents.services.redis_store import index_stats, search_hacks_detailed
from models.student import StudentProfile

logger = logging.getLogger("jugaad.data_layer")

_WEB_FINDERS = {
    "food": find_food_resources,
    "housing": find_housing_resources,
    "financial_aid": find_financial_aid_resources,
    "scholarship": find_financial_aid_resources,
}


def _profile_dict(profile: StudentProfile | None) -> dict[str, Any] | None:
    if profile is None:
        return None
    return profile.model_dump()


def _format_hack(hack: dict[str, Any]) -> str:
    parts = [hack.get("name", "Hack")]
    if hack.get("description"):
        parts.append(hack["description"])
    if hack.get("how_to_access"):
        parts.append(f"How: {hack['how_to_access']}")
    if hack.get("url"):
        parts.append(f"URL: {hack['url']}")
    return " — ".join(parts)


def gather_domain_intel(
    message: str,
    domains: list[str],
    profile: StudentProfile | None = None,
) -> tuple[str, dict[str, list[dict]]]:
    """
    Returns (LLM context block, per-domain activity events).
    Falls back to static knowledge when Redis/Browserbase unavailable.
    """
    citizenship = profile.citizenship if profile else None
    profile_payload = _profile_dict(profile)
    redis_stats = index_stats()
    redis_live = bool(redis_stats.get("available"))

    context_lines: list[str] = []
    events_by_domain: dict[str, list[dict]] = {}

    for domain in domains:
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
            context_lines.append(f"\n### {domain} — verified jugaad hacks ({source})")
            for hack in hacks[:5]:
                context_lines.append(f"- {_format_hack(hack)}")
        else:
            domain_events.append(
                {
                    "agentId": domain,
                    "type": "search",
                    "message": "Redis RAG — no indexed hacks matched (using prompt knowledge)",
                }
            )

        finder = _WEB_FINDERS.get(domain)
        if finder:
            try:
                web = finder(profile_payload)
                visited = web.get("visited_urls") or []
                resources = web.get("resources") or []
                source = web.get("source", "browserbase")

                if visited or resources:
                    url_preview = ", ".join(visited[:3]) if visited else "structured resources returned"
                    domain_events.append(
                        {
                            "agentId": domain,
                            "type": "search",
                            "message": f"Browserbase live crawl → {url_preview}",
                            "meta": {"visited_urls": visited[:5], "source": source},
                        }
                    )
                    context_lines.append(f"\n### {domain} — live Berkeley web results")
                    for resource in resources[:4]:
                        if isinstance(resource, dict):
                            title = resource.get("title") or resource.get("name") or "Resource"
                            url = resource.get("url") or resource.get("link") or ""
                            snippet = resource.get("snippet") or resource.get("description") or ""
                            line = f"- {title}"
                            if url:
                                line += f" ({url})"
                            if snippet:
                                line += f": {snippet[:200]}"
                            context_lines.append(line)
                        else:
                            context_lines.append(f"- {resource}")
                else:
                    domain_events.append(
                        {
                            "agentId": domain,
                            "type": "search",
                            "message": "Browserbase — no live pages returned (check BROWSERBASE_* env)",
                            "meta": {"source": source},
                        }
                    )
            except Exception as exc:
                logger.warning("Browserbase finder failed for %s: %s", domain, exc)
                domain_events.append(
                    {
                        "agentId": domain,
                        "type": "search",
                        "message": f"Browserbase crawl skipped ({type(exc).__name__})",
                    }
                )

        events_by_domain[domain] = domain_events

    if not context_lines:
        return "", events_by_domain

    block = (
        "\n\nLIVE DATA LAYER (prefer these verified/live results over generic advice):\n"
        + "\n".join(context_lines)
    )
    return block, events_by_domain
