"""Jugaad Safety Agent — paste agent.py + messages.py on Agentverse, then Run."""

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

DOMAIN = "safety"
SUMMARY = "Walking buddies, safe routes, SafeWalk, and community safety for late-night campus travel."
RECOMMENDATIONS = [
    "Walking Buddy Matching: Match students heading the same direction within 10 minutes.",
    "Smart Safe Route: Oxford over Telegraph after 10pm — better lit, fewer incidents.",
    "SafeWalk On-Demand: Request CSO escort via UCPD.",
    "Community Safety Pulse: Share anonymous real-time area flags with peers.",
    "ucpd.berkeley.edu for SafeWalk and emergency contacts.",
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
    lines = [f"**Jugaad Safety Agent**\n\n{SUMMARY}\n"]
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


agent.include(chat_protocol, publish_manifest=True)
