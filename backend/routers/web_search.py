"""Frontend-facing endpoints for the live Browserbase finder agents.

Three domains only: food, housing, financial_aid (which absorbs scholarship
queries). The voice/chat UI POSTs ``/web-search`` with a domain and an optional
profile; the matching finder runs and returns structured resources plus the
visited URLs for the agent activity feed.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.services.browserbase import (
    find_financial_aid_resources,
    find_food_resources,
    find_housing_resources,
)

router = APIRouter()


_FINDERS = {
    "food": find_food_resources,
    "housing": find_housing_resources,
    "financial_aid": find_financial_aid_resources,
    "scholarship": find_financial_aid_resources,  # merged into financial_aid
}


class WebSearchRequest(BaseModel):
    domain: str
    student_profile: dict[str, Any] | None = None


@router.post("/web-search")
def web_search(payload: WebSearchRequest) -> dict[str, Any]:
    finder = _FINDERS.get(payload.domain)
    if finder is None:
        raise HTTPException(
            status_code=400,
            detail=f"No finder configured for domain '{payload.domain}'. "
            "Supported: food, housing, financial_aid.",
        )
    return finder(payload.student_profile)


@router.get("/web-search/finders")
def list_finders() -> dict[str, list[str]]:
    return {"finders": sorted(set(_FINDERS.keys()))}
