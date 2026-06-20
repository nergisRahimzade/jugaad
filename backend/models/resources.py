from typing import Literal
from pydantic import BaseModel


Domain = Literal["food", "housing", "financial_aid", "safety", "wellness", "academic"]


class HackItem(BaseModel):
    id: str
    name: str
    domain: Domain
    description: str
    how_to_access: str
    url: str | None = None
    phone: str | None = None
    dollar_value: str | None = None
    effort_level: str = "varies"
    citizenship_required: list[str] = []  # empty = all statuses accepted
    deadline: str | None = None
    tags: list[str] = []


class HackStack(BaseModel):
    domain: str
    narrative: str
    hacks: list[HackItem]
    stacking_tip: str
    total_value: str | None = None


class RecommendRequest(BaseModel):
    profile: "StudentProfile"  # noqa: F821
    problem_description: str


class ApplyNowRequest(BaseModel):
    profile: "StudentProfile"  # noqa: F821
    hack_id: str


class ApplyNowResponse(BaseModel):
    content: str
    content_type: str  # "personal_statement" | "appeal_letter" | "eligibility_summary" | "scholarship_paragraph" | "action_steps"
    hack: HackItem
