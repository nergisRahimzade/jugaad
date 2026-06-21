"""Jugaad Scholarship Agent — paste agent.py + messages.py on Agentverse, then Run."""

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

DOMAIN = "scholarship"
SUMMARY = "Micro-scholarship scan across Berkeley departments, cultural centers, and foundations."
RECOMMENDATIONS = [
    "Department Scholarships: Many $500–$2,000 awards per major with few applicants.",
    "Cultural Center Awards: Identity-based centers often overlooked in general searches.",
    "Essay Reuse Strategy: Adapt one personal statement across micro-scholarships.",
    "Deadline Stack: Apply to 5+ small awards this week for cumulative impact.",
    "financialaid.berkeley.edu + your department page for rolling awards.",
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
    lines = [f"**Jugaad Scholarship Agent**\n\n{SUMMARY}\n"]
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
