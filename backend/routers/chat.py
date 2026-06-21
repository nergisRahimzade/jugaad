from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
from models.student import StudentProfile, profile_to_context
from prompts.master import build_system_prompt
from prompts.peer_navigator import PEER_NAVIGATOR_SYSTEM
from prompts.domains.food import FOOD_DOMAIN
from prompts.domains.housing import HOUSING_DOMAIN
from prompts.domains.financial_aid import FINANCIAL_AID_DOMAIN
from prompts.domains.safety import SAFETY_DOMAIN
from prompts.domains.academic import ACADEMIC_DOMAIN
from prompts.domains.wellness import WELLNESS_DOMAIN
from core.arize_logger import logged_stream
from services.coordinator_service import (
    route_domains,
    build_coordinator_system,
    build_orchestration_events,
)

router = APIRouter()

DOMAIN_PROMPTS: dict[str, str] = {
    "food": FOOD_DOMAIN,
    "housing": HOUSING_DOMAIN,
    "financial_aid": FINANCIAL_AID_DOMAIN,
    "safety": SAFETY_DOMAIN,
    "academic": ACADEMIC_DOMAIN,
    "wellness": WELLNESS_DOMAIN,
    "scholarship": FINANCIAL_AID_DOMAIN,
}


class ChatRequest(BaseModel):
    profile: StudentProfile | None = None
    messages: list[dict] = []
    message: str
    domain: str | None = None


class CoordinatorRequest(BaseModel):
    profile: StudentProfile | None = None
    messages: list[dict] = []
    message: str


@router.post("/chat/coordinator")
async def coordinator_chat(request: CoordinatorRequest):
    domains = route_domains(request.message)
    profile_context = profile_to_context(request.profile) if request.profile else None
    system = build_coordinator_system(domains, profile_context)
    request_id, orchestration_events = build_orchestration_events(request.message)

    history = list(request.messages)
    history.append({"role": "user", "content": request.message})

    async def event_stream():
        yield f'data: {json.dumps({"type": "meta", "agents": domains, "requestId": request_id})}\n\n'
        for event in orchestration_events:
            yield f'data: {json.dumps({"type": "agent_event", "event": event})}\n\n'
        async for chunk in logged_stream(
            system=system,
            messages=history,
            max_tokens=None,
            trace_name="coordinator",
        ):
            yield f"data: {chunk}\n\n"
        yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "merge", "message": "ChatMessage delivered to user (EndSessionContent)", "meta": {"requestId": request_id}}})}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/chat")
async def chat(request: ChatRequest):
    profile_context = profile_to_context(request.profile) if request.profile else None
    domain_addendum = DOMAIN_PROMPTS.get(request.domain, PEER_NAVIGATOR_SYSTEM) if request.domain else PEER_NAVIGATOR_SYSTEM
    system = build_system_prompt(profile_context, domain_addendum)

    history = list(request.messages)
    history.append({"role": "user", "content": request.message})

    trace_name = f"agent_{request.domain}" if request.domain else "peer_navigator"

    async def event_stream():
        async for chunk in logged_stream(
            system=system,
            messages=history,
            max_tokens=None,
            trace_name=trace_name,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
