import { AGENTS, CROSS_DOMAIN_TRIGGERS } from "./agents";
import type {
  AgentDomain,
  AgentEvent,
  AgentResponse,
  BandEvent,
  DemoResult,
} from "./types";

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  food: ["food", "hungry", "groceries", "calfresh", "pantry", "meal", "eat", "starving"],
  housing: ["housing", "rent", "homeless", "dorm", "lease", "evict", "co-op", "apartment"],
  financial_aid: ["financial", "fafsa", "aid", "grant", "loan", "tuition", "fee", "money", "afford", "pay", "broke"],
  scholarship: ["scholarship", "scholarships", "award", "fellowship"],
  wellness: ["mental", "health", "stress", "anxiety", "depression", "therapy", "counseling", "caps", "overwhelmed"],
  safety: ["safe", "safety", "walk", "walking", "night", "scared", "buddy", "safewalk", "route", "stacks"],
  academic: ["class", "grade", "course", "enroll", "study", "exam", "academic", "eecs", "cs", "failing", "waitlist"],
};

const DOMAIN_PRIORITY: AgentDomain[] = [
  "food",
  "financial_aid",
  "scholarship",
  "housing",
  "wellness",
  "safety",
  "academic",
];

const RESPONSES: Record<string, Omit<AgentResponse, "domain" | "agentName">> = {
  food: {
    summary: "Stack CalFresh ($292/mo) + MLK pantry + Grab N Go + club catering + Market Match for near-zero food budget.",
    recommendations: [
      "CalFresh Stacking: Combine CalFresh + weekly pantry + free campus events + Market Match at Saturday farmers market.",
      "CalFresh Loopholes: Half-time + work-study = qualified regardless of income.",
      "Free Food Calendar: 4 campus events with free catering this week.",
    ],
    resources: [
      { name: "CalFresh FAQ", url: "https://basicneeds.berkeley.edu/faq/calfresh", value: "$292/month", effort: "30 min" },
      { name: "Food Pantry (MLK)", url: "https://basicneeds.berkeley.edu/pantry", value: "Weekly groceries", effort: "Walk-in" },
    ],
    urgency: "high",
  },
  financial_aid: {
    summary: "Special Circumstances appeal + emergency loan bridge while FAFSA processing is paused.",
    recommendations: [
      "Special Circumstances Appeal: Recalculate aid on CURRENT income — can add thousands.",
      "Emergency Loan Bridge: Short-term loans with minimal paperwork during FAFSA pause.",
      "Fee Payment Plan: Spread tuition across semester.",
    ],
    resources: [
      { name: "Financial Aid Office", url: "https://financialaid.berkeley.edu", value: "Appeals + emergency aid", effort: "Online form" },
    ],
    urgency: "high",
  },
  scholarship: {
    summary: "Micro-scholarship scan found 3 department awards with deadlines this week.",
    recommendations: [
      "Department Scholarships: $500–$2,000 awards per major with few applicants.",
      "Essay Reuse Strategy: One personal statement adapted per micro-scholarship.",
    ],
    resources: [
      { name: "Berkeley Scholarships", url: "https://financialaid.berkeley.edu", value: "$500–$5,000", effort: "Varies" },
    ],
    urgency: "medium",
  },
  housing: {
    summary: "BSC co-op (30–50% cheaper), rent control rights, and emergency bridge housing.",
    recommendations: [
      "BSC Co-Op Secret: 30–50% cheaper than dorms, meals included, rolling admissions.",
      "Rent Control: Pre-1980 apartments have annual caps set by Rent Board.",
    ],
    resources: [
      { name: "BSC Co-ops", url: "https://bsc.coop", value: "30–50% cheaper", effort: "Application" },
    ],
    urgency: "high",
  },
  wellness: {
    summary: "Bypass CAPS wait with Let's Talk drop-ins and SHIP therapist same-week openings.",
    recommendations: [
      "Let's Talk Drop-Ins: Free, no appointment at multiple campus locations.",
      "SHIP Therapist Bypass: Off-campus providers with same-week availability.",
    ],
    resources: [
      { name: "CAPS Counseling", url: "https://uhs.berkeley.edu/counseling", value: "Let's Talk + urgent", effort: "Drop-in" },
    ],
    urgency: "high",
  },
  safety: {
    summary: "Walking buddy match + safe route recommendation for late-night travel.",
    recommendations: [
      "Walking Buddy: 2 students leaving Main Stacks in 8 min heading to Southside.",
      "Safe Route: Oxford St — 3 min longer, better lit, zero incidents this month.",
    ],
    resources: [
      { name: "SafeWalk", url: "https://ucpd.berkeley.edu", value: "Free escort", effort: "App request" },
    ],
    urgency: "high",
  },
  academic: {
    summary: "Enrollment strategy + study group matching for high-failure-rate courses.",
    recommendations: [
      "BerkeleyTime Pattern: Section drops typically open week 2 — set alerts.",
      "Study Group Match: 3 CS 61A students near you, same schedule.",
    ],
    resources: [
      { name: "BerkeleyTime", url: "https://berkeleytime.com", value: "Enrollment data", effort: "5 min" },
    ],
    urgency: "medium",
  },
};

function agentAddress(domain: string): string {
  return AGENTS.find((a) => a.id === domain)?.address ?? `agent1q…${domain.slice(0, 4)}`;
}

