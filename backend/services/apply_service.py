from models.student import StudentProfile, profile_to_context
from models.resources import HackItem, ApplyNowResponse
from data.loader import get_hack_by_id
from prompts.master import build_system_prompt
from prompts import apply_now as apply_prompts
from core.arize_logger import logged_complete

# Map hack IDs to their "subcategory" for dispatch
HACK_SUBCATEGORY_MAP = {
    "emergency-grant": "emergency_grant",
    "fafsa-housing-appeal": "financial_appeal",
    "special-circumstances-appeal": "financial_appeal",
    "calfresh-student-exemption": "government_benefit",
    "calfresh-state-supplement": "government_benefit",
    "dream-act-financial-aid": "scholarship",
    "pell-grant-appeal": "federal_grant",
    "fee-payment-plan": "fee_deferral",
    "fee-deferral-registration-hold": "fee_deferral",
    "mlk-food-pantry": "food_pantry",
    "grab-n-go-meals": "food_pantry",
    "emergency-meal-swipes": "meal_assistance",
    "market-match": "food_pantry",
    "free-food-calendar": "community_resource",
    "berkeley-student-food-collective": "food_pantry",
    "basic-needs-emergency-housing": "emergency_housing",
    "rapid-rehousing": "rapid_rehousing",
    "bsc-co-ops": "cooperative",
    "lets-talk-drop-in": "counseling",
    "ship-therapist-bypass": "counseling",
    "caps-urgent-appointment": "counseling",
    "safewalk": "safety",
    "saferide": "safety",
}

CONTENT_TYPE_MAP = {
    "emergency_grant": "personal_statement",
    "financial_appeal": "appeal_letter",
    "government_benefit": "eligibility_summary",
    "federal_grant": "eligibility_summary",
    "scholarship": "scholarship_paragraph",
    "fee_deferral": "action_steps",
    "food_pantry": "action_steps",
    "meal_assistance": "action_steps",
    "community_resource": "action_steps",
    "emergency_housing": "action_steps",
    "rapid_rehousing": "action_steps",
    "cooperative": "action_steps",
    "counseling": "action_steps",
    "safety": "action_steps",
}


def generate_apply_now(profile: StudentProfile, hack_id: str) -> ApplyNowResponse:
    hack_data = get_hack_by_id(hack_id)
    if not hack_data:
        raise ValueError(f"Hack not found: {hack_id}")

    hack = HackItem(**hack_data)
    profile_context = profile_to_context(profile)
    subcategory = HACK_SUBCATEGORY_MAP.get(hack_id, "community_resource")
    content_type = CONTENT_TYPE_MAP.get(subcategory, "action_steps")

    prompt_fn = apply_prompts.APPLY_NOW_DISPATCH.get(subcategory)

    if prompt_fn is None:
        prompt_fn = apply_prompts.action_steps

    # Build the user prompt
    if subcategory == "emergency_grant":
        user_prompt = prompt_fn(profile_context)
        max_tokens = 350  # Keep tight for <3s response
    elif subcategory == "scholarship":
        user_prompt = prompt_fn(profile_context, hack.name)
        max_tokens = 300
    elif subcategory in ("food_pantry", "meal_assistance", "community_resource",
                         "emergency_housing", "rapid_rehousing", "cooperative",
                         "counseling", "safety", "fee_deferral"):
        user_prompt = prompt_fn(profile_context, hack.name, hack.description, hack.how_to_access)
        max_tokens = 400
    else:
        user_prompt = prompt_fn(profile_context)
        max_tokens = 400

    system = build_system_prompt(profile_context)
    messages = [{"role": "user", "content": user_prompt}]

    content = logged_complete(
        system=system,
        messages=messages,
        max_tokens=max_tokens,
        trace_name=f"apply_now_{subcategory}",
    )

    return ApplyNowResponse(
        content=content,
        content_type=content_type,
        hack=hack,
    )
