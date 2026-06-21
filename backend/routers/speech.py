import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from services.speech_service import transcribe_audio
from services.tts_service import synthesize_speech

router = APIRouter()


class SynthesizeRequest(BaseModel):
    text: str


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Expected an audio file")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        transcript = await transcribe_audio(audio_bytes, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Deepgram transcription failed: {exc.response.status_code}",
        ) from exc

    if not transcript:
        raise HTTPException(status_code=422, detail="No speech detected in recording")

    return {"transcript": transcript}


@router.post("/synthesize")
async def synthesize(request: SynthesizeRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Expected non-empty text")

    try:
        audio_bytes = await synthesize_speech(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Deepgram synthesis failed: {exc.response.status_code}",
        ) from exc

    return Response(content=audio_bytes, media_type="audio/mpeg")
