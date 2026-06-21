import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
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
    route_domains,
    build_coordinator_system,
    build_orchestration_events,
)
from agents.services.agentverse_client import chat_with_coordinator
from agents.config import COORDINATOR_ADDRESS
from services.data_layer_service import gather_domain_intel
from services.demo_seed_service import match_demo_seed
from services.profile_service import (
    analyze_profile,
    build_profile_addendum,
    extract_profile_updates,
    merge_profile,
)

router = APIRouter()

_DEMO_SEEDS_ENABLED = os.getenv("DEMO_SEEDS_ENABLED", "1").strip().lower() not in ("0", "false", "no")


async def _stream_text(text: str, chunk_size: int = 48):
    """Yield plain SSE chunks for pre-seeded demo responses."""
    for i in range(0, len(text), chunk_size):
        yield f"data: {text[i : i + chunk_size]}\n\n"
        await asyncio.sleep(0.012)

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
    demo_seed = match_demo_seed(request.message) if _DEMO_SEEDS_ENABLED else None
    domains = demo_seed.domains if demo_seed else route_domains(request.message)
    profile = request.profile
    history = list(request.messages)
    history.append({"role": "user", "content": request.message})

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
    data_context, intel_by_domain, _agent_responses = gather_domain_intel(
        request.message, domains, profile
    )
    request_id, orchestration_events = build_orchestration_events(
        request.message,
        intel_events_by_domain=intel_by_domain,
    )

    async def event_stream():
        meta = {
            "type": "meta",
            "agents": domains,
            "requestId": request_id,
            "missingProfileFields": analysis.missing_fields,
            "profileCompleteness": analysis.completeness,
        }
        if profile_patch:
            meta["profilePatch"] = profile_patch
        if demo_seed:
            meta["demoSeed"] = demo_seed.id
            meta["demoLabel"] = demo_seed.label
        yield f"data: {json.dumps(meta)}\n\n"

        for event in orchestration_events:
            yield f'data: {json.dumps({"type": "agent_event", "event": event})}\n\n'

        agentverse_context: str | None = None
        agentverse_enabled = (
            not demo_seed
            and os.getenv("AGENTVERSE_CHAT_ENABLED", "1").strip().lower() not in ("0", "false", "no")
        )
        if domains and COORDINATOR_ADDRESS and agentverse_enabled:
            short_addr = COORDINATOR_ADDRESS[:20] + "…"
            yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "agentverse", "message": f"Dispatching ChatMessage to Agentverse Coordinator ({short_addr}) via relay…", "meta": {"target": short_addr, "requestId": request_id}}})}\n\n'

            av_result = await asyncio.to_thread(
                chat_with_coordinator,
                request.message,
                session_id=request_id,
            )
            av_status = av_result.get("status", "error")

            if av_status == "success" and av_result.get("text"):
                agentverse_context = av_result["text"]
                preview = agentverse_context[:120].replace("\n", " ")
                yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "agentverse", "message": f"Agentverse Coordinator responded ({len(agentverse_context)} chars): {preview}…", "meta": {"requestId": request_id, "status": "success"}}})}\n\n'
            else:
                err = av_result.get("error", av_status)
                agentverse_context = f"(Agentverse unavailable: {err}. Using Claude + Redis/Browserbase only.)"
                yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "agentverse", "message": f"Agentverse fallback — {err}", "meta": {"requestId": request_id, "status": av_status}}})}\n\n'
            yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "merge", "message": "Claude synthesizing Agentverse plan + Redis/Browserbase + profile…", "meta": {"requestId": request_id}}})}\n\n'
        elif domains:
            merge_msg = (
                "Delivering curated demo hack stack (Jugaad 1, Jugaad 2…)…"
                if demo_seed
                else "Claude synthesizing specialist Redis/Browserbase output + profile…"
            )
            yield f'data: {json.dumps({"type": "agent_event", "event": {"agentId": "coordinator", "type": "merge", "message": merge_msg, "meta": {"requestId": request_id, "demoSeed": demo_seed.id if demo_seed else None}}})}\n\n'

        if demo_seed:
            async for chunk in _stream_text(demo_seed.response):
                yield chunk
        else:
            system = build_coordinator_system(
                domains,
                analysis.context,
                profile_addendum,
                data_context,
                agentverse_context=agentverse_context,
            )
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
    domains = [request.domain] if request.domain else []
    profile = request.profile
    history = list(request.messages)
    history.append({"role": "user", "content": request.message})

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
            messages=history,
            max_tokens=None,
            trace_name=trace_name,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
