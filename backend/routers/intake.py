from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.intake_service import start_session, continue_session

router = APIRouter()


class ContinueRequest(BaseModel):
    session_id: str
    answer: str


@router.post("/start")
def start():
    session_id, question = start_session()
    return {
        "session_id": session_id,
        "message": question,
        "is_complete": False,
        "questions_asked": 1,
    }


@router.post("/continue")
def continue_intake(request: ContinueRequest):
    try:
        return continue_session(request.session_id, request.answer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
