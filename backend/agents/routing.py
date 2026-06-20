"""Keyword-based routing from user message to specialist domains."""

from .config import ACADEMIC, FINANCIAL_AID, FOOD, HOUSING, SAFETY

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
        "scholarship",
        "grant",
        "loan",
        "tuition",
        "fee",
        "money",
        "afford",
        "pay",
        "debt",
        "pell",
    ],
    SAFETY.domain: [
        "safe",
        "safety",
        "walk",
        "night",
        "scared",
        "buddy",
        "safewalk",
        "route",
        "incident",
        "campus",
        "telegraph",
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
    ],
}

# Cross-domain triggers (Fetch.ai demo: food + financial aid together)
CROSS_DOMAIN_TRIGGERS: dict[str, list[str]] = {
    FOOD.domain: [FINANCIAL_AID.domain],
    FINANCIAL_AID.domain: [FOOD.domain],
    ACADEMIC.domain: [FINANCIAL_AID.domain],
}


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
    for domain in matched:
        for linked in CROSS_DOMAIN_TRIGGERS.get(domain, []):
            expanded.add(linked)

    priority = [FOOD.domain, FINANCIAL_AID.domain, HOUSING.domain, SAFETY.domain, ACADEMIC.domain]
    return [d for d in priority if d in expanded]
