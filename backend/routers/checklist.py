from fastapi import APIRouter
from pydantic import BaseModel
from models.student import StudentProfile, profile_to_context
from prompts.master import build_system_prompt
from prompts.checklist import CHECKLIST_SYSTEM
from core.arize_logger import logged_complete

router = APIRouter()


class ChecklistRequest(BaseModel):
    profile: StudentProfile


@router.post("/checklist")
def get_checklist(request: ChecklistRequest):
    profile_context = profile_to_context(request.profile)
    system = build_system_prompt(profile_context, CHECKLIST_SYSTEM)
    messages = [
        {"role": "user", "content": "Generate my First 30 Days Checklist based on my profile."}
    ]

    content = logged_complete(
        system=system,
        messages=messages,
        max_tokens=800,
        trace_name="checklist",
    )

    return {"checklist": content, "profile": request.profile.model_dump()}
