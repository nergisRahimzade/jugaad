"""Thin wrapper around Browserbase's Fetch, Search, and Sessions APIs.

We deliberately bypass the full Playwright/Stagehand path on the hot loop and
lean on the *Fetch API* — a single REST call returns a Berkeley page either as
markdown or as structured JSON matching a schema we provide. That keeps the
finder agents tiny and fast.

Three primitives:

* :func:`fetch_json` — Fetch API with ``format="json"`` and a JSON schema. This
  is where the prize-worthy magic happens: Browserbase itself parses the page
  into our resource shape, so we don't need a second LLM hop.
* :func:`fetch_markdown` — Fetch API with ``format="markdown"`` for cases where
  we want to hand text to Claude downstream.
* :func:`search_web` — Search API for "find me X" type queries when no canonical
  URL exists.

We also expose :func:`create_live_session` for the demo moments where we want
the judges to watch the agent in real time (Demo Script 1).
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from core.config import settings

logger = logging.getLogger("jugaad.browserbase")

_API_BASE = "https://api.browserbase.com/v1"
_LIVE_VIEW_BASE = "https://browserbase.com/sessions"
_REQUEST_TIMEOUT = 60


def _headers() -> dict[str, str]:
    return {
        "X-BB-API-Key": settings.browserbase_api_key,
        "Content-Type": "application/json",
    }


def _ready() -> bool:
    return bool(settings.browserbase_api_key)


def fetch_json(url: str, schema: dict[str, Any], *, follow_redirects: bool = True) -> dict[str, Any] | None:
    """Fetch ``url`` and let Browserbase parse it into ``schema``.

    Returns the parsed payload (a dict matching the schema) or ``None`` if
    Browserbase is unconfigured or the call fails. We pass ``proxies=True`` so
    that any Cloudflare-style protections on Berkeley sites get bypassed
    automatically.
    """
    if not _ready():
        return None
    body = {
        "url": url,
        "format": "json",
        "schema": schema,
        "allowRedirects": follow_redirects,
        "proxies": True,
    }
    try:
        with httpx.Client(timeout=_REQUEST_TIMEOUT) as http:
            response = http.post(f"{_API_BASE}/fetch", json=body, headers=_headers())
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.warning("Browserbase fetch_json(%s) failed: %s", url, exc)
        return None
    content = payload.get("content")
    if isinstance(content, str):
        try:
            import json as _json

            return _json.loads(content)
        except Exception:
            logger.warning("Browserbase fetch_json content not JSON: %.120s", content)
            return None
    if isinstance(content, dict):
        return content
    return None


def fetch_markdown(url: str, *, follow_redirects: bool = True) -> str | None:
    """Fetch ``url`` and return a markdown rendering of the page."""
    if not _ready():
        return None
    body = {
        "url": url,
        "format": "markdown",
        "allowRedirects": follow_redirects,
        "proxies": True,
    }
    try:
        with httpx.Client(timeout=_REQUEST_TIMEOUT) as http:
            response = http.post(f"{_API_BASE}/fetch", json=body, headers=_headers())
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.warning("Browserbase fetch_markdown(%s) failed: %s", url, exc)
        return None
    content = payload.get("content")
    return content if isinstance(content, str) else None


def search_web(query: str, num_results: int = 10) -> list[dict[str, Any]]:
    """Run a Browserbase web search — used for open-ended "find me X" queries."""
    if not _ready():
        return []
    body = {"query": query[:200], "numResults": max(1, min(num_results, 25))}
    try:
        with httpx.Client(timeout=_REQUEST_TIMEOUT) as http:
            response = http.post(f"{_API_BASE}/search", json=body, headers=_headers())
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.warning("Browserbase search(%s) failed: %s", query, exc)
        return []
    return payload.get("results", []) or []


def create_live_session() -> dict[str, str] | None:
    """Spin up a Browserbase session and return its live-view URL for the UI.

    Only worth calling for the demo path where the judges should literally see
    the agent browsing. The finders themselves use the cheaper Fetch API.
    """
    if not _ready():
        return None
    body: dict[str, Any] = {"timeout": 1800}
    if settings.browserbase_project_id:
        body["projectId"] = settings.browserbase_project_id
    if settings.browserbase_region:
        body["region"] = settings.browserbase_region
    try:
        with httpx.Client(timeout=_REQUEST_TIMEOUT) as http:
            response = http.post(f"{_API_BASE}/sessions", json=body, headers=_headers())
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        logger.warning("Browserbase session create failed: %s", exc)
        return None
    session_id = data.get("id")
    if not session_id:
        return None
    return {
        "session_id": session_id,
        "live_view_url": f"{_LIVE_VIEW_BASE}/{session_id}",
        "connect_url": data.get("connectUrl", ""),
    }
