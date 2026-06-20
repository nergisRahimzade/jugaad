"""
Jugaad Food Agent — Agentverse Hosted Agent

Setup: agentverse.ai → New Agent → Blank → paste agent.py + messages.py → Run
"""

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

DOMAIN = "food"
SUMMARY = "Stack CalFresh, pantry, free food calendar, and surplus network for near-zero food budget."
RECOMMENDATIONS = [
    "CalFresh Stacking: CalFresh ($292/mo) + MLK pantry + Grab N Go + club catering.",
    "CalFresh Loopholes: Half-time + work-study can qualify regardless of income.",
    "Food Pantry: MLK Student Union lower level — walk-in, weekly groceries.",
    "Free Food Calendar: Club meetings and dept events with catering.",
    "Basic Needs: basicneeds.berkeley.edu/faq/calfresh",
]

chat_protocol = Protocol(spec=chat_protocol_spec)


def _build_reply(user_message: str) -> str:
    lines = [f"**Jugaad Food Agent**\n\n{SUMMARY}\n"]
    for rec in RECOMMENDATIONS:
        lines.append(f"- {rec}")
    lines.append(f"\nFor: \"{user_message}\" → start CalFresh + pantry this week.")
    return "\n".join(lines)


@chat_protocol.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    user_text = "".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    query = parse_query(user_text)
    if query:
        request_id, message = query
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
    reply = _build_reply(user_text or "food help")
    await ctx.send(
        sender,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[
                TextContent(type="text", text=reply),
                EndSessionContent(type="end-session"),
            ],
        ),
    )


agent.include(chat_protocol, publish_manifest=True)
