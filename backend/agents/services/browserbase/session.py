"""Browserbase + Playwright session manager.

The flow per finder agent is::

    session = get_or_create_session("scholarship")
    page_text = await crawl_url(session, "https://financialaid.berkeley.edu")
    resources = extract_resources_with_claude(page_text, FINDER_PROMPT)

We keep one Browserbase session per domain so the live-replay URL on the
frontend stays stable through a demo run. Sessions are reaped when ``close()``
is called explicitly or when the process exits.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass
from typing import Any

import httpx

from core.config import settings
from core.claude_client import complete

logger = logging.getLogger("jugaad.browserbase.session")

_BB_REGION_HOST = "https://api.browserbase.com"
_LIVE_VIEW_BASE = "https://browserbase.com/sessions"
_MAX_PAGE_CHARS = 12000  # keep extraction prompts under Claude's sweet spot

_sessions: dict[str, "BrowserbaseSession"] = {}


@dataclass
class BrowserbaseSession:
    """Lightweight handle around a live Browserbase session."""

    id: str
    connect_url: str
    live_view_url: str
    domain: str

    def to_public_dict(self) -> dict[str, str]:
        return {
            "session_id": self.id,
            "live_view_url": self.live_view_url,
            "domain": self.domain,
        }


def _api_headers() -> dict[str, str]:
    return {
        "X-BB-API-Key": settings.browserbase_api_key,
        "Content-Type": "application/json",
    }


async def _create_session_via_rest(domain: str) -> BrowserbaseSession | None:
    """Create a Browserbase session over the REST API.

    Falling through to REST (rather than the SDK) keeps this dependency-free for
    callers that don't want the full ``browserbase`` package on their critical
    path.
    """
    if not settings.browserbase_api_key:
        return None
    payload: dict[str, Any] = {"timeout": 1800}
    if settings.browserbase_project_id:
        payload["projectId"] = settings.browserbase_project_id
    if settings.browserbase_region:
        payload["region"] = settings.browserbase_region

    try:
        async with httpx.AsyncClient(timeout=30) as http:
            response = await http.post(
                f"{_BB_REGION_HOST}/v1/sessions",
                headers=_api_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        logger.warning("Browserbase session create failed (%s)", exc)
        return None

    session_id = data.get("id") or ""
    connect_url = data.get("connectUrl") or ""
    if not session_id or not connect_url:
        return None
    return BrowserbaseSession(
        id=session_id,
        connect_url=connect_url,
        live_view_url=f"{_LIVE_VIEW_BASE}/{session_id}",
        domain=domain,
    )


def get_or_create_session(domain: str) -> BrowserbaseSession | None:
    """Get the cached session for a domain, creating one if needed.

    Synchronous wrapper around the async creator so the sync agent code in
    ``response_builder.py`` can call it without awaiting.
    """
    if domain in _sessions:
        return _sessions[domain]
    if not settings.browserbase_api_key:
        return None
    session = asyncio.run(_create_session_via_rest(domain))
    if session:
        _sessions[domain] = session
    return session


async def crawl_url(session: BrowserbaseSession, url: str) -> str | None:
    """Open the given URL in the session and return its visible text.

    We connect to the Browserbase session over CDP via Playwright. If Playwright
    isn't installed we fall back to a direct ``httpx`` GET so the rest of the
    pipeline keeps working in dev.
    """
    try:
        from playwright.async_api import async_playwright
    except Exception:
        return await _fallback_fetch(url)

    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.connect_over_cdp(session.connect_url)
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30000)
            text = await page.evaluate("() => document.body.innerText")
            await page.close()
            return _truncate(text or "")
    except Exception as exc:
        logger.warning("Playwright crawl of %s failed (%s) — using fallback", url, exc)
        return await _fallback_fetch(url)


async def _fallback_fetch(url: str) -> str | None:
    """Plain HTTP fetch when Playwright/Browserbase aren't reachable."""
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as http:
            response = await http.get(url, headers={"User-Agent": "Jugaad/1.0 (+https://jugaad.app)"})
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Fallback fetch of %s failed (%s)", url, exc)
        return None
    return _truncate(_strip_html(response.text))


def _strip_html(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _truncate(text: str) -> str:
    return text if len(text) <= _MAX_PAGE_CHARS else text[:_MAX_PAGE_CHARS] + "…"


# ---------------------------------------------------------------------------
# Claude-driven extraction
# ---------------------------------------------------------------------------


_EXTRACTION_SYSTEM = (
    "You are Jugaad's web-research agent. You read a snippet of a Berkeley resource "
    "page and extract concrete, actionable resources a student in crisis can use. "
    "Return STRICT JSON with shape:\n"
    "{ \"resources\": [ { \"name\": str, \"url\": str|null, \"value\": str|null, "
    "\"effort\": str|null, \"deadline\": str|null, \"notes\": str|null } ] }\n"
    "Only include resources actually mentioned in the snippet. If none, return "
    "{\"resources\": []}. Never invent URLs or phone numbers."
)


def extract_resources_with_claude(page_text: str, finder_instruction: str) -> list[dict[str, Any]]:
    """Hand the page text to Claude and parse a JSON list of resources back."""
    if not page_text:
        return []
    prompt = (
        f"{finder_instruction}\n\n"
        f"--- PAGE TEXT START ---\n{page_text}\n--- PAGE TEXT END ---\n\n"
        "Respond with JSON only."
    )
    try:
        raw = complete(_EXTRACTION_SYSTEM, [{"role": "user", "content": prompt}], max_tokens=900)
    except Exception as exc:
        logger.warning("Claude extraction failed (%s)", exc)
        return []
    return _parse_resources(raw)


def _parse_resources(raw: str) -> list[dict[str, Any]]:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        raw = raw.split("\n", 1)[-1] if raw.startswith("json") else raw
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            return []
        try:
            payload = json.loads(match.group(0))
        except json.JSONDecodeError:
            return []
    resources = payload.get("resources") if isinstance(payload, dict) else None
    if not isinstance(resources, list):
        return []
    return [r for r in resources if isinstance(r, dict) and r.get("name")]


# ---------------------------------------------------------------------------
# High-level finder orchestrator
# ---------------------------------------------------------------------------


def run_finder(
    domain: str,
    urls: list[str],
    instruction: str,
    cache_key: str | None = None,
) -> dict[str, Any]:
    """Run a finder agent end-to-end.

    1. Try the Redis cache first (cheap).
    2. Otherwise open a Browserbase session, crawl each URL, extract resources
       with Claude.
    3. Cache the combined result.
    4. Always return a payload that includes the live session URL when present,
       so the frontend can render the "watch the agent work" affordance.
    """
    from ..redis_cache import check as cache_check, store as cache_store

    if cache_key:
        cached = cache_check(cache_key)
        if cached:
            try:
                return {**json.loads(cached["response"]), "source": "cache"}
            except (json.JSONDecodeError, TypeError):
                pass

    session = get_or_create_session(domain)
    if session is None:
        return {"resources": [], "live_view_url": None, "source": "unavailable"}

    resources: list[dict[str, Any]] = []
    visited: list[str] = []
    for url in urls:
        page_text = asyncio.run(crawl_url(session, url))
        if not page_text:
            continue
        visited.append(url)
        resources.extend(extract_resources_with_claude(page_text, instruction))

    payload = {
        "resources": resources,
        "live_view_url": session.live_view_url,
        "visited_urls": visited,
        "source": "live",
    }
    if cache_key:
        cache_store(cache_key, json.dumps(payload), metadata={"domain": domain})
    return payload
