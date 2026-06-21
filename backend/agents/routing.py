"""Keyword-based routing from user message to specialist domains."""

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "food": [
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
    "housing": [
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
    "financial_aid": [
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
    "scholarship": [
        "scholarship",
        "scholarships",
        "award",
        "fellowship",
        "micro-scholarship",
    ],
    "wellness": [
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
    "safety": [
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
    "academic": [
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

CROSS_DOMAIN_TRIGGERS: dict[str, list[str]] = {
    "food": ["financial_aid", "scholarship"],
    "financial_aid": ["food", "wellness"],
    "academic": ["wellness", "financial_aid"],
    "wellness": ["financial_aid"],
    "scholarship": ["financial_aid"],
    "housing": ["financial_aid"],
}

DOMAIN_PRIORITY = [
    "food",
    "financial_aid",
    "scholarship",
    "housing",
    "wellness",
    "safety",
    "academic",
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
        return ["food", "financial_aid"]

    expanded = set(matched)
    for domain in list(matched):
        for linked in CROSS_DOMAIN_TRIGGERS.get(domain, []):
            expanded.add(linked)

    return [d for d in DOMAIN_PRIORITY if d in expanded]
