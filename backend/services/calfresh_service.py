from models.student import StudentProfile
from prompts.calfresh import (
    CALFRESH_SYSTEM,
    SHORT_CIRCUIT_ELIGIBLE,
    SHORT_CIRCUIT_DACA,
)
from core.arize_logger import logged_complete


def check_calfresh(profile: StudentProfile | None, messages: list[dict], message: str) -> dict:
    """
    CalFresh eligibility flow.
    Short-circuits for common cases to avoid unnecessary Claude calls.
    Returns: {message, eligibility_determined, likely_eligible, next_steps}
    """
    # Short-circuit 1: Pell Grant recipient with $0 SAI → almost certainly eligible
    if profile and profile.efc_sai == 0 and "Pell Grant" in profile.current_aid:
        if profile.citizenship in ("US citizen", "permanent resident"):
            return {
                "message": SHORT_CIRCUIT_ELIGIBLE,
                "eligibility_determined": True,
                "likely_eligible": True,
                "next_steps": [
                    "Go to benefitscal.com",
                    "Have your Cal 1 Card and Pell Grant award letter ready",
                    "Apply online — takes 20-30 minutes",
                    "EBT card arrives within 10-30 days",
                ],
            }

    # Short-circuit 2: DACA → redirect to CFAP
    if profile and profile.citizenship == "DACA":
        return {
            "message": SHORT_CIRCUIT_DACA,
            "eligibility_determined": True,
            "likely_eligible": False,
            "next_steps": [
                "Contact Alameda County DHCS: (510) 268-7401",
                "Ask for California Food Assistance Program (CFAP)",
                "Email basicneeds@berkeley.edu for emergency meal swipes in the meantime",
            ],
        }

    # Run conversational eligibility flow
    history = list(messages)
    history.append({"role": "user", "content": message})

    response = logged_complete(
        system=CALFRESH_SYSTEM,
        messages=history,
        max_tokens=600,
        trace_name="calfresh_eligibility",
    )

    # Try to determine if eligibility has been resolved
    lower = response.lower()
    eligibility_determined = (
        "you qualify" in lower
        or "you do not qualify" in lower
        or "you don't qualify" in lower
        or "likely qualify" in lower
        or "cfap" in lower
    )
    likely_eligible = "qualify" in lower and "not qualify" not in lower and "don't qualify" not in lower

    return {
        "message": response,
        "eligibility_determined": eligibility_determined,
        "likely_eligible": likely_eligible if eligibility_determined else None,
        "next_steps": None,
    }
