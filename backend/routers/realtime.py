"""Realtime peer-to-peer endpoints — food surplus + walking buddy + problem map.

These are the demo-critical moments from Demo Script 1 & 2: the walking buddy
match and the food surplus notification both render here.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.services.redis_realtime import (
    find_walking_buddies,
    join_walking_buddy,
    list_active_food_surplus,
    post_food_surplus,
    problem_map_snapshot,
    record_problem,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Food surplus
# ---------------------------------------------------------------------------


class FoodSurplusIn(BaseModel):
    item: str
    location: str
    servings: int = Field(ge=1, le=500)
    available_minutes: int = Field(ge=5, le=240)
    poster: str = "anonymous"
    notes: str = ""


@router.post("/food-surplus")
def post_surplus(payload: FoodSurplusIn) -> dict[str, Any]:
    posting = post_food_surplus(**payload.model_dump())
    if posting is None:
        raise HTTPException(status_code=503, detail="Realtime backend unavailable")
    return posting


@router.get("/food-surplus")
def list_surplus(limit: int = 20) -> dict[str, Any]:
    return {"postings": list_active_food_surplus(limit=limit)}


# ---------------------------------------------------------------------------
# Walking-buddy matching
# ---------------------------------------------------------------------------


class WalkingBuddyIn(BaseModel):
    user_id: str
    origin: str
    destination: str
    leaving_at: int  # unix timestamp seconds
    lat: float | None = None
    lon: float | None = None


@router.post("/walking-buddy/join")
def buddy_join(payload: WalkingBuddyIn) -> dict[str, Any]:
    request_id = join_walking_buddy(**payload.model_dump())
    if request_id is None:
        raise HTTPException(status_code=503, detail="Realtime backend unavailable")
    matches = find_walking_buddies(payload.destination, payload.leaving_at)
    return {"request_id": request_id, "matches": matches}


@router.get("/walking-buddy/match")
def buddy_match(destination: str, leaving_at: int, window_minutes: int = 15) -> dict[str, Any]:
    return {"matches": find_walking_buddies(destination, leaving_at, window_minutes)}


# ---------------------------------------------------------------------------
# Berkeley Problem Map
# ---------------------------------------------------------------------------


class ProblemReportIn(BaseModel):
    domain: str


@router.post("/problem-map/report")
def report_problem(payload: ProblemReportIn) -> dict[str, int]:
    count = record_problem(payload.domain)
    return {payload.domain: count}


@router.get("/problem-map")
def problem_map() -> dict[str, int]:
    return problem_map_snapshot()
