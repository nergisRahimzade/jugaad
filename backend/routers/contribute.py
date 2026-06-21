"""Crowdsourced jugaad contribution endpoint (Problem 7, Hack 3).

Students submit hacks that worked for them; we ingest them into the same
RedisVL index so future queries surface community knowledge alongside the
seed corpus.
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.services.redis_store import ingest_hack, search_hacks_detailed

router = APIRouter()


_ALLOWED_DOMAINS = {"food", "housing", "wellness", "financial_aid", "scholarship", "safety", "academic"}


class ContributionIn(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    domain: str
    description: str = Field(..., min_length=10)
    how_to_access: str = Field(..., min_length=5)
    url: str | None = None
    phone: str | None = None
    dollar_value: str | None = None
    effort_level: str | None = None
    citizenship_required: list[str] = Field(default_factory=list)
    deadline: str | None = None
    tags: list[str] = Field(default_factory=list)
    contributor_handle: str | None = None


class ContributionOut(BaseModel):
    id: str
    accepted: bool
    indexed: bool


@router.post("/contribute", response_model=ContributionOut)
def contribute(payload: ContributionIn):
    if payload.domain not in _ALLOWED_DOMAINS:
        raise HTTPException(status_code=400, detail=f"Unknown domain: {payload.domain}")

    hack_id = f"crowd-{payload.domain}-{uuid4().hex[:10]}"
    record: dict[str, Any] = payload.model_dump()
    record["id"] = hack_id
    record["source"] = "crowdsourced"

    indexed = ingest_hack(record)
    return ContributionOut(id=hack_id, accepted=True, indexed=indexed)


@router.get("/contributions/preview")
def preview_contributions(domain: str | None = None, limit: int = 5) -> dict[str, Any]:
    """Spot-check what the index returns — used by the contribute UI's "see live"."""
    hits = search_hacks_detailed(
        query="recent crowdsourced jugaad",
        domain=domain,
        limit=limit,
    )
    return {"results": hits}
