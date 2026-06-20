from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.student import StudentProfile
from models.resources import ApplyNowResponse
from services.apply_service import generate_apply_now

router = APIRouter()


class ApplyNowRequest(BaseModel):
    profile: StudentProfile
    hack_id: str


@router.post("/apply-now", response_model=ApplyNowResponse)
def apply_now(request: ApplyNowRequest):
    try:
        return generate_apply_now(request.profile, request.hack_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
