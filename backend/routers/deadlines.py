from fastapi import APIRouter
from pydantic import BaseModel
from models.student import StudentProfile
from services.deadline_service import get_deadline_alerts, send_email_alert

router = APIRouter()


class DeadlineRequest(BaseModel):
    profile: StudentProfile
    email: str | None = None  # If provided, send email alert for 48h/7d urgency items


@router.post("/deadlines")
def deadlines(request: DeadlineRequest):
    alerts = get_deadline_alerts(request.profile)
    email_sent = False

    if request.email:
        email_sent = send_email_alert(request.email, request.profile, alerts)

    # Group by urgency for easy frontend consumption
    grouped = {"48h": [], "7days": [], "30days": [], "rolling": [], "future": []}
    for a in alerts:
        grouped.setdefault(a["urgency"], []).append(a)

    return {
        "alerts": alerts,
        "grouped": grouped,
        "total": len(alerts),
        "urgent_count": len(grouped["48h"]) + len(grouped["7days"]),
        "email_sent": email_sent,
    }
