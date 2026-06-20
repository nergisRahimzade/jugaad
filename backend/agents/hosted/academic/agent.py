"""Jugaad Academic Agent — paste agent.py + messages.py on Agentverse, then Run."""

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

DOMAIN = "academic"
SUMMARY = "Enrollment strategy, BerkeleyTime patterns, study groups, and prerequisite navigation."
RECOMMENDATIONS = [
    "BerkeleyTime Pattern Analysis: Which sections have drops and slower-fill professors.",
    "UC Extension Backdoor: Open enrollment equivalents that may count toward your degree.",
    "Study Group Matching: Matched groups for CS 10, CS 61A, EECS 127 pass at higher rates.",
    "Prerequisite Soft vs Hard: Some prereqs are recommended, not required.",
    "berkeleytime.com and classes.berkeley.edu for enrollment and holds.",
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
    lines = [f"**Jugaad Academic Agent**\n\n{SUMMARY}\n"]
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
