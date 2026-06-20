from fastapi import APIRouter
from pydantic import BaseModel
from models.student import StudentProfile
from models.resources import HackStack
from services.recommend_service import get_hack_stack

router = APIRouter()


class RecommendRequest(BaseModel):
    profile: StudentProfile
    problem_description: str


@router.post("/recommend", response_model=HackStack)
def recommend(request: RecommendRequest):
    return get_hack_stack(request.profile, request.problem_description)


@router.post("/hack-stack", response_model=HackStack)
def hack_stack(request: RecommendRequest):
    return get_hack_stack(request.profile, request.problem_description)
