"""
Apply Now generation prompts — one per resource type.
All output is first-person, using the student's actual profile data.
Target: <3 seconds for personal statements (max_tokens=350).
"""


def emergency_grant_statement(profile_context: str) -> str:
    return f"""Generate a 200-word personal statement for a UC Berkeley emergency grant application.

Student profile: {profile_context}

RULES:
- Write in first person ("I am a...")
- Be specific to THIS student's situation — reference their actual housing status, meal plan status, and financial aid situation
- Describe the specific financial hardship they are experiencing
- Explain how the emergency grant will provide immediate relief
- Include one sentence about their academic commitment and major
- DO NOT use generic phrases like "I am a hard-working student" or "I am passionate about my education"
- Make it sound human, not like a template
- End with a specific request: "I am requesting emergency funding of $[amount] to cover [specific expense]"
- Keep it under 210 words
- Plain prose, no headers, no bullet points

Output ONLY the personal statement text. Nothing else."""


def fafsa_housing_appeal(profile_context: str) -> str:
    return f"""Generate a formal FAFSA cost-of-attendance appeal letter for a UC Berkeley student.

Student profile: {profile_context}

RULES:
- Address to: "Dear UC Berkeley Financial Aid Office,"
- Explain that the student lives off-campus and their actual housing costs exceed the standard Cost-of-Attendance estimate
- Request a Professional Judgment review to adjust the housing component of their COA
- Include specific language: "I am requesting a Cost-of-Attendance adjustment under 34 CFR 668.187"
- Mention that documentation of actual housing costs is available upon request
- Professional but not robotic tone
- Sign off: "Respectfully, [A UC Berkeley Student]"
- Keep under 250 words

Output ONLY the letter text. Nothing else."""


def special_circumstances_appeal(profile_context: str) -> str:
    return f"""Generate a Special Circumstances appeal letter for a UC Berkeley student whose financial situation has changed.

Student profile: {profile_context}

RULES:
- Address to: "Dear UC Berkeley Financial Aid Office,"
- Explain that the student's/family's financial situation has changed significantly since the prior tax year used in their FAFSA
- Request a Professional Judgment review to recalculate Expected Family Contribution (EFC/SAI) based on current financial circumstances
- Be specific about the type of change based on the student's profile (income, housing costs, unexpected expenses)
- Reference the relevant federal regulation: "34 CFR 668.187 (professional judgment)"
- Request a meeting or phone call to discuss documentation
- Professional, clear, specific
- Sign off: "Respectfully, [A UC Berkeley Student]"
- Under 250 words

Output ONLY the letter text. Nothing else."""


def calfresh_eligibility_summary(profile_context: str) -> str:
    return f"""Generate a CalFresh application preparation summary for a UC Berkeley student.

Student profile: {profile_context}

Format as a structured checklist with these sections:

## Your Eligibility
[One paragraph explaining why this student likely qualifies — specifically which student exemption applies]

## Documents to Gather
[Bulleted list of documents they need]

## Application Steps
[Numbered list of exactly what to do, starting with "Go to benefitscal.com"]

## What to Expect
[2-3 sentences on timeline and EBT card delivery]

## Estimated Benefit
[Estimate their monthly benefit based on household size]

Be specific, actionable, and accurate. Mention that benefits average $292/month for a single-person household.

Output ONLY the summary. Nothing else."""


def scholarship_paragraph(profile_context: str, scholarship_name: str) -> str:
    return f"""Write a 150-word application paragraph for the {scholarship_name} scholarship.

Student profile: {profile_context}

RULES:
- Write in first person
- Confident, not boastful
- Reference the student's specific major and how it connects to the scholarship's purpose
- Mention financial need naturally (don't dwell on it — one sentence)
- End with one sentence about future goals connected to their major
- No generic phrases
- Exactly 140-160 words

Output ONLY the paragraph. Nothing else."""


def action_steps(profile_context: str, hack_name: str, hack_description: str, how_to_access: str) -> str:
    return f"""Generate a personalized step-by-step action plan for a UC Berkeley student to access the following resource.

Resource: {hack_name}
Description: {hack_description}
How to access: {how_to_access}

Student profile: {profile_context}

Format as:
## Your Next Steps for {hack_name}

[3-5 numbered steps, each specific and actionable]

[One sentence on what to expect after completing these steps]

Personalize for this student's specific situation. Reference their campus, housing status, or other relevant profile details.

Output ONLY the action plan. Nothing else."""


APPLY_NOW_DISPATCH = {
    "emergency_grant": emergency_grant_statement,
    "government_benefit": calfresh_eligibility_summary,
    "scholarship": scholarship_paragraph,
    "financial_appeal": fafsa_housing_appeal,
    "federal_grant": calfresh_eligibility_summary,
    "fee_deferral": action_steps,
    "food_pantry": action_steps,
    "community_resource": action_steps,
    "meal_assistance": action_steps,
    "emergency_housing": action_steps,
    "rapid_rehousing": action_steps,
    "cooperative": action_steps,
    "counseling": action_steps,
    "employment": action_steps,
}
