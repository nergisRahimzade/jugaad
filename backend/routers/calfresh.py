from fastapi import APIRouter
from pydantic import BaseModel
from models.student import StudentProfile
from services.calfresh_service import check_calfresh

router = APIRouter()


class CalFreshRequest(BaseModel):
    profile: StudentProfile | None = None
    messages: list[dict] = []
    message: str = "Do I qualify for CalFresh?"


@router.post("/calfresh-check")
def calfresh_check(request: CalFreshRequest):
    return check_calfresh(request.profile, request.messages, request.message)
