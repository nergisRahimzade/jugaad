"""
Deadline Alert Engine.
Parses deadlines from matched hacks, calculates urgency tiers,
and optionally sends email alerts via Resend.
"""
from datetime import datetime, date, timedelta
import json
from models.student import StudentProfile
from models.resources import HackItem
from data.loader import get_all_hacks
from services.recommend_service import filter_hacks

URGENCY_48H = "48h"
URGENCY_7D = "7days"
URGENCY_30D = "30days"
URGENCY_FUTURE = "future"
URGENCY_ROLLING = "rolling"


def _days_until(deadline_str: str) -> int | None:
    """Return days until deadline, or None if unparseable/rolling."""
    if not deadline_str or deadline_str.lower() in ("rolling", "ongoing", "daily", "weekly"):
        return None
    # Handle "weekly (Saturdays)" etc
    if deadline_str.lower().startswith("weekly"):
        return None
    try:
        # Try ISO date format first
        d = date.fromisoformat(deadline_str)
        return (d - date.today()).days
    except ValueError:
        pass
    # Try end-of-year hint
    if "annual" in deadline_str.lower():
        end_of_year = date(date.today().year, 12, 31)
        return (end_of_year - date.today()).days
    return None


def _urgency_tier(days: int | None, is_rolling: bool) -> str:
    if is_rolling:
        return URGENCY_ROLLING
    if days is None:
        return URGENCY_FUTURE
    if days <= 2:
        return URGENCY_48H
    if days <= 7:
        return URGENCY_7D
    if days <= 30:
        return URGENCY_30D
    return URGENCY_FUTURE


def get_deadline_alerts(profile: StudentProfile) -> list[dict]:
    """
    Return all hacks matched to this profile that have deadlines,
    sorted by urgency (most urgent first).
    """
    all_hacks = get_all_hacks()
    matched = filter_hacks(all_hacks, profile)

    alerts = []
    for h in matched:
        deadline_str = h.get("deadline")
        if not deadline_str:
            continue

        is_rolling = deadline_str.lower() in ("rolling", "ongoing", "daily", "weekly")
        days = _days_until(deadline_str)
        tier = _urgency_tier(days, is_rolling)

        alerts.append({
            "hack_id": h["id"],
            "hack_name": h["name"],
            "domain": h["domain"],
            "deadline": deadline_str,
            "days_until": days,
            "urgency": tier,
            "dollar_value": h.get("dollar_value"),
            "url": h.get("url"),
            "effort_level": h.get("effort_level"),
        })

    # Sort: 48h → 7d → 30d → rolling → future
    ORDER = {URGENCY_48H: 0, URGENCY_7D: 1, URGENCY_30D: 2, URGENCY_ROLLING: 3, URGENCY_FUTURE: 4}
    alerts.sort(key=lambda a: (ORDER.get(a["urgency"], 5), a["days_until"] or 9999))
    return alerts


def send_email_alert(to_email: str, profile: StudentProfile, alerts: list[dict]) -> bool:
    """
    Send a deadline alert email via Resend.
    Returns True if sent, False if Resend key not configured.
    """
    from core.config import settings
    resend_key = getattr(settings, "resend_api_key", "")
    if not resend_key:
        return False

    try:
        import httpx
        urgent = [a for a in alerts if a["urgency"] in (URGENCY_48H, URGENCY_7D)]
        if not urgent:
            return False

        lines = []
        for a in urgent:
            days_label = "TODAY" if (a["days_until"] or 99) <= 2 else f"{a['days_until']} days"
            lines.append(f"• [{days_label}] {a['hack_name']} — {a.get('dollar_value', '')}")
            if a.get("url"):
                lines.append(f"  Apply: {a['url']}")

        body = "\n".join([
            f"Hi {profile.campus} student,",
            "",
            "You have upcoming deadlines for resources Jugaad matched to your profile:",
            "",
            *lines,
            "",
            "Don't miss out — each of these was matched specifically to your situation.",
            "",
            "— Jugaad",
        ])

        httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
            json={
                "from": "Jugaad <alerts@jugaad.app>",
                "to": [to_email],
                "subject": f"⚠️ {len(urgent)} upcoming deadline(s) — act now",
                "text": body,
            },
            timeout=10,
        )
        return True
    except Exception:
        return False
