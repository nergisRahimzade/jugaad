"""Jugaad Housing Agent — paste agent.py + messages.py on Agentverse, then Run."""

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

from messages import format_response, parse_query

agent = Agent()

DOMAIN = "housing"
SUMMARY = "Co-op secret, emergency bridge, rent control, and lease protection for Berkeley students."
RECOMMENDATIONS = [
    "BSC Co-Op Secret: 30–50% cheaper than dorms, meals included — bsc.coop",
    "Rent Control: Pre-1980 Berkeley units have annual caps — push back on illegal increases.",
    "Emergency Bridge Housing: Basic Needs matches temporary housing between leases.",
    "Summer Sublet Conversion: Negotiate full-year lease after discounted summer sublet.",
    "Lease Red-Flag Scanner: Watch for illegal deposits and missing habitability terms.",
]

chat_protocol = Protocol(spec=chat_protocol_spec)


@chat_protocol.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    user_text = "".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    query = parse_query(user_text)
    if query:
        request_id, _ = query
        await ctx.send(
            sender,
            ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[
                    TextContent(
                        type="text",
                        text=format_response(request_id, DOMAIN, SUMMARY, RECOMMENDATIONS),
                    )
                ],
            ),
        )
        return

    await ctx.send(
        sender,
        ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id
        ),
    )
    lines = [f"**Jugaad Housing Agent**\n\n{SUMMARY}\n"]
    lines.extend(f"- {r}" for r in RECOMMENDATIONS)
    await ctx.send(
        sender,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[
                TextContent(type="text", text="\n".join(lines)),
                EndSessionContent(type="end-session"),
            ],
        ),
    )


@chat_protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    pass


agent.include(chat_protocol, publish_manifest=True)
