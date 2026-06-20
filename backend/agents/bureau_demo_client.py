"""In-bureau demo client for reliable local multi-agent testing."""

from datetime import datetime, timezone
from uuid import uuid4

from uagents import Agent, Context, Protocol

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

from .coordinator import coordinator

demo_client = Agent(
    name="jugaad-demo-client",
    seed="jugaad-demo-client-seed-berkeley-2026",
    network="testnet",
)

chat = Protocol(spec=chat_protocol_spec)


@demo_client.on_event("startup")
async def send_demo_query(ctx: Context) -> None:
    query = "I need help paying for food."
    ctx.logger.info(f"Demo query → coordinator: {query}")
    await ctx.send(
        coordinator.address,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=query)],
        ),
    )


@chat.on_message(ChatAcknowledgement)
async def on_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.info("Coordinator acknowledged demo message")


@chat.on_message(ChatMessage)
async def on_response(ctx: Context, sender: str, msg: ChatMessage) -> None:
    text = "".join(item.text for item in msg.content if isinstance(item, TextContent))
    ctx.logger.info("=== DEMO RESPONSE ===")
    for line in text.splitlines():
        ctx.logger.info(line)


demo_client.include(chat)
