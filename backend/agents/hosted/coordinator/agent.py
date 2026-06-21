"""
Jugaad Coordinator — Agentverse Hosted Agent

Setup on agentverse.ai:
1. New Agent → Blank → name: Jugaad Coordinator Agent
2. Add files: agent.py (this), routing.py, addresses.py, messages.py
   Copy messages.py from ../lib/messages.py
3. Fill SPECIALIST_ADDRESSES in addresses.py
4. Click Run
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

from addresses import SPECIALIST_ADDRESSES
from messages import format_query, format_response, parse_response
from routing import route_domains

agent = Agent()

chat_protocol = Protocol(spec=chat_protocol_spec)


def _merge_responses(responses: list[dict]) -> str:
    if not responses:
        return (
            "I couldn't reach specialist agents. Check addresses.py and that "
            "each specialist agent is running on Agentverse."
        )
    lines = ["Here is your personalized Jugaad survival plan:\n"]
    for idx, resp in enumerate(responses, start=1):
        domain = resp["domain"].replace("_", " ").title()
        lines.append(f"## {idx}. {domain}")
        lines.append(resp["summary"])
        for rec in resp["recommendations"][:5]:
            lines.append(f"- {rec}")
        lines.append("")
    lines.append("_Agents collaborated via Fetch.ai Agentverse hosted agents._")
    return "\n".join(lines)


@chat_protocol.on_message(ChatMessage)
async def handle_chat(ctx: Context, sender: str, msg: ChatMessage) -> None:
    user_text = "".join(
        item.text for item in msg.content if isinstance(item, TextContent)
    ).strip()

    # Specialist reply routed back to coordinator
    parsed_response = parse_response(user_text)
    if parsed_response:
        request_id, domain, summary, recommendations = parsed_response
        pending_key = f"pending:{request_id}"
        pending = ctx.storage.get(pending_key)
        if pending:
            responses = pending.get("responses", [])
            responses.append(
                {
                    "domain": domain,
                    "summary": summary,
                    "recommendations": recommendations,
                }
            )
            pending["responses"] = responses
            ctx.storage.set(pending_key, pending)

            expected = set(pending["expected_domains"])
            received = {r["domain"] for r in responses}
            if expected - received:
                return

            merged = _merge_responses(responses)
            await ctx.send(
                pending["reply_to"],
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
        return

    # User message
    await ctx.send(
        sender,
        ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id
        ),
    )

    if not user_text:
        await ctx.send(
            sender,
            ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[
                    TextContent(type="text", text="Tell me what you need help with."),
                    EndSessionContent(type="end-session"),
                ],
            ),
        )
        return

    domains = route_domains(user_text)
    request_id = str(uuid4())
    ctx.storage.set(
        f"pending:{request_id}",
        {
            "expected_domains": domains,
            "responses": [],
            "reply_to": sender,
        },
    )

    ctx.logger.info(f"Routing to {domains}")

    for domain in domains:
        address = SPECIALIST_ADDRESSES.get(domain, "").strip()
        if not address:
            ctx.logger.warning(f"No address for domain {domain}")
            continue
        await ctx.send(
            address,
            ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text=format_query(request_id, user_text))],
            ),
        )


@chat_protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    pass


agent.include(chat_protocol, publish_manifest=True)
