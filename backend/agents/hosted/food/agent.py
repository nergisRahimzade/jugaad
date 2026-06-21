"""
Jugaad Food Agent — Agentverse Hosted (single file, paste all of this into agent.py)

Fetch chat protocol requires handlers for BOTH ChatMessage and ChatAcknowledgement.
"""

import re
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

agent = Agent()
protocol = Protocol(spec=chat_protocol_spec)

SUMMARY = "Stack CalFresh, pantry, free food calendar, and surplus network for near-zero food budget."
RECOMMENDATIONS = [
    "CalFresh Stacking: CalFresh ($292/mo) + MLK pantry + Grab N Go + club catering.",
    "CalFresh Loopholes: Half-time + work-study can qualify regardless of income.",
    "Food Pantry: MLK Student Union lower level — walk-in, weekly groceries.",
    "Free Food Calendar: Club meetings and dept events with catering.",
    "Basic Needs: basicneeds.berkeley.edu/faq/calfresh",
]


def _build_reply(user_message: str) -> str:
    lines = [f"**Jugaad Food Agent**\n\n{SUMMARY}\n"]
    for rec in RECOMMENDATIONS:
        lines.append(f"- {rec}")
    lines.append(f'\nFor: "{user_message}" → start CalFresh + pantry this week.')
    return "\n".join(lines)


@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage) -> None:
    await ctx.send(
        sender,
        ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc),
            acknowledged_msg_id=msg.msg_id,
        ),
    )

    text = ""
    for item in msg.content:
        if isinstance(item, TextContent):
            text += item.text
    text = re.sub(r"@\S+\s*", "", text).strip()

    ctx.logger.info(f"Food agent received: {text[:80]}")

    reply = _build_reply(text or "food help")

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


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    pass


agent.include(protocol, publish_manifest=True)
