"""Seeded hackathon demo responses — reliable Jugaad 1, Jugaad 2… format for judge queries."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class DemoSeed:
    id: str
    label: str
    domains: list[str]
    response: str
    matchers: tuple[tuple[str, ...], ...]  # any group: all phrases in a group must match


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def _matches(message: str, groups: tuple[tuple[str, ...], ...]) -> bool:
    norm = _normalize(message)
    return any(all(phrase in norm for phrase in group) for group in groups)


# Ordered most-specific first
_DEMO_SEEDS: list[DemoSeed] = [
    DemoSeed(
        id="coordinator_multi",
        label="Coordinator — multi-agent routing",
        domains=["food", "financial_aid", "wellness"],
        matchers=(
            ("transfer", "financial aid", "groceries"),
            ("transfer", "financial aid", "afford food"),
            ("part-time", "financial aid", "groceries"),
        ),
        response="""Okay — transfer + part-time + aid delay + groceries is exactly the stack where three agents should fire at once. Here's what I'd do this week, in order.

Food Agent:
Jugaad 1: CalFresh — about $292/month on an EBT card. As a part-time student, you likely qualify under the student exemption if you work 20+ hours/week OR have work-study. Apply at benefitscal.com — takes 20–30 minutes. I can pre-fill your application from your profile.
Jugaad 2: Basic Needs Food Pantry, lower level MLK Student Union. Once per week with Cal ID. Friday afternoons = shortest lines. Monday ~2pm = best produce drop.
Jugaad 3: Grab N Go recovered meals — free, daily at campus dining locations. No appointment.

Financial Aid Agent:
Jugaad 4: FAFSA processing has been delayed system-wide (not just you) — if your aid hasn't hit, file a short-term emergency loan through Financial Aid (often ~$1,500, interest-free bridge) while your package processes.
Jugaad 5: Fee Payment Plan — spreads any remaining tuition/fees across the semester so you aren't hit with one lump sum while aid is pending.
Jugaad 6: Special Circumstances appeal — if your income changed (hours cut, family support dropped), ask Financial Aid to recalculate on current income. Walk into Sproul Hall Room 200 with pay stubs.

Wellness Agent:
Jugaad 7: Let's Talk — free drop-in counseling, no appointment. Check uhs.berkeley.edu/counseling for today's location (often MLK or Eshleman).
Jugaad 8: 24/7 line 855-817-5667 — free for all Berkeley students when Tang feels booked out.

