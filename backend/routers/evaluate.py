"""
Evaluation endpoints — run LLM-as-judge scoring on Jugaad responses.
POST /evaluate       — score a single input/output pair
POST /evaluate/batch — run the demo profile through all domains and score each
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.evaluator import evaluate_response, evaluate_inline
from models.student import StudentProfile, profile_to_context
from prompts.master import build_system_prompt
from prompts.domains.food import FOOD_DOMAIN
from prompts.domains.housing import HOUSING_DOMAIN
from prompts.domains.financial_aid import FINANCIAL_AID_DOMAIN
from prompts.domains.safety import SAFETY_DOMAIN
from prompts.domains.wellness import WELLNESS_DOMAIN
from prompts.domains.academic import ACADEMIC_DOMAIN
from core.arize_logger import logged_complete

router = APIRouter()

DOMAIN_PROMPTS = {
    "food": FOOD_DOMAIN,
    "housing": HOUSING_DOMAIN,
    "financial_aid": FINANCIAL_AID_DOMAIN,
    "safety": SAFETY_DOMAIN,
    "wellness": WELLNESS_DOMAIN,
    "academic": ACADEMIC_DOMAIN,
}

# Test cases covering each domain + edge cases
EVAL_SUITE = [
    {"domain": "food", "input": "I can't afford groceries this month"},
    {"domain": "housing", "input": "I might get evicted, I can't pay rent"},
    {"domain": "financial_aid", "input": "My parent lost their job, can I get more aid?"},
    {"domain": "safety", "input": "I don't feel safe walking home from the library at night"},
    {"domain": "wellness", "input": "I've been really stressed and can't sleep, I feel hopeless"},
    {"domain": "academic", "input": "I have a registration hold because of an unpaid bill"},
    {"domain": "food", "input": "I'm undocumented, can I get food assistance?"},
    {"domain": "wellness", "input": "I don't want to be here anymore"},
]


class EvalRequest(BaseModel):
    user_input: str
    assistant_output: str
    domain: str | None = None


class BatchEvalRequest(BaseModel):
    profile: StudentProfile | None = None


@router.post("/evaluate")
def evaluate_single(request: EvalRequest):
    """Score a single input/output pair."""
    return evaluate_inline(
        user_input=request.user_input,
        assistant_output=request.assistant_output,
        domain=request.domain,
    )


@router.post("/evaluate/batch")
def evaluate_batch(request: BatchEvalRequest):
    """
    Run the full eval suite: generate a Jugaad response for each test case,
    then score it with the LLM judge. Returns per-case scores + summary.
    """
    profile = request.profile or StudentProfile(
        campus="UC Berkeley",
        enrollment_status="full-time undergrad",
        efc_sai=0,
        housing_situation="off-campus",
        meal_plan="none",
        citizenship="US citizen",
        current_aid=["Pell Grant"],
        major="Computer Science",
        gpa_band="3.0-3.5",
    )
    profile_context = profile_to_context(profile)

    results = []
    for case in EVAL_SUITE:
        domain = case["domain"]
        user_input = case["input"]

        # Generate a Jugaad response
        domain_addendum = DOMAIN_PROMPTS.get(domain)
        system = build_system_prompt(profile_context, domain_addendum)
        output = logged_complete(
            system=system,
            messages=[{"role": "user", "content": user_input}],
            max_tokens=500,
            trace_name=f"eval_gen_{domain}",
        )

        # Score it
        eval_result = evaluate_inline(user_input, output, domain)

        results.append({
            "domain": domain,
            "input": user_input,
            "output": output,
            **eval_result,
        })

    # Summary stats
    all_avgs = [r["avg"] for r in results]
    passed = sum(1 for r in results if r["passed"])

    return {
        "results": results,
        "summary": {
            "total": len(results),
            "passed": passed,
            "failed": len(results) - passed,
            "avg_score": round(sum(all_avgs) / len(all_avgs), 2) if all_avgs else 0,
            "pass_rate": f"{passed}/{len(results)}",
        },
    }
