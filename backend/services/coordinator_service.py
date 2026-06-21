"""Coordinator routing + merged system prompt for direct student queries."""

from uuid import uuid4

from prompts.domains.academic import ACADEMIC_DOMAIN
from prompts.domains.financial_aid import FINANCIAL_AID_DOMAIN
from prompts.domains.food import FOOD_DOMAIN
from prompts.domains.housing import HOUSING_DOMAIN
from prompts.domains.safety import SAFETY_DOMAIN
from prompts.domains.wellness import WELLNESS_DOMAIN
from prompts.master import build_system_prompt

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "food": ["food", "hungry", "groceries", "calfresh", "pantry", "meal", "eat", "starving"],
    "housing": ["housing", "rent", "homeless", "lease", "landlord", "co-op", "coop", "shelter", "dorm", "apartment"],
    "financial_aid": ["financial", "fafsa", "aid", "tuition", "afford", "pay", "broke", "money", "grant", "loan", "fee"],
    "scholarship": ["scholarship", "scholarships", "award", "fellowship"],
    "wellness": [
        "stress", "anxiety", "caps", "therapy", "mental", "overwhelmed", "depression",
        "lets talk", "counseling", "sad", "lonely", "alone", "crying", "grief", "hopeless",
        "burnout", "exhausted", "tired", "suicid", "self-harm", "hurt", "upset", "feel bad",
    ],
    "safety": ["safe", "walk", "night", "safewalk", "scared", "route", "telegraph", "buddy"],
    "academic": ["class", "grade", "enroll", "failing", "berkeleytime", "study", "course", "waitlist", "exam", "eecs"],
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

DOMAIN_PROMPTS: dict[str, str] = {
    "food": FOOD_DOMAIN,
    "housing": HOUSING_DOMAIN,
    "financial_aid": FINANCIAL_AID_DOMAIN,
    "safety": SAFETY_DOMAIN,
    "academic": ACADEMIC_DOMAIN,
    "wellness": WELLNESS_DOMAIN,
    "scholarship": FINANCIAL_AID_DOMAIN,
}

AGENT_LABELS: dict[str, str] = {
    "food": "Food Agent",
    "housing": "Housing Agent",
    "financial_aid": "Financial Aid Agent",
    "safety": "Safety Agent",
    "academic": "Academic Agent",
    "wellness": "Wellness Agent",
    "scholarship": "Scholarship Agent",
}

# Greetings / meta questions — coordinator answers directly, no specialist agent
GENERAL_PHRASES = [
    "your name",
    "who are you",
    "what are you",
    "what is jugaad",
    "what is this",
    "hello",
    "hi ",
    "hey ",
    "thanks",
    "thank you",
]


def route_domains(message: str) -> list[str]:
    text = message.lower().strip()

    matched = [
        domain
        for domain, keywords in DOMAIN_KEYWORDS.items()
        if any(keyword in text for keyword in keywords)
    ]

    if matched:
        if len(matched) == 1:
            return matched
        expanded = set(matched)
        for domain in list(matched):
            for linked in CROSS_DOMAIN_TRIGGERS.get(domain, []):
                expanded.add(linked)
        return [d for d in DOMAIN_PRIORITY if d in expanded]

    if any(phrase in text for phrase in GENERAL_PHRASES):
        return []

    return ["wellness"]


def build_coordinator_system(
    domains: list[str],
    profile_context: str | None,
    profile_addendum: str | None = None,
    data_context: str | None = None,
    agentverse_context: str | None = None,
) -> str:
    profile_block = profile_addendum or ""
    if profile_context and not profile_addendum:
        profile_block = "Use the student context below to personalize your answer."

    if not domains:
        coordinator_addendum = f"""COORDINATOR MODE — general question.

Answer directly as Jugaad in 2–4 short sentences. Warm, human.
Do NOT mention specialist agents. Do NOT dump resource lists unless they asked for help with something specific.

{profile_block}"""
        return build_system_prompt(profile_context, coordinator_addendum)

    labels = [AGENT_LABELS[d] for d in domains]
    domain_knowledge = "\n\n".join(DOMAIN_PROMPTS[d] for d in domains)
    coordinator_addendum = f"""COORDINATOR MODE — activated specialists (already shown in the UI as badges): {", ".join(labels)}

Answer the student's question using specialist knowledge below.

CRITICAL FORMAT RULES:
- Do NOT output an "Agents:" line or list agent names — the UI already shows them.
- Do NOT repeat the agent names in your opening sentence.
- Use plain text only (no markdown bold with **).
- Keep the answer scannable: 2–4 short paragraphs max, then one concrete next step.

{profile_block}

Specialist knowledge:
{domain_knowledge}"""

    if data_context:
        coordinator_addendum += f"\n\n{data_context}"

    if agentverse_context:
        coordinator_addendum += f"""

AGENTVERSE MULTI-AGENT PLAN (live from Fetch.ai Coordinator on Agentverse — treat as ground truth for specialist routing):
{agentverse_context}

Synthesize this agent plan with Redis/Browserbase data above. Keep Fetch.ai agent contributions visible in your answer (e.g. mention the stacking plan specialists returned). Do not claim agents ran if this block says unavailable."""

    return build_system_prompt(profile_context, coordinator_addendum)


