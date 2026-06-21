"""
Pre-built demo profiles for judging. These never fail.
Call GET /demo/maria to get a ready-to-use profile for the main demo flow.
"""
from fastapi import APIRouter
from models.student import StudentProfile

router = APIRouter()

# Maria — the primary demo persona from the README
MARIA = StudentProfile(
    campus="UC Berkeley",
    enrollment_status="full-time undergrad",
    efc_sai=0,
    housing_situation="off-campus",
    meal_plan="none",
    citizenship="US citizen",
    current_aid=["Pell Grant"],
    dependents=0,
    major="Computer Science",
    gpa_band="3.0-3.5",
    work_hours_per_week=0,
)

# Undocumented student — demonstrates Dream Act and CFAP routing
ALEX = StudentProfile(
    campus="UC Berkeley",
    enrollment_status="full-time undergrad",
    efc_sai=0,
    housing_situation="off-campus",
    meal_plan="none",
    citizenship="undocumented",
    current_aid=[],
    dependents=0,
    major="Sociology",
    gpa_band="3.5+",
    work_hours_per_week=0,
)

# Grad student — demonstrates loan elimination awareness + wellness
PRIYA = StudentProfile(
    campus="UC Berkeley",
    enrollment_status="grad",
    efc_sai=2000,
    housing_situation="off-campus",
    meal_plan="none",
    citizenship="permanent resident",
    current_aid=[],
    dependents=0,
    major="Electrical Engineering",
    gpa_band="3.5+",
    work_hours_per_week=20,
)


@router.get("/maria")
def demo_maria():
    return {"profile": MARIA.model_dump(), "persona": "Maria — UC Berkeley junior, CS, SAI $0"}


@router.get("/alex")
def demo_alex():
    return {"profile": ALEX.model_dump(), "persona": "Alex — undocumented student, Sociology, SAI $0"}


@router.get("/priya")
def demo_priya():
    return {"profile": PRIYA.model_dump(), "persona": "Priya — grad student, EECS, permanent resident"}


@router.get("/seeds")
def demo_seeds():
    """List seeded judge demo queries (matched automatically in /chat/coordinator)."""
    from services.demo_seed_service import list_demo_seeds

    return {"seeds": list_demo_seeds()}
