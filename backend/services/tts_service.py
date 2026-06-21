import re

import httpx

from core.config import settings

DEEPGRAM_SPEAK_URL = "https://api.deepgram.com/v1/speak"

# Deepgram /speak accepts up to ~2000 characters per request.
MAX_TTS_CHARS = 1900


def _clean_text(text: str) -> str:
    """Strip markdown decorations so the spoken audio sounds natural."""
    cleaned = text.replace("**", "").replace("*", "")
    # Drop the "Agents: ..." routing header that prefixes some replies.
    cleaned = re.sub(r"^\s*Agents:[^\n]*\n+", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    if len(cleaned) > MAX_TTS_CHARS:
        cleaned = cleaned[:MAX_TTS_CHARS].rsplit(" ", 1)[0]
    return cleaned


async def synthesize_speech(text: str) -> bytes:
    """Convert text to spoken audio (MP3 bytes) using Deepgram Aura TTS."""
    if not settings.deepgram_api_key:
        raise ValueError("Deepgram API key not configured")

    spoken_text = _clean_text(text)
    if not spoken_text:
        raise ValueError("No text to synthesize")

    params = {
        "model": settings.deepgram_tts_model,
        "encoding": "mp3",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            DEEPGRAM_SPEAK_URL,
            params=params,
            json={"text": spoken_text},
            headers={
                "Authorization": f"Token {settings.deepgram_api_key}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        return response.content
