"""Frontend-facing endpoints for the live Browserbase finder agents.

The voice/chat UI hits these to:

* trigger a fresh crawl ("find me scholarships")
* show the Browserbase live-replay URL in the agent activity feed
* read what the finder pulled back, so the dashboard cards stay accurate
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.services.browserbase import (
    find_food_resources,
    find_housing_resources,
    find_scholarships,
    find_wellness_resources,
)

router = APIRouter()


_FINDERS = {
    "scholarship": find_scholarships,
    "food": find_food_resources,
    "housing": find_housing_resources,
    "wellness": find_wellness_resources,
}


class WebSearchRequest(BaseModel):
    domain: str
    student_profile: dict[str, Any] | None = None


@router.post("/web-search")
def web_search(payload: WebSearchRequest) -> dict[str, Any]:
    finder = _FINDERS.get(payload.domain)
    if finder is None:
        raise HTTPException(status_code=400, detail=f"No finder configured for domain '{payload.domain}'")
    return finder(payload.student_profile)


@router.get("/web-search/finders")
def list_finders() -> dict[str, list[str]]:
    return {"finders": list(_FINDERS.keys())}
