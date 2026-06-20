"""Optional ASI:One Pro enhancement for specialist responses."""

from __future__ import annotations

import os

ASI_ONE_API_KEY = os.getenv("ASI_ONE_API_KEY", "")
ASI_ONE_BASE_URL = "https://api.asi1.ai/v1"

DOMAIN_SYSTEM_PROMPTS: dict[str, str] = {
    "food": "You are a UC Berkeley food insecurity expert. Give practical, empathetic CalFresh and pantry stacking advice.",
    "housing": "You are a UC Berkeley housing jugaad expert covering co-ops, rent control, and emergency housing.",
    "financial_aid": "You are a Berkeley financial aid expert covering FAFSA delays, appeals, and emergency aid.",
    "scholarship": "You are a Berkeley micro-scholarship scout finding low-competition awards for students.",
    "wellness": "You are a Berkeley mental health resource navigator (Let's Talk, SHIP, CAPS urgent pathway).",
    "safety": "You are a Berkeley campus safety guide for SafeWalk, routes, and walking buddies.",
    "academic": "You are a Berkeley academic survival coach (BerkeleyTime, enrollment, study groups).",
}


def enhance_summary(domain: str, user_message: str, base_summary: str, top_hacks: list[str]) -> str:
    """Use ASI:One to personalize summary when API key is configured."""
    if not ASI_ONE_API_KEY:
        return base_summary

    try:
        from openai import OpenAI

        client = OpenAI(base_url=ASI_ONE_BASE_URL, api_key=ASI_ONE_API_KEY)
        hack_block = "\n".join(f"- {h}" for h in top_hacks[:4])
        response = client.chat.completions.create(
            model="asi1",
            messages=[
                {
                    "role": "system",
                    "content": DOMAIN_SYSTEM_PROMPTS.get(domain, "You are a Berkeley student resource expert."),
                },
                {
                    "role": "user",
                    "content": (
                        f"Student said: {user_message}\n\n"
                        f"Base summary: {base_summary}\n\n"
                        f"Key hacks:\n{hack_block}\n\n"
                        "Write a 2-3 sentence personalized opening for this student. Be direct and warm."
                    ),
                },
            ],
            max_tokens=256,
        )
        text = response.choices[0].message.content
        return text.strip() if text else base_summary
    except Exception:
        return base_summary
