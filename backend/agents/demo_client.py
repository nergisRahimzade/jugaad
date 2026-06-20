"""
Demo client — simulates a user asking the Coordinator for help.

Usage (with bureau running in another terminal):
  cd backend && python -m agents.demo_client "I need help paying for food."
"""

import asyncio
import sys
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

DEMO_MESSAGE = "I need help paying for food."

client = Agent(
    name="jugaad-demo-client",
    seed="jugaad-demo-client-seed-berkeley-2026",
    port=8010,
    endpoint=["http://127.0.0.1:8010/submit"],
)

chat = Protocol(spec=chat_protocol_spec)
response_event = asyncio.Event()
last_response = {"text": ""}


@client.on_event("startup")
async def send_query(ctx: Context) -> None:
    message = sys.argv[1] if len(sys.argv) > 1 else DEMO_MESSAGE
    ctx.logger.info(f"Sending to coordinator: {message}")
    await ctx.send(
        coordinator.address,
        ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=message)],
        ),
    )


@chat.on_message(ChatAcknowledgement)
async def on_ack(ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
    ctx.logger.info(f"Coordinator acknowledged message {msg.acknowledged_msg_id}")


@chat.on_message(ChatMessage)
async def on_response(ctx: Context, sender: str, msg: ChatMessage) -> None:
    text = "".join(item.text for item in msg.content if isinstance(item, TextContent))
    last_response["text"] = text
    print("\n" + "=" * 60)
    print("COORDINATOR RESPONSE")
    print("=" * 60)
    print(text)
    print("=" * 60 + "\n")
    response_event.set()


client.include(chat)


def main() -> None:
    client.run()


if __name__ == "__main__":
    main()
