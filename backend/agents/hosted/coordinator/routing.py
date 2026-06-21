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

MAX_ACTIVATED_AGENTS = 3
CONFIDENCE_THRESHOLD_FOR_CROSS_DOMAIN = 0.72


def _confidence_score(text: str, matched: list[str]) -> float:
    if not matched:
        return 0.0
    hits = 0
    for domain in matched:
        hits += sum(1 for keyword in DOMAIN_KEYWORDS[domain] if keyword in text)
    return min(0.99, 0.58 + (hits * 0.1) + (0.08 if len(matched) == 1 else 0.0))


def route_domains(message: str) -> list[str]:
    text = message.lower()
    matched = [
        domain
        for domain, keywords in DOMAIN_KEYWORDS.items()
        if any(keyword in text for keyword in keywords)
    ]
    if not matched:
        return ["wellness"]

    expanded = set(matched)
    if _confidence_score(text, matched) >= CONFIDENCE_THRESHOLD_FOR_CROSS_DOMAIN:
        for domain in list(matched):
            for linked in CROSS_DOMAIN_TRIGGERS.get(domain, []):
                expanded.add(linked)

    return [d for d in DOMAIN_PRIORITY if d in expanded][:MAX_ACTIVATED_AGENTS]
