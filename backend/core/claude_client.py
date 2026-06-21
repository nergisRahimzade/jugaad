from typing import AsyncGenerator
import anthropic
from core.config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
_async_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


def complete(
    system: str,
    messages: list[dict],
    max_tokens: int | None = None,
) -> str:
    response = _client.messages.create(
        model=settings.model_name,
        max_tokens=max_tokens or settings.max_tokens,
        system=system,
        messages=messages,
    )
    return response.content[0].text


async def stream(
    system: str,
    messages: list[dict],
    max_tokens: int | None = None,
) -> AsyncGenerator[str, None]:
    async with _async_client.messages.stream(
        model=settings.model_name,
        max_tokens=max_tokens or settings.streaming_max_tokens,
        system=system,
        messages=messages,
    ) as s:
        async for text in s.text_stream:
            yield text