Want me to start with CalFresh? That's the fastest money in your pocket.""",
    ),
    DemoSeed(
        id="food",
        label="Food Agent",
        domains=["food", "financial_aid"],
        matchers=(
            ("afford food", "don't think", "qualify"),
            ("afford food", "don't qualify"),
            ("can't afford food", "qualify"),
        ),
        response="""You almost certainly qualify for more than you think — most students who say that are eligible for at least two of these.

Jugaad 1: CalFresh — about $292/month on an EBT card. Student exemptions: work 20+ hrs/week OR work-study often means qualified regardless of what you assume about income. Apply at benefitscal.com (20–30 min). Want me to pre-fill your application?

Jugaad 2: Basic Needs Food Pantry — lower level MLK Student Union. Once/week with Cal ID. Friday afternoons = shortest lines. Monday ~2pm = best produce.

Jugaad 3: Grab N Go recovered meals — free, daily on campus. Check the dining app for today's pickup window.

Jugaad 4: Market Match at Berkeley Farmers Market — Saturdays, Center St & Milvia. Doubles the first $10 of CalFresh — that's $20 of produce for $10.

Jugaad 5: Free catering on campus this week — club meetings, speaker series, dept receptions. I'll surface events near you if you tell me your schedule.

Stack all five and you're eating well on almost nothing.""",
    ),
    DemoSeed(
        id="housing",
        label="Housing Agent",
        domains=["housing", "financial_aid"],
        matchers=(
            ("lease", "afford"),
            ("lease ends", "afford"),
            ("find anything", "afford"),
        ),
        response="""Lease crunch is scary — here's the Berkeley playbook most students never get told upfront.

Jugaad 1: Berkeley Student Cooperative (bsc.coop) — 30–50% cheaper than market rent, meals often included, rolling admissions year-round. Call (510) 848-1936 or apply at bsc.coop/apply. Most first-gen and transfer students never hear about this.

Jugaad 2: Summer sublet conversion — take a summer sublet at 40–60% off market, then offer to sign the full-year lease in August. Landlords often prefer you over a stranger off Craigslist.

Jugaad 3: Rent control — pre-1980 buildings in Berkeley are rent-controlled. Your landlord can only raise rent by the Rent Board annual percentage. Push back on illegal increases.

Jugaad 4: Basic Needs Holistic Fund — emergency cash for housing deposits and bridge rent. Walk into University Hall 201 or call (510) 642-6325 same day.

Jugaad 5: Community housing channels — Berkeley sublets/housing Facebook groups + BSC waitlist + co-op swap boards for temp room coverage while you lock something long-term.

Want me to draft your BSC application answers from your profile?""",
    ),
    DemoSeed(
        id="financial_aid",
        label="Financial Aid Agent",
        domains=["financial_aid", "food"],
        matchers=(
            ("financial aid", "freaking out"),
            ("financial aid", "haven't heard"),
            ("haven't heard anything", "financial aid"),
            ("fafsa", "freaking out"),
        ),
        response="""Deep breath — this is probably not personal, and you still have moves today.

Jugaad 1: FAFSA processing paused April 21, 2026 due to One Big Beautiful Bill Act system updates. Delays are campus-wide — not a rejection of you.

Jugaad 2: Emergency short-term loan from Berkeley Financial Aid — often ~$1,500, quick turnaround, minimal paperwork. Ask at Sproul Hall Room 200 or financialaid.berkeley.edu.

Jugaad 3: Fee Payment Plan — spreads tuition across the semester instead of one lump while aid catches up.

Jugaad 4: Special Circumstances appeal — job loss, medical bills, divorce, housing cost spike? Berkeley can recalculate aid on current income and add thousands in grants. Most students never file this. Bring documentation to Financial Aid.

Jugaad 5: Department micro-scholarships — $500–$2,000 awards in your major with fewer than 10 applicants some semesters. Email your undergrad advisor this week.

Want me to walk you through the Special Circumstances appeal first? That's often the biggest dollar unlock.""",
    ),
    DemoSeed(
        id="wellness",
        label="Wellness Agent",
        domains=["wellness", "financial_aid"],
        matchers=(
            ("stressed", "tang"),
            ("counseling", "booked"),
            ("tang center", "weeks"),
            ("caps", "booked"),
        ),
        response="""Tang being booked doesn't mean you're stuck — Berkeley has faster doors almost nobody advertises.

Jugaad 1: Let's Talk — free drop-in counseling, no appointment, no paperwork. Multiple campus locations weekly. Check uhs.berkeley.edu/counseling — next sessions often at MLK or Eshleman (typically mid-afternoon slots).

Jugaad 2: SHIP insurance covers off-campus therapists with no referral — same-week openings while CAPS is backed up. I can help you search providers accepting SHIP near campus.

Jugaad 3: CAPS same-day urgent appointments — walk in, tell them it's urgent. You don't need to be in full crisis to qualify for an urgent slot.

Jugaad 4: 24/7 counseling line 855-817-5667 — free for all Berkeley students. Nights and weekends when everything else is closed.

Jugaad 5: Peer support circles — small matched groups (4–6 students) with structured check-ins. Less formal than CAPS, more human than struggling alone.

Want me to find the next Let's Talk location and time for you?""",
    ),
    DemoSeed(
        id="safety",
        label="Safety Agent",
        domains=["safety"],
        matchers=(
            ("library", "midnight", "safe"),
            ("walk home", "don't feel safe"),
            ("midnight", "don't feel safe"),
            ("late", "walk", "safe"),
        ),
        response="""You shouldn't have to white-knuckle a midnight walk — here's what actually works on campus tonight.

Jugaad 1: Walking buddy match — 2 other students leaving in ~10 minutes heading your direction. Want me to form a group walk?

Jugaad 2: Safe route — take Oxford instead of Telegraph tonight. About 3 minutes longer, better lighting, zero incidents reported this month on that path.

Jugaad 3: BearWalk / SafeWalk escort — call 510-642-9255 right now for a free student safety escort to your door or car.

Jugaad 4: Save UCPD non-emergency 510-642-6760 in your phone before you leave the library.

Want me to ping the walking buddy queue for your route?""",
    ),
    DemoSeed(
        id="academic",
        label="Academic Agent",
        domains=["academic"],
        matchers=(
            ("waitlist", "cs 189"),
            ("cs 189", "get in"),
            ("cs189", "waitlist"),
        ),
        response="""Waitlist panic is normal in EECS — but there's a playbook beyond refreshing CalCentral.

Jugaad 1: Email the instructor directly — in EECS this works more than students think. Short, respectful, show you've read the syllabus. Want me to draft that email?

Jugaad 2: UC Berkeley Extension equivalent — often same material, open enrollment. Credits may transfer — confirm with your advisor before you pay.

Jugaad 3: BerkeleyTime data — CS 189 historically sees 15–20% drops in the first two weeks. Attend lectures anyway; professors prioritize students who show up consistently.

Jugaad 4: Prerequisite is soft, not hard — if you have equivalent background (ML coursework, research), say so explicitly in your email with links to projects.

Jugaad 5: CS 182 as alternative — significant content overlap with 189 for many tracks. Ask your advisor if it satisfies your requirement.

Want me to draft the professor email now?""",
    ),
    DemoSeed(
        id="scholarship",
        label="Scholarship Agent",
        domains=["scholarship", "financial_aid"],
        matchers=(
            ("money", "next semester", "scholarship"),
            ("scholarship", "next semester"),
            ("where to look", "scholarship"),
            ("need money", "scholarship"),
        ),
        response="""Scholarship hunting feels vague until you know where the low-competition money hides.

Jugaad 1: Department-specific scholarships — often $500–$2,000 with fewer than 10 applicants. Email your major advisor: "Are there underawarded scholarships I should apply for this semester?"

Jugaad 2: Cal Alumni Association scholarships — transfer-specific pools with higher acceptance rates than campus-wide awards.

Jugaad 3: Cultural center grants — AASU, La Raza, Multicultural Community Center. Rolling deadlines, less crowded than central financial aid lists.

Jugaad 4: Basic Needs Holistic Fund — immediate emergency money (not a scholarship, but cash this week). University Hall 201, (510) 642-6325.

Jugaad 5: External hyper-specific scholarships — filter for awards that require your exact major + identity + county. Fewer applicants = better odds.

Jugaad 6: Special Circumstances appeal — if your aid package is low, recalculate on current income before hunting new awards. Can add thousands in grants.

Want me to pull department scholarships matched to your major?""",
    ),
]


def match_demo_seed(message: str) -> DemoSeed | None:
    """Return a seeded demo if the user message matches a known judge query."""
    if not message or not message.strip():
        return None
    for seed in _DEMO_SEEDS:
        if _matches(message, seed.matchers):
            return seed
    return None


def list_demo_seeds() -> list[dict[str, str]]:
    return [{"id": s.id, "label": s.label, "domains": ", ".join(s.domains)} for s in _DEMO_SEEDS]
