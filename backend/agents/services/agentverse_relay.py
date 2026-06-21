"""Minimal Agentverse relay helpers (adapted from fetchai/agentverse-skills)."""

from __future__ import annotations

import ast
import json
import logging
import os
import re
import time
from typing import Any

import httpx

logger = logging.getLogger("jugaad.agentverse_relay")

BASE_URL = "https://agentverse.ai/v1/hosting/agents"
RELAY_PREFIX = "jugaad-relay"
_UUID_RE = re.compile(r"\bUUID\('([0-9a-f-]+)'\)")


def _headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def list_agents(api_key: str) -> list[dict[str, Any]]:
    try:
        r = httpx.get(BASE_URL, headers=_headers(api_key), timeout=30.0)
        r.raise_for_status()
        data = r.json()
        return data.get("items", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("list_agents failed: %s", exc)
        return []


def find_or_create_relay(api_key: str, session_id: str) -> str | None:
    fixed = os.getenv("AGENTVERSE_RELAY_ADDRESS", "").strip()
    if fixed:
        return fixed

    name = f"{RELAY_PREFIX}-{session_id[:8]}"
    for agent in list_agents(api_key):
        if agent.get("name") == name:
            return agent.get("address")
        if (agent.get("name") or "").startswith(RELAY_PREFIX):
            return agent.get("address")
    try:
        r = httpx.post(
            BASE_URL,
            headers=_headers(api_key),
            json={"name": name},
            timeout=30.0,
        )
        if r.status_code in (200, 201):
            return r.json().get("address")
        logger.warning("create_relay HTTP %s: %s", r.status_code, r.text[:200])
    except Exception as exc:
        logger.warning("create_relay failed: %s", exc)
    return None


def upload_code(api_key: str, address: str, code: str) -> tuple[bool, str]:
    """Upload relay agent code. Returns (ok, error_detail)."""
    files = [{"id": 0, "language": "python", "name": "agent.py", "value": code}]
    payload = {"code": files}
    try:
        r = httpx.put(
            f"{BASE_URL}/{address}/code",
            headers=_headers(api_key),
            json=payload,
            timeout=60.0,
        )
        if r.status_code in (200, 201, 204):
            return True, ""
        detail = r.text[:300]
        logger.warning("upload_code HTTP %s: %s", r.status_code, detail)
        return False, f"HTTP {r.status_code}: {detail}"
    except Exception as exc:
        logger.warning("upload_code failed: %s", exc)
        return False, str(exc)


def stop_agent(api_key: str, address: str) -> None:
    try:
        httpx.post(f"{BASE_URL}/{address}/stop", headers=_headers(api_key), timeout=30.0)
    except Exception:
        pass


def start_agent(api_key: str, address: str) -> bool:
    try:
        r = httpx.post(f"{BASE_URL}/{address}/start", headers=_headers(api_key), timeout=30.0)
        return r.status_code in (200, 201)
    except Exception as exc:
        logger.warning("start_agent failed: %s", exc)
        return False


def get_logs(api_key: str, address: str) -> list[dict[str, Any]]:
    try:
        r = httpx.get(
            f"{BASE_URL}/{address}/logs/latest",
            headers=_headers(api_key),
            timeout=30.0,
        )
        if r.status_code == 200:
            data = r.json()
            return data if isinstance(data, list) else []
    except Exception as exc:
        logger.warning("get_logs failed: %s", exc)
    return []


def _parse_result(raw: str) -> Any:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        pass
    cleaned = _UUID_RE.sub(r"'\1'", raw)
    try:
        return ast.literal_eval(cleaned)
    except (ValueError, SyntaxError):
        return raw


def extract_results(logs: list[dict[str, Any]]) -> list[Any]:
    results: list[Any] = []
    for entry in sorted(logs, key=lambda x: x.get("log_timestamp", "")):
        msg = entry.get("log_entry", "")
        if msg.startswith("RESULT:"):
            results.append(_parse_result(msg[7:]))
    return results


def extract_text_from_results(results: list[Any]) -> str:
    parts: list[str] = []
    for item in results:
        if isinstance(item, dict):
            if item.get("type") == "text" and item.get("text"):
                parts.append(str(item["text"]))
            elif item.get("type") == "resource":
                continue
            else:
                text = item.get("text") or item.get("value")
                if text:
                    parts.append(str(text))
        elif isinstance(item, str) and item.strip():
            parts.append(item)
    return "\n\n".join(parts).strip()


def build_relay_agent_code(target: str, message: str) -> str:
    escaped = message.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    return f'''from datetime import datetime, timezone
from uuid import uuid4

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

agent = Agent()
TARGET = "{target}"
MESSAGE = "{escaped}"
protocol = Protocol(spec=chat_protocol_spec)


@agent.on_event("startup")
async def send_msg(ctx: Context):
    ctx.logger.info("CHAT_STATUS:sending")
    await ctx.send(
        TARGET,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=MESSAGE)],
        ),
    )
    ctx.logger.info("CHAT_STATUS:sent")


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info("CHAT_STATUS:ack_received")


@protocol.on_message(ChatMessage)
async def handle_response(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info("CHAT_STATUS:response_received")
    for item in msg.content:
        try:
            item_dict = item.dict() if hasattr(item, "dict") else str(item)
            ctx.logger.info("RESULT:" + str(item_dict))
        except Exception as e:
            ctx.logger.info("RESULT:" + repr(item))


agent.include(protocol, publish_manifest=True)
'''


def run_relay_chat(
    api_key: str,
    target: str,
    message: str,
    *,
    wait_seconds: int = 45,
    session_id: str,
) -> dict[str, Any]:
    relay = find_or_create_relay(api_key, session_id)
    if not relay:
        return {"status": "error", "error": "Could not find or create relay agent on Agentverse"}

    stop_agent(api_key, relay)
    time.sleep(1)

    relay_code = build_relay_agent_code(target, message)
    ok, err = upload_code(api_key, relay, relay_code)
    if not ok:
        return {"status": "error", "error": f"Failed to upload relay code — {err}"}

    time.sleep(1)
    if not start_agent(api_key, relay):
        return {"status": "error", "error": "Failed to start relay agent"}

    elapsed = 0
    results: list[Any] = []
    while elapsed < wait_seconds:
        time.sleep(5)
        elapsed += 5
        logs = get_logs(api_key, relay)
        results = extract_results(logs)
        if results:
            break

    stop_agent(api_key, relay)
    text = extract_text_from_results(results)
    if text:
        return {
            "status": "success",
            "text": text,
            "target": target,
            "relay": relay,
            "wait_seconds": elapsed,
        }
    return {
        "status": "timeout",
        "error": f"No response within {wait_seconds}s",
        "target": target,
        "relay": relay,
    }
