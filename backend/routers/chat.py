from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from models.student import StudentProfile, profile_to_context
from prompts.master import build_system_prompt
from prompts.peer_navigator import PEER_NAVIGATOR_SYSTEM
from core.arize_logger import logged_stream

router = APIRouter()


class ChatRequest(BaseModel):
    profile: StudentProfile | None = None
    messages: list[dict] = []
    message: str


@router.post("/chat")
async def chat(request: ChatRequest):
    profile_context = profile_to_context(request.profile) if request.profile else None
    system = build_system_prompt(profile_context, PEER_NAVIGATOR_SYSTEM)

    history = list(request.messages)
    history.append({"role": "user", "content": request.message})

    async def event_stream():
        async for chunk in logged_stream(
            system=system,
            messages=history,
            max_tokens=None,
            trace_name="peer_navigator",
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
