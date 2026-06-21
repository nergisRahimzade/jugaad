import httpx

from core.config import settings

DEEPGRAM_LISTEN_URL = "https://api.deepgram.com/v1/listen"


async def transcribe_audio(audio_bytes: bytes, content_type: str = "audio/webm") -> str:
    if not settings.deepgram_api_key:
        raise ValueError("Deepgram API key not configured")

    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true",
        "language": "en-US",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            DEEPGRAM_LISTEN_URL,
            params=params,
            content=audio_bytes,
            headers={
                "Authorization": f"Token {settings.deepgram_api_key}",
                "Content-Type": content_type,
            },
        )
        response.raise_for_status()
        data = response.json()

    try:
        transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
    except (KeyError, IndexError, TypeError):
        transcript = ""

    return transcript.strip()
