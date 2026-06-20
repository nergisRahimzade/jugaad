"""Jugaad Coordinator — routes user problems to specialist agents."""

from datetime import datetime, timezone
from uuid import uuid4

from uagents import Agent, Context, Protocol

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

from .config import COORDINATOR
from .models import JugaadQuery, JugaadResponse
from .protocols import jugaad_protocol
from .routing import route_domains
from .services.band_room import create_session, format_band_context

DOMAIN_TO_ADDRESS: dict[str, str] = {}

chat_protocol = Protocol(spec=chat_protocol_spec)

coordinator = Agent(
    name=COORDINATOR.name,
    seed=COORDINATOR.seed,
    port=COORDINATOR.port,
    mailbox=True,
    publish_agent_details=True,
    handle_messages_concurrently=True,
    network="testnet",
)


def _merge_responses(responses: list[JugaadResponse], request_id: str) -> str:
    """Merge specialist outputs into a personalized survival plan."""
    if not responses:
        return (
            "I couldn't reach our specialist agents right now. "
            "Try again in a moment or visit basicneeds.berkeley.edu for immediate help."
        )

    lines = ["Here is your personalized Jugaad survival plan:\n"]
    for idx, resp in enumerate(responses, start=1):
        lines.append(f"## {idx}. {resp.domain.replace('_', ' ').title()} ({resp.agent_name})")
        lines.append(resp.summary)
        for rec in resp.recommendations[:5]:
            lines.append(f"- {rec}")
        if resp.resources:
            top = resp.resources[0]
            lines.append(f"- Top resource: {top['name']} → {top['url']}")
        lines.append("")

    band_note = format_band_context(request_id)
    if band_note:
        lines.append(band_note)

    lines.append(
        "\n_Agents collaborated via Fetch.ai uAgents + Band shared room. "
        "Show Agentverse dashboard to verify live agent addresses._"
    )
    return "\n".join(lines)


@coordinator.on_event("startup")
async def on_startup(ctx: Context) -> None:
    ctx.logger.info(f"Coordinator address: {coordinator.address}")


@jugaad_protocol.on_message(model=JugaadResponse)
async def collect_specialist_response(ctx: Context, sender: str, msg: JugaadResponse) -> None:
    """Accumulate specialist replies until all expected responses arrive."""
    pending_key = f"pending:{msg.request_id}"
    pending = ctx.storage.get(pending_key)
    if not pending:
        return

    responses: list[dict] = pending.get("responses", [])
    responses.append(
        msg.model_dump() if hasattr(msg, "model_dump") else msg.dict()
    )
    pending["responses"] = responses
    ctx.storage.set(pending_key, pending)

    expected = set(pending["expected_domains"])
    received = {r["domain"] for r in responses}

    if expected - received:
        return

    merged = _merge_responses([JugaadResponse(**r) for r in responses], msg.request_id)
    reply_to = pending["reply_to"]

    await ctx.send(
        reply_to,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[
                TextContent(type="text", text=merged),
                EndSessionContent(type="end-session"),
            ],
        ),
    )
    ctx.storage.remove(pending_key)
    ctx.logger.info(f"Merged plan sent to {reply_to} for request {msg.request_id}")


@chat_protocol.on_message(ChatMessage)
async def handle_user_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id),
    )

    user_text = "".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()
    if not user_text:
        await ctx.send(
            sender,
            ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[
                    TextContent(type="text", text="Please describe what you need help with."),
                    EndSessionContent(type="end-session"),
                ],
            ),
        )
        return

    domains = route_domains(user_text)
    request_id = str(uuid4())
    create_session(request_id)

    ctx.storage.set(
        f"pending:{request_id}",
        {
            "expected_domains": domains,
            "responses": [],
            "reply_to": sender,
            "user_message": user_text,
        },
    )

    ctx.logger.info(f"Routing '{user_text[:60]}...' → {domains}")

    for domain in domains:
        address = DOMAIN_TO_ADDRESS.get(domain)
        if not address:
            ctx.logger.warning(f"No address registered for domain {domain}")
            continue
        await ctx.send(
            address,
            JugaadQuery(
                request_id=request_id,
                user_message=user_text,
            ),
        )


@chat_protocol.on_message(ChatAcknowledgement)
async def handle_chat_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.debug(f"Ack from {sender} for {msg.acknowledged_msg_id}")


coordinator.include(jugaad_protocol)
coordinator.include(chat_protocol, publish_manifest=True)


def register_specialist_addresses(addresses: dict[str, str]) -> None:
    """Called by bureau runner once specialist agents are created."""
    DOMAIN_TO_ADDRESS.update(addresses)
