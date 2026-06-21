from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
from models.student import StudentProfile
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
    route_decision,
    normalize_student_input,
    segment_history_for_routing,
    build_coordinator_system,
    build_orchestration_events,
)
from services.profile_service import (
    analyze_profile,
    build_profile_addendum,
    extract_profile_updates,
    merge_profile,
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


class CoordinatorRequest(BaseModel):
    profile: StudentProfile | None = None
    profile_initialized: bool = False
    messages: list[dict] = []
    message: str


class ChatRequest(BaseModel):
    profile: StudentProfile | None = None
    profile_initialized: bool = False
    messages: list[dict] = []
    message: str
    domain: str | None = None


@router.post("/chat/coordinator")
async def coordinator_chat(request: CoordinatorRequest):
    cleaned_message = normalize_student_input(request.message)
    decision = route_decision(cleaned_message, request.messages)
    domains = decision.activated_agents
    profile = request.profile
    history = list(request.messages)
    history.append({"role": "user", "content": cleaned_message})
    prompt_history = segment_history_for_routing(history, decision)

    profile_patch = None
    if profile:
        analysis_pre = analyze_profile(profile, domains, request.profile_initialized)
        if analysis_pre.missing_fields:
            updates = extract_profile_updates(profile, history, analysis_pre.missing_fields)
            if updates:
                profile = merge_profile(profile, updates)
                profile_patch = updates

    analysis = analyze_profile(profile, domains, request.profile_initialized)
    profile_addendum = build_profile_addendum(analysis, domains)
    system = build_coordinator_system(domains, analysis.context, profile_addendum)
    request_id, orchestration_events = build_orchestration_events(cleaned_message, decision=decision)

    async def event_stream():
        meta = {
            "type": "meta",
            "agents": domains,
            "requestId": request_id,
            "missingProfileFields": analysis.missing_fields,
            "profileCompleteness": analysis.completeness,
            "routingDecision": decision.to_json_dict(),
        }
        if profile_patch:
            meta["profilePatch"] = profile_patch
        yield f"data: {json.dumps(meta)}\n\n"
        for event in orchestration_events:
            yield f'data: {json.dumps({"type": "agent_event", "event": event})}\n\n'
        async for chunk in logged_stream(
            system=system,
            messages=prompt_history,
            max_tokens=None,
            trace_name="coordinator",
        ):
            yield f"data: {chunk}\n\n"
        yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "merge", "message": "ChatMessage delivered to user (EndSessionContent)", "meta": {"requestId": request_id}}})}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/chat")
async def chat(request: ChatRequest):
    domains = [request.domain] if request.domain else []
    profile = request.profile
    history = list(request.messages)
    cleaned_message = normalize_student_input(request.message)
    history.append({"role": "user", "content": cleaned_message})

    profile_patch = None
    if profile and domains:
        analysis_pre = analyze_profile(profile, domains, request.profile_initialized)
        if analysis_pre.missing_fields:
            updates = extract_profile_updates(profile, history, analysis_pre.missing_fields)
            if updates:
                profile = merge_profile(profile, updates)
                profile_patch = updates

    analysis = analyze_profile(profile, domains, request.profile_initialized)
    profile_addendum = build_profile_addendum(analysis, domains) if domains else None
    domain_addendum = DOMAIN_PROMPTS.get(request.domain, PEER_NAVIGATOR_SYSTEM) if request.domain else PEER_NAVIGATOR_SYSTEM
    if profile_addendum:
        domain_addendum = f"{domain_addendum}\n\n{profile_addendum}"
    system = build_system_prompt(analysis.context, domain_addendum)

    trace_name = f"agent_{request.domain}" if request.domain else "peer_navigator"

    async def event_stream():
        if request.domain:
            meta = {
                "type": "meta",
                "agents": domains,
                "missingProfileFields": analysis.missing_fields,
                "profileCompleteness": analysis.completeness,
            }
            if profile_patch:
                meta["profilePatch"] = profile_patch
            yield f"data: {json.dumps(meta)}\n\n"
        async for chunk in logged_stream(
            system=system,
            messages=history[-8:],
            max_tokens=None,
            trace_name=trace_name,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
