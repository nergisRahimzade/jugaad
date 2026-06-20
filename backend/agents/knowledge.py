"""Berkeley-specific hack knowledge per domain (seed data until Redis is wired)."""

from .config import ACADEMIC, FINANCIAL_AID, FOOD, HOUSING, SAFETY

DOMAIN_KNOWLEDGE: dict[str, dict] = {
    FOOD.domain: {
        "summary": "Stack CalFresh, pantry access, and free food sources for near-zero food budget.",
        "recommendations": [
            "Apply for CalFresh — up to $292/month for groceries with student exemption (half-time enrollment + income under threshold).",
            "Visit the Basic Needs Food Pantry in MLK Student Union lower level — shortest lines Friday afternoons.",
            "Use Grab N Go recovered meals (free, daily) and campus events with free catering.",
            "Shop Berkeley Student Food Collective (sliding-scale) and use Market Match at Saturday farmers market (doubles first $10 CalFresh).",
        ],
        "resources": [
            {
                "name": "CalFresh FAQ",
                "url": "https://basicneeds.berkeley.edu/faq/calfresh",
                "value": "$292/month",
                "effort": "30 min online application",
            },
            {
                "name": "Basic Needs Food Pantry",
                "url": "https://basicneeds.berkeley.edu/pantry",
                "value": "Weekly groceries",
                "effort": "Walk-in, bring Cal ID",
            },
        ],
        "urgency": "high",
    },
    HOUSING.domain: {
        "summary": "Emergency housing paths and long-term affordable options for Berkeley students.",
        "recommendations": [
            "Apply to BSC co-ops — 30–50% cheaper than dorms with rolling admissions.",
            "Contact Basic Needs for emergency bridge housing if you are unstably housed tonight.",
            "Know your rent control rights — pre-1980 apartments have annual rent caps in Berkeley.",
            "Use summer sublet conversion strategy to reduce year-round housing costs.",
        ],
        "resources": [
            {
                "name": "BSC Co-ops",
                "url": "https://bsc.coop",
                "value": "30–50% cheaper housing",
                "effort": "Application + interview",
            },
            {
                "name": "Basic Needs Emergency Housing",
                "url": "https://basicneeds.berkeley.edu",
                "value": "Short-term bridge",
                "effort": "Same-day intake",
            },
        ],
        "urgency": "high",
    },
    FINANCIAL_AID.domain: {
        "summary": "Emergency aid, appeals, and micro-scholarships when FAFSA is delayed or insufficient.",
        "recommendations": [
            "File a Special Circumstances Appeal — recalculates aid based on current income, can add thousands.",
            "Apply for emergency short-term loan bridge while FAFSA processing is paused.",
            "Scan micro-scholarships ($500–$2,000 awards with few applicants) matched to your profile.",
            "Set up a fee payment plan to spread tuition across the semester.",
        ],
        "resources": [
            {
                "name": "Financial Aid Office",
                "url": "https://financialaid.berkeley.edu",
                "value": "Emergency grants + appeals",
                "effort": "Online form + docs",
            },
            {
                "name": "Federal Aid Updates",
                "url": "https://financialaid.berkeley.edu/apply-now/apply-for-aid/federal-updates/",
                "value": "Current policy guidance",
                "effort": "5 min read",
            },
        ],
        "urgency": "high",
    },
    SAFETY.domain: {
        "summary": "Safe routes, walking buddies, and campus safety resources for late-night travel.",
        "recommendations": [
            "Request SafeWalk or BearWalk for an escort across campus after dark.",
            "Match with walking buddies heading the same direction via Jugaad's buddy queue.",
            "Prefer well-lit routes (e.g., Oxford St over Telegraph after 10pm) based on incident patterns.",
            "Save UCPD non-emergency line and use blue light phones if you feel unsafe.",
        ],
        "resources": [
            {
                "name": "Campus Safety (UCPD)",
                "url": "https://ucpd.berkeley.edu",
                "value": "SafeWalk + emergency response",
                "effort": "Call or app request",
            },
        ],
        "urgency": "medium",
    },
    ACADEMIC.domain: {
        "summary": "Enrollment strategies, study support, and academic survival hacks.",
        "recommendations": [
            "Use BerkeleyTime to find grade distributions and lighter-workload sections before enrolling.",
            "Join domain-specific study groups early — CS and EECS sections are oversubscribed.",
            "Check for registration holds tied to outstanding balance (links to financial aid agent).",
            "Explore P/NP or late drop strategies with college advisor if you're failing a core class.",
        ],
        "resources": [
            {
                "name": "BerkeleyTime",
                "url": "https://berkeleytime.com",
                "value": "Grade + workload data",
                "effort": "Free, instant",
            },
            {
                "name": "Class Schedule",
                "url": "https://classes.berkeley.edu",
                "value": "Enrollment + holds",
                "effort": "CalNet login",
            },
        ],
        "urgency": "medium",
    },
}


def get_domain_response(domain: str, user_message: str) -> dict:
    """Build a specialist response payload for a domain."""
    base = DOMAIN_KNOWLEDGE[domain]
    return {
        "summary": base["summary"],
        "recommendations": base["recommendations"],
        "resources": base["resources"],
        "urgency": base["urgency"],
        "context_note": f"Tailored for: {user_message[:120]}",
    }