function routeDomains(message: string): AgentDomain[] {
  const text = message.toLowerCase();
  const matched = Object.entries(DOMAIN_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => text.includes(k)))
    .map(([domain]) => domain as AgentDomain);

  if (matched.length === 0) return ["food", "financial_aid"];

  const expanded = new Set(matched);
  for (const domain of matched) {
    const triggers = CROSS_DOMAIN_TRIGGERS[domain]?.triggers ?? [];
    triggers.forEach((t) => expanded.add(t as AgentDomain));
  }

  return DOMAIN_PRIORITY.filter((d) => expanded.has(d));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export async function simulateDemo(
  query: string,
  onEvent?: (event: AgentEvent) => void
): Promise<DemoResult> {
  const events: AgentEvent[] = [];
  const bandEvents: BandEvent[] = [];
  const routedDomains = routeDomains(query);
  const requestId = uid();

  const push = (event: Omit<AgentEvent, "id" | "timestamp">) => {
    const full: AgentEvent = { ...event, id: uid(), timestamp: Date.now() };
    events.push(full);
    onEvent?.(full);
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const short = query.slice(0, 55) + (query.length > 55 ? "…" : "");

  push({
    agentId: "coordinator",
    type: "route",
    message: `RECV ChatMessage from user: "${short}"`,
    meta: { protocol: "ChatMessage" },
  });
  await delay(400);

  const matched = Object.entries(DOMAIN_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => query.toLowerCase().includes(k)))
    .map(([domain]) => domain);
  const crossAdded = routedDomains.filter((d) => !matched.includes(d));

  push({
    agentId: "coordinator",
    type: "route",
    message: `Keyword match: [${matched.join(", ") || "none"}] → activating ${routedDomains.length} specialists: ${routedDomains.join(", ")}`,
    meta: { domains: routedDomains.join(", "), requestId },
  });
  await delay(300);

  if (crossAdded.length > 0) {
    push({
      agentId: "coordinator",
      type: "band",
      message: `Band cross-domain triggers expanded routing → also activated: ${crossAdded.join(", ")}`,
      meta: { triggers: crossAdded.join(", ") },
    });
    await delay(200);
  }

  for (const domain of routedDomains) {
    const addr = agentAddress(domain);
    const wire = `JUGAAD_QUERY|${requestId}|${short}`;

    push({
      agentId: "coordinator",
      type: "query",
      message: `SEND ChatMessage → ${addr}  payload: ${wire}`,
      meta: { to: addr, requestId, wire },
    });
    await delay(350);

    push({
      agentId: domain,
      type: "query",
      message: `RECV JugaadQuery (request_id=${requestId}) — processing ${domain} domain`,
      meta: { requestId },
    });
    await delay(300);

    push({
      agentId: domain,
      type: "search",
      message: "Querying Redis vector search + Berkeley domain knowledge base",
    });
    await delay(500);

    const bandMeta = CROSS_DOMAIN_TRIGGERS[domain];
    if (bandMeta && matched.includes(domain)) {
      const linked = bandMeta.triggers.filter((t) => routedDomains.includes(t as AgentDomain));
      if (linked.length > 0) {
        const bandEvent: BandEvent = {
          agent: domain,
          insight: bandMeta.insight,
          triggers: bandMeta.triggers,
          summary: RESPONSES[domain]?.summary.slice(0, 80) ?? "",
        };
        bandEvents.push(bandEvent);

        push({
          agentId: domain,
          type: "band",
          message: `Band room insight: "${bandMeta.insight}" → notified ${linked.join(", ")}`,
          meta: { triggers: linked.join(", ") },
        });
        await delay(300);
      }
    }

    const responseWire = `JUGAAD_RESPONSE|${requestId}|${domain}|{summary}||{recommendations}`;
    push({
      agentId: domain,
      type: "response",
      message: `SEND → coordinator  payload: ${responseWire}`,
      meta: { requestId, wire: responseWire },
    });
    await delay(250);
  }

  push({
    agentId: "coordinator",
    type: "merge",
    message: `All ${routedDomains.length}/${routedDomains.length} JugaadResponses received — merging into personalized plan`,
    meta: { requestId },
  });
  await delay(400);

  const responses: AgentResponse[] = routedDomains.map((domain) => ({
    domain,
    agentName: `jugaad-${domain.replace("_", "-")}-agent`,
    ...RESPONSES[domain],
  }));

  const mergedPlan = buildMergedPlan(query, responses, bandEvents);

  push({
    agentId: "coordinator",
    type: "merge",
    message: "ChatMessage delivered to user (EndSessionContent)",
    meta: { requestId },
  });

  return { query, routedDomains, events, bandEvents, responses, mergedPlan };
}

function buildMergedPlan(
  query: string,
  responses: AgentResponse[],
  bandEvents: BandEvent[]
): string {
  const lines = [
    "Here is your personalized resource plan:\n",
    ...responses.flatMap((r, i) => [
      `## ${i + 1}. ${r.domain.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      r.summary,
      ...r.recommendations.slice(0, 3).map((rec) => `• ${rec}`),
      "",
    ]),
  ];

  if (bandEvents.length > 0) {
    lines.push("### Cross-Agent Intelligence");
    for (const e of bandEvents) {
      lines.push(`• ${e.agent}: ${e.insight} → activated ${e.triggers.join(", ")}`);
    }
    lines.push("");
  }

  lines.push(
    "Agents collaborated via coordinator routing + cross-domain triggers.",
  );

  return lines.join("\n");
}

export const DEMO_QUERIES = [
  { label: "Food insecurity", query: "I need help paying for food this week" },
  { label: "Late-night safety", query: "I need to walk from Main Stacks to Unit 2 and it's late" },
  { label: "Financial aid crisis", query: "FAFSA is paused and I can't afford tuition" },
  { label: "Mental health", query: "I'm overwhelmed and CAPS has a 3 week wait" },
  { label: "Academic struggle", query: "I'm failing CS 61A and need help enrolling" },
];
