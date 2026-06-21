"""Data-layer smoke test against the real .env credentials.

Run with::

    .venv/bin/python smoke_test.py

We check, in order:

1. ``.env`` loads cleanly and the expected keys are present.
2. Redis core is reachable (``PING``).
3. RedisVL hack index can be created / inspected.
4. LangCache (managed semantic cache) responds.
5. Redis Cloud Agent Memory responds.
6. Browserbase Fetch API returns markdown for one Berkeley page.
7. Browserbase Fetch API returns structured JSON for the same page.
8. The food finder runs end-to-end.

The script never prints API keys; it reports OK/FAIL per check and exits with
the count of failures.
"""

from __future__ import annotations

import os
import sys
import traceback
from pathlib import Path

from dotenv import load_dotenv


_BACKEND = Path(__file__).resolve().parent
_ENV_FILE = _BACKEND / ".env"
_FAIL = 0
_PASS = 0


def _check(label: str, fn) -> None:
    global _FAIL, _PASS
    print(f"\n→ {label}")
    try:
        result = fn()
        print(f"  ✓ {result}")
        _PASS += 1
    except AssertionError as exc:
        _FAIL += 1
        print(f"  ✗ {exc}")
    except Exception as exc:
        _FAIL += 1
        print(f"  ✗ {type(exc).__name__}: {exc}")
        traceback.print_exc()


def _present(key: str) -> str:
    val = os.getenv(key)
    return "set" if val else "missing"


def main() -> int:
    if not _ENV_FILE.exists():
        print(f"FATAL: {_ENV_FILE} not found")
        return 99
    load_dotenv(_ENV_FILE, override=True)

    print(f"Loaded {_ENV_FILE.name}")
    for key in [
        "ANTHROPIC_API_KEY",
        "REDIS_URL",
        "REDIS_LANGCACHE_URL",
        "REDIS_LANGCACHE_ID",
        "REDIS_LANGCACHE_API_KEY",
        "REDIS_AGENT_MEM_URL",
        "BROWSERBASE_API_KEY",
        "BROWSERBASE_PROJECT_ID",
    ]:
        print(f"  - {key}: {_present(key)}")

    sys.path.insert(0, str(_BACKEND))

    # Importing here so ``load_dotenv`` runs before pydantic-settings reads env.
    from core.config import settings  # noqa: E402

    def redis_ping():
        import socket
        import urllib.parse as up

        import redis

        url = settings.redis_url
        assert url, "REDIS_URL is unset"
        parsed = up.urlparse(url)
        # Common malformed shape: 'redis://defaultPASSWORDhost:port' — no ':' or '@'.
        # If we can't DNS-resolve the parsed hostname, surface a targeted hint.
        try:
            socket.gethostbyname(parsed.hostname or "")
        except Exception as exc:
            raise AssertionError(
                f"DNS resolution failed for parsed host {parsed.hostname!r}. "
                "Your REDIS_URL is likely malformed — expected "
                "redis://USERNAME:URL_ENCODED_PASSWORD@HOST:PORT. "
                f"({exc})"
            ) from None

        client = redis.from_url(
            url, decode_responses=True, socket_connect_timeout=5, socket_timeout=5
        )
        assert client.ping(), "PING returned False"
        return "Redis PING ok"

    def redisvl_index():
        from agents.services.redis_store import _get_index, index_stats

        idx = _get_index()
        assert idx is not None, "_get_index returned None — RedisVL/embeddings failed"
        info = index_stats()
        return f"index={info['name']!r} docs={info['count']} available={info['available']}"

    def langcache_roundtrip():
        from agents.services import redis_cache

        prompt = "smoke-test: how do I get CalFresh as a half-time student?"
        ok = redis_cache.store(prompt, {"answer": "smoke"}, metadata={"smoke": "1"})
        assert ok, "LangCache store returned False — check URL/ID/key"
        hit = redis_cache.check(prompt)
        assert hit is not None, "LangCache check did not retrieve our prompt"
        return f"stats={redis_cache.stats()} hit_keys={list(hit.keys())}"

    def agent_memory_roundtrip():
        from agents.services import redis_memory

        ok = redis_memory.put_session("smoke-session", {"smoke": True})
        assert ok, "AMS put_session failed"
        echo = redis_memory.get_session("smoke-session")
        return f"stats={redis_memory.stats()} echoed_keys={list(echo.keys())[:3]}"

    def browserbase_fetch_markdown():
        from agents.services.browserbase import fetch_markdown

        md = fetch_markdown("https://basicneeds.berkeley.edu/food-pantry")
        assert md, "Browserbase Fetch returned None — check API key + endpoint"
        assert "pantry" in md.lower() or "basic needs" in md.lower(), \
            f"Markdown body looks empty/unexpected ({len(md)} chars)"
        return f"got {len(md)} chars of markdown"

    def browserbase_fetch_json():
        from agents.services.browserbase import fetch_json
        from agents.services.browserbase._schema import RESOURCE_LIST_SCHEMA

        payload = fetch_json("https://basicneeds.berkeley.edu/food-pantry", RESOURCE_LIST_SCHEMA)
        assert payload is not None, "Browserbase JSON fetch returned None"
        resources = payload.get("resources") or []
        first = resources[0].get("name") if resources else None
        return f"extracted {len(resources)} resources; first name={first!r}"

    def food_finder_end_to_end():
        from agents.services.browserbase import find_food_resources

        result = find_food_resources({"citizenship": "US citizen"})
        resources = result.get("resources", [])
        visited = result.get("visited_urls", [])
        return (
            f"source={result.get('source')} visited={len(visited)} "
            f"resources={len(resources)} sample={(resources[0] or {}).get('name') if resources else None!r}"
        )

    _check("Redis core PING", redis_ping)
    _check("RedisVL hack index create+inspect", redisvl_index)
    _check("LangCache store→check round-trip", langcache_roundtrip)
    _check("Redis Cloud Agent Memory session round-trip", agent_memory_roundtrip)
    _check("Browserbase Fetch (markdown)", browserbase_fetch_markdown)
    _check("Browserbase Fetch (JSON schema)", browserbase_fetch_json)
    _check("Food finder end-to-end", food_finder_end_to_end)

    print(f"\n=== {_PASS} passed, {_FAIL} failed ===")
    return _FAIL


if __name__ == "__main__":
    sys.exit(main())
