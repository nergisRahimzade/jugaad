"""Keyword routing — paste this file into the Coordinator hosted agent project."""

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "food": ["food", "hungry", "groceries", "calfresh", "pantry", "meal", "eat", "starving"],
    "housing": ["housing", "rent", "homeless", "lease", "landlord", "co-op", "coop", "shelter"],
    "financial_aid": ["financial", "fafsa", "aid", "tuition", "afford", "pay", "broke", "money", "grant"],
    "scholarship": ["scholarship", "scholarships", "award", "fellowship"],
    "wellness": ["stress", "anxiety", "caps", "therapy", "mental", "overwhelmed", "depression", "lets talk"],
    "safety": ["safe", "walk", "night", "safewalk", "scared", "route", "telegraph"],
    "academic": ["class", "grade", "enroll", "failing", "berkeleytime", "study", "course", "waitlist"],
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
