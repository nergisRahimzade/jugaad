from pydantic import BaseModel


class StudentProfile(BaseModel):
    campus: str = "UC Berkeley"
    enrollment_status: str = "full-time undergrad"  # "full-time undergrad" | "part-time" | "grad"
    efc_sai: int = 0                                 # 0 = maximum need
    housing_situation: str = "off-campus"            # "on-campus" | "off-campus" | "unstably-housed"
    meal_plan: str = "none"                          # "active" | "expired" | "none"
    citizenship: str = "US citizen"                  # "US citizen" | "DACA" | "undocumented" | "permanent resident"
    current_aid: list[str] = []                      # ["Pell Grant", "Cal Grant B", ...]
    dependents: int = 0
    major: str = "Undecided"
    gpa_band: str = "3.0-3.5"                       # "below-2.0" | "2.0-3.0" | "3.0-3.5" | "3.5+"
    work_hours_per_week: int = 0


class IntakeSession(BaseModel):
    session_id: str
    messages: list[dict] = []
    profile: StudentProfile | None = None
    questions_asked: int = 0
    is_complete: bool = False


def profile_to_context(profile: StudentProfile) -> str:
    aid_str = ", ".join(profile.current_aid) if profile.current_aid else "none"
    return (
        f"Student at {profile.campus}. "
        f"Enrollment: {profile.enrollment_status}. "
        f"SAI/EFC: ${profile.efc_sai}. "
        f"Housing: {profile.housing_situation}. "
        f"Meal plan: {profile.meal_plan}. "
        f"Citizenship: {profile.citizenship}. "
        f"Current aid: {aid_str}. "
        f"Dependents: {profile.dependents}. "
        f"Major: {profile.major}. "
        f"GPA band: {profile.gpa_band}. "
        f"Work hours/week: {profile.work_hours_per_week}."
    )
