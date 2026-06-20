import json
from models.student import StudentProfile, profile_to_context
from models.resources import HackItem, HackStack
from data.loader import get_all_hacks, get_hacks_by_domain
from prompts.master import build_system_prompt
from prompts.domains.food import FOOD_DOMAIN
from prompts.domains.housing import HOUSING_DOMAIN
from prompts.domains.financial_aid import FINANCIAL_AID_DOMAIN
from prompts.domains.safety import SAFETY_DOMAIN
from prompts.domains.wellness import WELLNESS_DOMAIN
from prompts.domains.academic import ACADEMIC_DOMAIN
from core.arize_logger import logged_complete

DOMAIN_ADDENDA = {
    "food": FOOD_DOMAIN,
    "housing": HOUSING_DOMAIN,
    "financial_aid": FINANCIAL_AID_DOMAIN,
    "safety": SAFETY_DOMAIN,
    "wellness": WELLNESS_DOMAIN,
    "academic": ACADEMIC_DOMAIN,
}

DOMAIN_ALIASES = {
    "mental_health": "wellness",
    "mental health": "wellness",
    "money": "financial_aid",
    "aid": "financial_aid",
    "scholarship": "financial_aid",
    "food insecurity": "food",
    "groceries": "food",
    "hungry": "food",
    "homeless": "housing",
    "rent": "housing",
}


def classify_domain(message: str) -> str:
    """
    Fast single-word Claude call to classify the user's problem into a domain.
    Falls back to "general" on error.
    """
    prompt = (
        "Classify this student message into exactly one domain label. "
        "Respond with ONLY the label — no explanation, no punctuation.\n\n"
        "Labels: food | housing | financial_aid | safety | wellness | academic | general\n\n"
        f"Message: \"{message}\""
    )
    try:
        result = logged_complete(
            system="You are a classifier. Output only the domain label.",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            trace_name="domain_classify",
        )
        label = result.strip().lower().split()[0]
        label = DOMAIN_ALIASES.get(label, label)
        if label not in DOMAIN_ADDENDA and label != "general":
            label = "general"
        return label
    except Exception:
        return "general"


def filter_hacks(hacks: list[dict], profile: StudentProfile) -> list[dict]:
    """
    Phase 1: Hard filter by citizenship. Python only — no Claude.
    Returns hacks the student could qualify for.
    """
    filtered = []
    for h in hacks:
        citizenship_req = h.get("citizenship_required", [])
        if citizenship_req and profile.citizenship not in citizenship_req:
            continue
        filtered.append(h)
    return filtered


def assemble_hack_stack(
    profile: StudentProfile,
    domain: str,
    candidate_hacks: list[dict],
) -> HackStack:
    """
    Phase 2: Claude selects 3-6 hacks that compound well, writes the narrative and stacking tip.
    """
    profile_context = profile_to_context(profile)
    domain_addendum = DOMAIN_ADDENDA.get(domain)
    system = build_system_prompt(profile_context, domain_addendum)

    hacks_json = json.dumps(
        [{k: v for k, v in h.items() if k != "tags"} for h in candidate_hacks[:15]],
        indent=2,
    )

    user_msg = f"""A student needs help with: {domain.replace("_", " ")}

Here are the hacks they qualify for:
{hacks_json}

Your task:
1. Select 3-6 hacks that work best together for this student's specific situation
2. Write a 2-3 sentence narrative explaining the overall strategy (not just listing resources)
3. Write a "stacking tip" — one sentence on how to use these resources together for maximum effect
4. Estimate the total value (e.g., "Up to $292/month in food + free weekly groceries + free daily meals")

Respond in this exact JSON format:
{{
  "narrative": "...",
  "selected_hack_ids": ["id1", "id2", "id3"],
  "stacking_tip": "...",
  "total_value": "..."
}}

Return ONLY the JSON. No explanation."""

    response = logged_complete(
        system=system,
        messages=[{"role": "user", "content": user_msg}],
        max_tokens=600,
        trace_name=f"hack_stack_{domain}",
    )

    # Parse Claude's selection
    try:
        # Strip markdown code blocks if present
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        parsed = json.loads(clean)
    except Exception:
        # Fallback: use top 3 candidate hacks as-is
        parsed = {
            "narrative": f"Here are the most relevant resources for your {domain.replace('_', ' ')} situation.",
            "selected_hack_ids": [h["id"] for h in candidate_hacks[:3]],
            "stacking_tip": "Start with the highest-value resource first, then layer the others.",
            "total_value": None,
        }

    hacks_by_id = {h["id"]: h for h in candidate_hacks}
    selected = [
        HackItem(**hacks_by_id[hid])
        for hid in parsed.get("selected_hack_ids", [])
        if hid in hacks_by_id
    ]

    # Fallback if parsing returned nothing
    if not selected:
        selected = [HackItem(**h) for h in candidate_hacks[:3]]

    return HackStack(
        domain=domain,
        narrative=parsed.get("narrative", ""),
        hacks=selected,
        stacking_tip=parsed.get("stacking_tip", ""),
        total_value=parsed.get("total_value"),
    )


def get_hack_stack(profile: StudentProfile, problem_description: str) -> HackStack:
    domain = classify_domain(problem_description)

    if domain == "general":
        # Surface multi-domain top hacks
        all_hacks = get_all_hacks()
        candidates = filter_hacks(all_hacks, profile)
    else:
        domain_hacks = get_hacks_by_domain(domain)
        candidates = filter_hacks(domain_hacks, profile)
        if not candidates:
            candidates = filter_hacks(get_all_hacks(), profile)

    return assemble_hack_stack(profile, domain if domain != "general" else "food", candidates)