# Fallback Agentverse addresses — env vars in agents/config.py take precedence
_DEMO_ADDRESSES: dict[str, str] = {
    "coordinator": "agent1qt2jfktceux9wc0pxrxqxptjmmup80jeweqv7vc86hj20x8ewugh2wr9t63",
    "food": "agent1qffq6r00xsyzv5rsee0828q3vf25ppuskag0hmj28xxuz2c2yn7yc4k9wfu",
    "housing": "agent1q0ksgfc5749c6588sacxk9eje9lvcj76w9qdg5udpds8pwj80llp5j8m23y",
    "financial_aid": "agent1qws7ljtvm9gj0m864ga4u7lf8l023wsn07ty7w2d65cr63vulq9p2praxyw",
    "scholarship": "agent1qt8rpsv46ez0vg3s9un5ru5lfsku8vek979txvnn04uge9uzh4sdug58fzd",
    "wellness": "agent1qgmz9nj2s6apnkg0zmn6ah9c9c5ekfedck0696ty8g73neg6744yvlnrfek",
    "safety": "agent1q2qy2t9pl8cvvznpkz9jy72m05su59vq4g6y2ehk7n3sess3jdpt653c6f5",
    "academic": "agent1qt9whv7cql87c725zdqd7l9cnvme4vjynf27zqckef7pkffaax6k756aqah",
}

_CROSS_INSIGHTS: dict[str, str] = {
    "food": "Food insecurity may indicate unclaimed aid",
    "financial_aid": "Financial stress or aid gap detected",
    "academic": "Academic struggle — mental health support recommended",
    "wellness": "Mental health stress may affect aid eligibility",
    "scholarship": "Scholarship search active — check fee payment plan",
    "housing": "Housing instability may require emergency aid",
}


def _agent_address(domain: str) -> str:
    try:
        from agents.config import AGENT_ADDRESSES

        addr = AGENT_ADDRESSES.get(domain, "").strip()
        if addr:
            return addr[:16] + "…" if len(addr) > 16 else addr
    except ImportError:
        pass
    return _DEMO_ADDRESSES.get(domain, f"agent1q…{domain[:4]}")


def build_orchestration_events(
    message: str,
    request_id: str | None = None,
    intel_events_by_domain: dict[str, list[dict]] | None = None,
    session_id: str | None = None,
) -> tuple[str, list[dict]]:
    """
    Build agent activity events mirroring Fetch.ai uAgent coordinator flow.
    Returns (request_id, events) for SSE streaming to the frontend.
    """
    from agents.services import band_room

    request_id = request_id or str(uuid4())[:8]
    band_session = session_id or request_id
    band_room.create_session(band_session)

    domains = route_domains(message)
    short = message[:55] + ("…" if len(message) > 55 else "")
    events: list[dict] = []

    events.append(
        {
            "agentId": "coordinator",
            "type": "route",
            "message": f'RECV ChatMessage from user: "{short}"',
            "meta": {"protocol": "ChatMessage"},
        }
    )

    if not domains:
        events.append(
            {
                "agentId": "coordinator",
                "type": "info",
                "message": "No specialist match — coordinator answers directly (no JugaadQuery dispatch)",
            }
        )
        return request_id, events

    matched = [
        domain
        for domain, keywords in DOMAIN_KEYWORDS.items()
        if any(keyword in message.lower() for keyword in keywords)
    ]
    cross_added = [d for d in domains if d not in matched]

    events.append(
        {
            "agentId": "coordinator",
            "type": "route",
            "message": (
                f"Keyword match: [{', '.join(matched) or 'none'}] → "
                f"activating {len(domains)} specialists: {', '.join(domains)}"
            ),
            "meta": {"domains": ", ".join(domains), "requestId": request_id},
        }
    )

    if cross_added:
        events.append(
            {
                "agentId": "coordinator",
                "type": "band",
                "message": (
                    f"Band cross-domain triggers expanded routing → also activated: {', '.join(cross_added)}"
                ),
                "meta": {"triggers": ", ".join(cross_added)},
            }
        )

    for domain in domains:
        addr = _agent_address(domain)
        wire = f"JUGAAD_QUERY|{request_id}|{short}"
        events.append(
            {
                "agentId": "coordinator",
                "type": "query",
                "message": f"SEND ChatMessage → {addr}  payload: {wire}",
                "meta": {"to": addr, "requestId": request_id, "wire": wire},
            }
        )
        events.append(
            {
                "agentId": domain,
                "type": "query",
                "message": f"RECV JugaadQuery (request_id={request_id}) — processing {domain} domain",
                "meta": {"requestId": request_id},
            }
        )
        for intel_event in (intel_events_by_domain or {}).get(domain, []):
            events.append(intel_event)

        if not (intel_events_by_domain or {}).get(domain):
            events.append(
                {
                    "agentId": domain,
                    "type": "search",
                    "message": "Querying Redis vector search + Berkeley domain knowledge base",
                }
            )

        if domain in matched:
            band_room.publish(band_session, domain, f"Processing: {short}")

        if domain in matched and domain in CROSS_DOMAIN_TRIGGERS:
            linked = [t for t in CROSS_DOMAIN_TRIGGERS[domain] if t in domains]
            if linked:
                insight = _CROSS_INSIGHTS.get(domain, "Cross-domain link detected")
                events.append(
                    {
                        "agentId": domain,
                        "type": "band",
                        "message": f'Band room insight: "{insight}" → notified {", ".join(linked)}',
                        "meta": {"triggers": ", ".join(linked)},
                    }
                )

        response_wire = f"JUGAAD_RESPONSE|{request_id}|{domain}|{{summary}}||{{recommendations}}"
        events.append(
            {
                "agentId": domain,
                "type": "response",
                "message": f"SEND → coordinator  payload: {response_wire}",
                "meta": {"requestId": request_id, "wire": response_wire},
            }
        )

    events.append(
        {
            "agentId": "coordinator",
            "type": "merge",
            "message": (
                f"All {len(domains)}/{len(domains)} JugaadResponses received — "
                "merging specialist knowledge + streaming answer to user"
            ),
            "meta": {"requestId": request_id},
        }
    )

    return request_id, events
