"""Keyword-based routing from user message to specialist domains."""

from .config import (
    ACADEMIC,
    FINANCIAL_AID,
    FOOD,
    HOUSING,
    SAFETY,
    SCHOLARSHIP,
    WELLNESS,
)

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    FOOD.domain: [
        "food",
        "hungry",
        "groceries",
        "calfresh",
        "pantry",
        "meal",
        "eat",
        "snack",
        "starving",
        "grocer",
        "groceries",
    ],
    HOUSING.domain: [
        "housing",
        "rent",
        "homeless",
        "dorm",
        "lease",
        "evict",
        "co-op",
        "coop",
        "shelter",
        "landlord",
        "apartment",
    ],
    FINANCIAL_AID.domain: [
        "financial",
        "fafsa",
        "aid",
        "grant",
        "loan",
        "tuition",
        "fee",
        "money",
        "afford",
        "pay",
        "debt",
        "pell",
        "broke",
    ],
    SCHOLARSHIP.domain: [
        "scholarship",
        "scholarships",
        "award",
        "fellowship",
        "micro-scholarship",
    ],
    WELLNESS.domain: [
        "mental",
        "health",
        "stress",
        "anxiety",
        "depression",
        "therapy",
        "counseling",
        "caps",
        "tang",
        "lets talk",
        "ship",
        "overwhelmed",
        "burnout",
    ],
    SAFETY.domain: [
        "safe",
        "safety",
        "walk",
        "walking",
        "night",
        "scared",
        "buddy",
        "safewalk",
        "route",
        "incident",
        "telegraph",
        "stacks",
    ],
    ACADEMIC.domain: [
        "class",
        "grade",
        "course",
        "enroll",
        "drop",
        "study",
        "exam",
        "prerequisite",
        "berkeleytime",
        "academic",
        "eecs",
        "cs",
        "failing",
        "waitlist",
    ],
}

# Cross-domain triggers (Band + Fetch.ai demo intelligence)
CROSS_DOMAIN_TRIGGERS: dict[str, list[str]] = {
    FOOD.domain: [FINANCIAL_AID.domain, SCHOLARSHIP.domain],
    FINANCIAL_AID.domain: [FOOD.domain, WELLNESS.domain],
    ACADEMIC.domain: [WELLNESS.domain, FINANCIAL_AID.domain],
    WELLNESS.domain: [FINANCIAL_AID.domain],
    SCHOLARSHIP.domain: [FINANCIAL_AID.domain],
    HOUSING.domain: [FINANCIAL_AID.domain],
}

DOMAIN_PRIORITY = [
    FOOD.domain,
    FINANCIAL_AID.domain,
    SCHOLARSHIP.domain,
    HOUSING.domain,
    WELLNESS.domain,
    SAFETY.domain,
    ACADEMIC.domain,
]


def route_domains(message: str) -> list[str]:
    """Return specialist domains to activate for a user message."""
    text = message.lower()
    matched = [
        domain
        for domain, keywords in DOMAIN_KEYWORDS.items()
        if any(keyword in text for keyword in keywords)
    ]

    if not matched:
        return [FOOD.domain, FINANCIAL_AID.domain]

    expanded = set(matched)
    for domain in list(matched):
        for linked in CROSS_DOMAIN_TRIGGERS.get(domain, []):
            expanded.add(linked)

    return [d for d in DOMAIN_PRIORITY if d in expanded]
