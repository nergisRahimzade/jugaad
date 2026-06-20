# Jugaad 🛠️

> **When Berkeley's systems fail students, Jugaad gives them the workaround.**

Jugaad is a voice-powered AI platform that crowdsources and delivers the creative hacks, loopholes, and workarounds that Berkeley students use to survive broken systems — and makes them available to every student, not just the ones with the right connections.

Built at **UC Berkeley AI Hackathon 2026** by team **Jugaad** · Track: Ddoski's World (Social Impact) · $5,000 Grand Prize

---

## The Problem

Berkeley's institutional systems — financial aid, housing, mental health, enrollment, food access — are broken, overwhelmed, or inaccessible. Solutions DO exist: clever workarounds, stacking strategies, and loopholes that students discover through experience. But this "jugaad knowledge" only circulates inside privileged social networks: Greek life, legacy families, established friend groups.

First-gen students, transfer students, international students, and low-income students are systematically excluded from this tribal knowledge. **The information asymmetry is the real inequity.**

### The Berkeley Crisis: Real Data

**Food Insecurity**
- 39% of undergrads and 23% of grad students experience food insecurity
- Roughly 17,000 Berkeley students don't have reliable access to food
- CalFresh eligibility changed April 1, 2026 for non-citizen groups
- The Basic Needs Food Pantry is in the lower level of MLK Student Union — the hackathon venue

**Housing Insecurity**
- 3,300+ students lack stable housing
- 2,400 face both food and housing insecurity simultaneously
- Berkeley has the highest student housing costs of any UC campus

**Mental Health**
- 61% of undergrads say depression and stress is an obstacle to academic success
- Tang Center / CAPS has weeks-long wait times for counseling appointments

**Financial Aid Chaos**
- FAFSA processing paused after April 21, 2026 due to One Big Beautiful Bill Act system updates
- Grad PLUS loans eliminated effective July 1, 2026
- Parent PLUS loans capped at $20K/year, $65K aggregate

**Academic Crisis**
- 35.3% of CS 10 students received F's in Spring 2026 (up from under 10% historically)
- EECS graduating class dropping from 1,029 to ~350
- Student Advisory Council explicitly listed "challenging to find campus resources" as a top issue

---

## What It Does

Jugaad works in three steps:

1. **Listen** — Speak or type your problem. Deepgram captures your voice, Claude understands the context, and a Coordinator Agent routes your request to the right specialists.
2. **Match** — Five specialized agents run in parallel, each searching their domain — food, safety, financial aid, wellness, and academics — drawing from a live Redis knowledge graph and Browserbase web agents browsing Berkeley sites in real time.
3. **Act** — A personalized dashboard surfaces your specific "hack stack": not just what resources exist, but how to stack them, what exemptions you qualify for, and pre-filled applications ready to submit.

**The key differentiator:** Jugaad doesn't just INFORM ("here's the food pantry"). It SOLVES ("here's how to stack CalFresh + food pantry + event food + Market Match to eat well on near-zero budget, and here's your auto-filled CalFresh application").

---

## Features

### Feature 1 — Intake Interview Agent
*Owner: Person 1 (AI / Claude Lead)*

A Claude-powered conversational agent that replaces a cold form. It asks 6–8 natural questions — delivered via voice through Deepgram — to build a complete student profile in under 5 minutes. This profile powers every personalized recommendation downstream.

**Collects:**
- UC campus and enrollment status (full-time, part-time, grad, undergrad)
- EFC / SAI from financial aid letter
- Housing situation — on-campus, off-campus, or unstably housed
- Meal plan status — active, expired, or none
- Citizenship/residency status — determines CalFresh, DACA, and undocumented-specific eligibility
- Current aid received (Pell, Cal Grant, loans)
- Number of dependents

**How it works:**
```
User speaks or types → Deepgram STT transcribes → Claude asks follow-up questions
→ Profile JSON built → Saved to Redis (session) + Supabase (persistent)
→ Profile broadcast to all agents via Coordinator
```

**Tech:** Claude claude-sonnet-4-6, Deepgram STT, FastAPI, Redis, Supabase

---

### Feature 2 — Personalized Resource Dashboard
*Owner: Person 4 (Frontend Lead) + Person 2 (Fetch.ai Lead)*

After intake, the dashboard shows only the resources this specific student qualifies for — not a generic directory. Powered by five specialist agents running in parallel, with results drawn from the Redis knowledge graph and live Browserbase web searches. Ranked by deadline urgency, match confidence, and dollar value.

**Each resource card includes:**
- Resource name and organization
- One-sentence match explanation (why this student qualifies)
- Dollar value or benefit description
- Deadline badge — red if under 7 days, amber if under 30
- Effort level — "5 min online form" vs "appointment required"
- "Apply Now" CTA that generates pre-filled content from the student's profile

**Categories covered:**

| Category | Resources |
|---|---|
| 🍎 Food | CalFresh stacking strategy, campus food pantries, emergency meal swipes, free food calendar, food surplus matching |
| 🏠 Housing | Co-op housing (BSC), emergency bridge housing, lease red-flag scanner, rent control rights |
| 💰 Financial Aid | Special circumstances appeal, emergency micro-grants, fee payment plan, scholarship matches |
| 🛡️ Safety | Real-time walking buddy matching, safe route recommendations, SafeWalk on-demand |
| 🧠 Mental Health | Let's Talk drop-ins, SHIP therapist bypass, urgent CAPS appointments, 24/7 counseling line |
| 📚 Academic | Enrollment strategies, BerkeleyTime pattern analysis, study group matching, prerequisite guidance |

**How it works:**
```
Profile broadcast to Coordinator Agent
→ Coordinator routes to 5 specialist agents
→ Agents query Redis knowledge graph + Browserbase live search
→ Results merged, ranked, and rendered as personalized "hack stacks"
```

**Tech:** Next.js, Tailwind CSS, FastAPI, Redis, Browserbase, Fetch.ai uAgents

---

### Feature 3 — Jugaad Hack Stacks
*Owner: Person 1 (AI / Claude Lead)*

The core value proposition. For each problem domain, Claude doesn't return a single resource — it returns a complete stacking strategy of 3–6 complementary resources that compound together. These hacks are drawn from the crowdsourced knowledge graph and personalized to the student's exact situation.

**Example hack stacks by domain:**

**Food Insecurity Hack Stack:**
- CalFresh ($292/month) + food pantry (weekly, MLK lower level) + Grab N Go recovered meals (free, daily) + club events with free catering (several/week) + Berkeley Student Food Collective (sliding-scale) + Market Match at Saturday farmers market (doubles first $10 CalFresh spend)
- Most students know 1–2 of these. Jugaad gives you all 6 and helps you access each one.

**Housing Hack Stack:**
- BSC co-op (30–50% cheaper than dorms, rolling admissions, most students never hear about it) + summer sublet conversion strategy + rent control rights (apartments pre-1980 have annual caps) + lease red-flag scanner (upload lease, AI flags predatory clauses)

**Financial Aid Hack Stack:**
- Special Circumstances Appeal (recalculates aid based on current income — can add thousands) + emergency short-term loan bridge (covers FAFSA delay) + micro-scholarship scan (hundreds of $500–$2,000 awards with few applicants) + fee payment plan (spreads tuition across semester)

**Mental Health Hack Stack:**
- Let's Talk drop-in (no appointment, no paperwork, multiple campus locations) + SHIP therapist bypass (off-campus providers with same-week availability, no referral) + urgent appointment pathway at CAPS (same-day if you communicate urgency) + 24/7 counseling line: 855-817-5667

**How it works:**
```
User describes problem
→ Claude classifies domain + urgency
→ Redis vector search retrieves relevant hacks
→ Claude assembles personalized stack based on student profile
→ Ranked by impact + effort + deadline
```

**Tech:** Claude claude-sonnet-4-6, Redis vector search, FastAPI

---

### Feature 4 — Multi-Agent Architecture (Fetch.ai + Band)
*Owner: Person 2 (Fetch.ai + Band Lead)*

Five specialized agents registered on Agentverse, coordinated by a Jugaad Coordinator Agent via the Fetch.ai mailbox protocol. Agents also share context through Band rooms, enabling cross-domain intelligence: if the financial aid agent detects aid loss, the food agent proactively surfaces CalFresh hacks.

**The agents:**

| Agent | Responsibility |
|---|---|
| Jugaad Coordinator | Receives user problem, routes to correct specialists, merges and ranks responses |
| Food Agent | CalFresh stacking, food surplus real-time network, free food calendar, pantry hours |
| Financial Aid Agent | Emergency grants, micro-scholarship scan, Special Circumstances appeal, fee plans |
| Safety Agent | Walking buddy matching, safe route recommendation, SafeWalk on-demand, incident data |
| Wellness Agent | Let's Talk finder, SHIP therapist directory browsing, peer support matching |
| Academic Agent | Enrollment strategies, study group matching, BerkeleyTime data, prerequisite checks |

**Cross-domain intelligence (Band):**
```
Financial aid loss detected
→ Food Agent proactively surfaces CalFresh + food pantry hacks
→ Wellness Agent flags mental health resources for financial stress
→ Academic Agent checks for registration holds tied to outstanding balance
```

**Demo flow:**
```
User: "I need help paying for food."
→ Coordinator receives message via Fetch.ai mailbox
→ Routes to: Food Agent + Financial Aid Agent (parallel)
→ Both query Redis knowledge graph + Browserbase live search
→ Band room shares context: Financial Agent finding aid triggers Food Agent supplement
→ Returns: Complete personalized food survival plan
```

**Tech:** Fetch.ai uAgents SDK, Agentverse, Band platform, Python asyncio

> All agents have real addresses on Agentverse, verifiable by judges during demo.

---

### Feature 5 — Voice Interface (Deepgram)
*Owner: Person 4 (Frontend Lead)*

Voice is the primary interface, not a bolt-on. Many students in crisis are multitasking, visually impaired, or in situations where typing is impractical. Deepgram STT captures voice input; Deepgram TTS delivers responses back as natural speech. The entire intake-to-dashboard flow works hands-free.

**Components:**

| Component | Description |
|---|---|
| Push-to-talk button | Large, accessible mic button — the primary entry point on the voice chat page |
| Live transcript | Real-time display of what Deepgram is transcribing as the user speaks |
| Agent activity feed | Shows which agents are active, what they're querying, results coming in live |
| Voice response playback | Claude's response synthesized and played back via Deepgram TTS |

**Demo flow:**
```
User presses mic button
Speaks: "I can't afford food this week."
→ Deepgram STT transcribes in real time
→ Agents activate (visible in activity feed)
→ Resource dashboard populates
→ Deepgram TTS: "You likely qualify for CalFresh. I've pre-filled your application. The food pantry one floor below us is open Friday at 2pm..."
```

**Tech:** Deepgram STT + TTS SDK, Next.js, React

---

### Feature 6 — Redis Knowledge Graph + Memory
*Owner: Person 3 (Data Lead)*

The intelligence and memory backbone. Redis stores student sessions so they never re-answer the same questions. A vector-indexed knowledge graph encodes all jugaad hacks, eligibility rules, and resource relationships — enabling semantic search so Claude finds the right hack even when the user's phrasing doesn't match keywords.

**Components:**

| Component | Description |
|---|---|
| User memory | Student profile persists across sessions — no re-onboarding on return visits |
| Session memory | Multi-turn conversation context stored per session for Claude |
| Knowledge graph | Graph of jugaad hacks, resources, eligibility rules, and relationships between them |
| Vector search | Semantic matching — "I have no money for food" finds CalFresh, pantry, and stacking hacks |
| Semantic cache | Common queries ("how do I get CalFresh?") skip LLM re-processing — sub-100ms response |
| Real-time data | Food surplus postings, walking buddy queue, open time slots |

**Knowledge graph seeded with (from Section 5 hacks):**
- All food insecurity hack stacks (CalFresh exemptions, stacking strategies, surplus network)
- All housing hacks (BSC co-op, rent control, lease scanner, summer sublet conversion)
- All mental health hacks (Let's Talk schedule, SHIP provider bypass, urgent appointment pathway)
- All financial aid hacks (Special Circumstances appeal, micro-scholarships, emergency loans)
- All safety hacks (walking buddy algorithm, safe routes, SafeWalk request flow)
- All academic hacks (enrollment strategies, BerkeleyTime patterns, study group matching)

**Tech:** Redis Cloud, Redis vector search, Python embeddings

---

### Feature 7 — Browserbase Live Web Agents
*Owner: Person 3 (Data Lead)*

Four web-browsing agents that crawl Berkeley websites in real time, ensuring resource data is always current — not stale from a seed database. Live results are visible in the UI during demo.

**Agents:**

| Agent | Sites browsed |
|---|---|
| Scholarship finder | financialaid.berkeley.edu, department pages, scholarship boards |
| Food resource finder | basicneeds.berkeley.edu, food pantry pages, CalFresh eligibility updates |
| Housing resource finder | housing.berkeley.edu, BSC pages, Basic Needs emergency housing |
| Wellness resource finder | uhs.berkeley.edu/counseling, SHIP provider directories, Let's Talk schedule |

**Demo moment:**
```
User: "Find me scholarships I can apply for this week."
→ Browserbase searches Berkeley financial aid pages live
→ Returns: Current opportunities with real deadlines
→ Results cached in Redis for next similar query
```

**Tech:** Browserbase SDK, Stagehand, Python, FastAPI

---

### Feature 8 — Deadline Alert Engine
*Owner: Person 1 (AI / Claude Lead)*

Students miss aid because they didn't know about a deadline, not because they chose not to apply. Proactive alerts fire at 30 days, 7 days, and 48 hours before each relevant deadline — based on the student's profile and the resources they've been matched with.

**Tracks:**
- FAFSA priority deadlines per campus
- Special Circumstances appeal windows
- CalFresh recertification deadlines (every 6–12 months)
- Scholarship deadlines matched to student profile
- Emergency grant application windows (quarterly)
- Fee deferral request windows (per semester)

**Alert channels:**
- In-app notification with one-click "start application"
- Email digest (weekly upcoming deadlines)
- SMS via Twilio for students who check email infrequently

**Tech:** Supabase scheduled functions, Resend (email), Twilio (SMS)

---

### Feature 9 — Personalized Intake Interview Agent *(preserved)*
*See Feature 1 above — this is the same agent, preserved from original spec.*

---

### Feature 10 — Berkeley Problem Map
*Owner: Person 4 (Frontend Lead)*

A live crowdsourced visualization of student struggles across campus. Students anonymously report what they're struggling with; Jugaad aggregates into a real-time crisis dashboard. Useful for individual students navigating the city — and as an advocacy data tool for student government and administrators.

**What it shows:**
- Food insecurity density by neighborhood
- Safety incident clusters by time of day
- Financial aid anxiety spikes (e.g., post-FAFSA pause)
- Mental health demand vs. CAPS capacity
- Resource gaps — areas with problems but no nearby resources

**Tech:** Next.js, Recharts or D3.js, Supabase real-time, Mapbox

---

### Feature 11 — LLM Observability + Reliability (Arize + Sentry)
*Owner: Person 4 (Multi-Agent + Reliability Lead)*

In a platform that students depend on for critical information — food access, housing, financial aid — hallucinations and errors are unacceptable. Every Claude call is instrumented through Arize for trace monitoring. Sentry is integrated from the first commit for error monitoring and crash reporting.

**Arize:**
- Every Claude API call logged with input, output, and agent context
- Traces show full agent reasoning chains
- Used during the hackathon to identify and fix prompt issues in real time
- Demo moment: show Arize dashboard with traces proving output quality improved

**Sentry:**
- Error monitoring across all agents and API calls
- Performance monitoring for voice pipeline latency
- Crash reporting with full context

**Tech:** Arize SDK, Sentry SDK, FastAPI middleware

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 + Tailwind CSS | UI, dashboard, Problem Map |
| Voice | Deepgram STT + TTS | Voice-first conversational interface |
| AI Brain | Claude claude-sonnet-4-6 (Anthropic SDK) | Reasoning, hack selection, personalization |
| Build Tool | Claude Code | Building the entire project (Anthropic prize requirement) |
| Knowledge Store | Redis (vector search) | Jugaad knowledge graph, RAG pipeline |
| Caching | Redis (semantic cache) | Skip redundant LLM calls for repeated queries |
| Memory | Redis | Student session context, conversation history |
| Real-time Data | Redis | Food surplus postings, walking buddy queue |
| Web Intelligence | Browserbase + Stagehand | Live Berkeley website browsing agents |
| Multi-Agent | Fetch.ai uAgents + Agentverse | Distributed specialist agents |
| Agent Coordination | Band | Cross-agent context sharing and messaging |
| Observability | Arize | LLM trace logging and quality monitoring |
| Reliability | Sentry | Error monitoring from day one |
| Database | Supabase | Persistent profiles, deadline schedules |
| SMS | Twilio | Deadline alert fallback for low-connectivity users |
| Email | Resend | Weekly deadline digest |
| Deployment | Vercel (frontend) + Railway (FastAPI) | Sub-5-minute deploys |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    VOICE + CHAT INTERFACE                       │
│              Deepgram STT/TTS + Next.js UI                      │
│                                                                 │
│  ┌────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
│  │  Voice     │   │  Agent Activity  │   │  Berkeley         │  │
│  │  Chat      │   │  Feed            │   │  Problem Map      │  │
│  │  Panel     │   │                  │   │  Dashboard        │  │
│  └────────────┘   └──────────────────┘   └───────────────────┘  │
└───────────────────────────┬────────────────────────────────────┘
                            │
               ┌────────────▼────────────┐
               │      ORCHESTRATOR        │
               │      Claude API          │
               │  classify → route →      │
               │  select jugaads →        │
               │  generate hack stack     │
               └────────────┬────────────┘
                            │
        ┌──────────┬─────────┼──────────┬──────────┐
        │          │         │          │          │
   ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌──▼──────┐
   │  FOOD  │ │ SAFETY │ │  AID   │ │WELLNESS│ │ ACADEMIC│
   │ AGENT  │ │ AGENT  │ │ AGENT  │ │ AGENT  │ │  AGENT  │
   └────┬───┘ └────┬───┘ └───┬────┘ └───┬────┘ └──┬──────┘
        └──────────┴─────────┼──────────┴──────────┘
                             │ Fetch.ai Agentverse + Band rooms
              ┌──────────────▼──────────────────┐
              │           SHARED SERVICES         │
              │                                   │
              │  Redis:                            │
              │    Jugaad Knowledge Graph          │
              │    Vector search (RAG)             │
              │    Semantic caching                │
              │    Student session memory          │
              │    Food surplus real-time DB       │
              │    Walking buddy queue             │
              │                                   │
              │  Browserbase: Live Berkeley crawl  │
              │  Arize: LLM observability traces   │
              │  Sentry: Error monitoring          │
              └───────────────────────────────────┘
```

---

## Team Split & Assignments

Each person owns one vertical end-to-end. All four tracks must be demo-ready independently, then integrated in the final hour.

---

### Person 1 — AI / Claude Lead
**Goal: Win Anthropic + Best Golden Bear Hack**

**Setup:**
- [ ] Install Anthropic SDK (`pip install anthropic`)
- [ ] Test Claude claude-sonnet-4-6 API connection
- [ ] Design system prompt architecture (master prompt + domain-specific sub-prompts)
- [ ] Set up Arize instrumentation on all Claude calls

**Build:**

| Component | Description |
|---|---|
| Main orchestrator prompt | Master system prompt defining Jugaad's persona — empathetic, practical, never preachy |
| Intake interview agent | Conversational 6–8 question flow to build student profile |
| Food hack selection logic | Matches profile to food stacking strategy, explains CalFresh exemptions in plain language |
| Housing hack logic | Assesses urgency, identifies BSC eligibility, flags rent control rights, generates appeal letters |
| Financial aid logic | Special Circumstances appeal guidance, micro-scholarship matching, emergency loan awareness |
| Safety hack logic | Assesses situation, routes to walking buddy or SafeWalk depending on urgency |
| Wellness hack logic | Finds Let's Talk schedule, identifies SHIP therapist bypass eligibility |
| Academic hack logic | Enrollment strategy, prerequisite soft/hard checker, study group matching |

**Features to own:**

| Feature | What to build |
|---|---|
| Personalized hack stacks | 3–6 resource stacking strategy tailored to exact student situation |
| First 30 Days Checklist | Auto-generated action plan: what to apply for and when, in chronological order |
| CalFresh eligibility checker | Conversational flow through each student exemption, pre-fills intake summary |
| Deadline Alert Engine | Proactive alerts at 30 days / 7 days / 48 hours for matched resources |
| "Apply Now" content generation | Pre-filled personal statements, appeal letters, scholarship paragraphs from student profile |

**Deliverables:**
- [ ] Intake interview working end-to-end (voice in → profile built)
- [ ] All domain hack selection logic returning personalized results
- [ ] "Apply Now" generates real pre-filled content from student profile
- [ ] Arize traces on every Claude call, dashboard accessible during demo

**Sponsor targets:** Anthropic · Best Golden Bear Hack · Ddoski's World Grand Prize

---

### Person 2 — Fetch.ai + Band Multi-Agent Lead
**Goal: Win Fetch.ai + Band**

**Setup:**
- [ ] Attend Fetch.ai workshop at hackathon
- [ ] Install Fetch.ai uAgents SDK (`pip install uagents`)
- [ ] Create Agentverse account at agentverse.ai
- [ ] Register all agents and make them discoverable
- [ ] Set up Band account and create shared agent rooms

**Agents to build:**

| Agent | Responsibility |
|---|---|
| Jugaad Coordinator | Receives problem from Claude, routes to specialist agents, merges responses |
| Food Agent | CalFresh stacking, food surplus network, pantry data, free food calendar |
| Financial Aid Agent | Emergency grants, micro-scholarship data, fee plans, Special Circumstances |
| Safety Agent | Walking buddy matching, safe route data, SafeWalk request flow |
| Wellness Agent | Let's Talk schedule, SHIP provider directory, peer support matching |
| Academic Agent | BerkeleyTime data, enrollment strategies, study group formation |

**Band integration:**
- Create shared Band rooms for agent coordination
- Implement cross-domain triggers: financial stress → food hacks proactively surfaced
- Academic struggle → wellness agent offers mental health resources
- Minimum: 3 agents sharing context through Band during demo

**Deliverables:**
- [ ] All 6 agents registered with real addresses on Agentverse
- [ ] Agent-to-agent communication via Fetch.ai mailbox protocol working
- [ ] Coordinator correctly routes to relevant agents based on user problem
- [ ] Band rooms active with at least 3 agents sharing context
- [ ] Demo showing agents collaborating on one query — Agentverse dashboard visible

**Sponsor targets:** Fetch.ai · Band · Most Technical Hack

---

### Person 3 — Data + Web Agents Lead
**Goal: Win Browserbase + Redis**

**Setup:**
- [ ] Spin up Redis Cloud instance (free tier)
- [ ] Set up Browserbase account and test a scrape
- [ ] Design knowledge graph schema (hack types, resource types, eligibility rules, relationships)

**Redis — build:**

| Component | Description |
|---|---|
| User memory | Student profile persists across sessions via Redis hash |
| Session memory | Multi-turn Claude context stored per session ID |
| Knowledge graph | All jugaad hacks from Section 5 indexed as vector embeddings |
| Vector search | Semantic retrieval — user phrasing maps to relevant hacks |
| Semantic cache | Repeated similar queries return cached responses |
| Real-time structures | Food surplus postings (sorted set by timestamp), walking buddy queue |

**Browserbase agents — build:**

| Agent | What it searches |
|---|---|
| Scholarship finder | financialaid.berkeley.edu, department scholarship pages |
| Food resource finder | basicneeds.berkeley.edu, pantry hours, CalFresh eligibility updates |
| Wellness resource finder | uhs.berkeley.edu/counseling, SHIP provider directories |
| Housing resource finder | housing.berkeley.edu, BSC pages, Basic Needs emergency housing |

**Knowledge base to populate (from the hack stacks in this doc):**
- All food insecurity hacks (CalFresh exemptions, stacking strategy, surplus network)
- All housing hacks (BSC co-op, rent control, lease scanner, sublet conversion)
- All financial aid hacks (Special Circumstances, micro-scholarships, emergency loans)
- All mental health hacks (Let's Talk, SHIP bypass, urgent CAPS, 24/7 line)
- All safety hacks (walking buddy, safe routes, SafeWalk)
- All academic hacks (enrollment strategy, BerkeleyTime, study groups)

**Deliverables:**
- [ ] Redis connected with user profiles persisting across sessions
- [ ] Knowledge graph with 30+ hacks indexed as vector embeddings
- [ ] At least 2 Browserbase agents returning live Berkeley results during demo
- [ ] Semantic cache demonstrably reducing latency on repeated queries

**Sponsor targets:** Browserbase · Redis · Most Technical Hack

---

### Person 4 — Frontend + Voice + Demo Lead
**Goal: Win Deepgram + Best UI/UX**

**Setup:**
- [ ] Initialize Next.js 14 project with Tailwind CSS
- [ ] Set up Deepgram account and test STT + TTS
- [ ] Set up Sentry SDK from first commit (required for Sentry prize)
- [ ] Create Vercel project for instant deploys

**Pages to build:**

| Page | What it contains |
|---|---|
| Landing page | Hero with real crisis statistics, one-line value prop, "Get Started" and "Speak Your Problem" CTAs |
| Voice chat page | Push-to-talk mic button, live transcript, agent activity feed, Deepgram TTS playback |
| Resource dashboard | Personalized hack stack cards ranked by urgency, "Apply Now" buttons |
| Berkeley Problem Map | Interactive map with color-coded resource pins and real-time crisis data |
| Agent activity feed | Real-time ticker of agent actions as they happen |

**Deepgram — build:**

| Feature | Description |
|---|---|
| Speech-to-Text | Push-to-talk voice capture, transcribed live to text for Claude |
| Text-to-Speech | Claude + agent responses synthesized and played back naturally |
| Push-to-talk button | Large, accessible mic button — primary entry point on voice chat page |
| Live transcript display | Shows what's being transcribed in real time |

**Visual components:**

| Component | Description |
|---|---|
| Agent status indicators | Per-agent badges: idle → thinking → responding, visible during every query |
| Real-time action ticker | "Food Agent searching basicneeds.berkeley.edu..." updating live |
| Problem Map | D3.js or Recharts map of Berkeley with color-coded issue density and resource pins |
| User profile panel | Sidebar showing student's profile summary and matched resource count |
| Impact counter | Landing page metrics: students helped, total aid surfaced, resources monitored |

**Sentry integration:**
- [ ] Sentry SDK in from first commit
- [ ] Error boundaries on all major components
- [ ] Performance monitoring on voice pipeline latency

**Demo day extras:**
- [ ] Devpost screenshots — every major screen captured before 11am Sunday
- [ ] Demo video — 90-second screen recording of full voice flow
- [ ] Pitch slides — 5 slides: problem, solution, demo, tech, impact
- [ ] Own the live demo at judging — practice 5+ times before 1pm

**Deliverables:**
- [ ] All 5 pages built and navigable
- [ ] Voice flow working end-to-end: speak → agents activate → spoken response
- [ ] Agent activity feed updating in real time during a query
- [ ] App deployed to Vercel with shareable URL before 11am Sunday

**Sponsor targets:** Deepgram · Best UI/UX · Hacker's Choice · Sentry

---

## Sponsor Prize Map

| Sponsor / Prize | Owner | Key Demo Moment |
|---|---|---|
| Anthropic | Person 1 | Pre-filled personal statement generated from student profile in real time |
| Fetch.ai | Person 2 | Agentverse dashboard showing 3+ agents with real addresses collaborating |
| Band | Person 2 | Cross-domain trigger: financial stress proactively surfaces food hacks |
| Redis | Person 3 | Session memory persists across page refresh; vector search demo |
| Browserbase | Person 3 | Live scholarship search returning current Berkeley results, visible in UI |
| Deepgram | Person 4 | Full voice flow: speak → agents activate → spoken response plays back |
| Sentry | Person 4 | Sentry dashboard showing live error monitoring from first commit |
| Arize | Person 1 | Arize trace dashboard showing Claude reasoning chain + quality improvements |
| Best UI/UX | Person 4 | Agent activity feed + Problem Map + voice-first accessible design |
| Most Technical | Persons 2 + 3 | Multi-agent + vector search + live Browserbase + Band coordination |
| Best Golden Bear Hack | Person 1 | Depth of Berkeley-specific hack stacks and CalFresh eligibility logic |
| Hacker's Choice | Person 4 | Voice-first demo, emotional impact, overall polish |
| Ddoski's World Grand Prize | All | End-to-end equity story: tribal knowledge democratized for first-gen students |
| SkyDeck Grand Prize | All | Startup potential — every university has this problem |

**Estimated total prize value: $15,000+ cash/credits + hardware**

---

## Demo Script (3-Minute Stage Presentation)

### Opening (30 seconds)
"39% of Berkeley undergrads are food insecure. That's 17,000 students. Three thousand three hundred don't have stable housing. FAFSA processing is literally paused right now. And the food pantry that serves these students? It's one floor below us in this building.

Resources exist. But they're scattered, confusing, and the hacks that actually work — the stacking strategies, the loopholes, the workarounds — only travel through word of mouth. If you have the right friends, you know them. If you don't, you don't.

Jugaad is a Hindi word for the creative hack you use when the system doesn't work for you. We built Jugaad to make sure every student gets the hack — not just the connected ones."

### Live Demo 1 — Food Insecurity (60 seconds)
*[Press mic button, speak live]*
"Hey Jugaad — I'm a sophomore, I can barely afford groceries, and I didn't think I qualified for any help."

*[Screen: Claude processing → Food Agent + Financial Aid Agent activating → Browserbase browsing basicneeds.berkeley.edu → Redis pulling CalFresh stacking hacks]*

*[Deepgram TTS response]*
"Actually, you likely qualify for CalFresh — $292 a month for groceries. Since you're enrolled at least half-time and your income is under the threshold, you meet the student exemption. I've pre-filled your CalFresh application. Meanwhile, the food pantry in the lower level of MLK has the shortest lines Friday afternoons. This week there are 4 campus events with free catering. And if you use CalFresh at the Saturday farmers market, Market Match doubles your first $10. Stack all of these and you'll eat well."

*[Point downstairs]* "That food pantry is literally one floor below us right now."

### Live Demo 2 — Safety (30 seconds)
*[Speak live]*
"I need to walk from Main Stacks to Unit 2 and it's late."

*[Safety Agent activates → walking buddy algorithm runs → route analyzer runs]*

"Two other students are leaving Stacks in the next 8 minutes heading to Southside. Group formed. I'm also suggesting the Oxford Street route — 3 minutes longer, better lighting, zero incidents this month."

### Live Demo 3 — Berkeley Problem Map (30 seconds)
*[Show dashboard]*
"This is the Berkeley Problem Map. Students report what they're struggling with anonymously, and Jugaad aggregates it in real time. Right now you can see food insecurity concentrated south of campus, safety concerns peaking after 10pm on Telegraph, and financial aid anxiety spiking across all demographics since the FAFSA pause. This isn't just a tool for individuals — it's data for systemic change."

### Close (30 seconds)
"Jugaad doesn't just tell students about resources. It gives them the hack. It auto-fills their CalFresh application. It matches them with a walking buddy. It finds the therapist with an opening this week. It stacks every resource into a personalized survival strategy.

17,000 students can't afford food. We're not going to solve that with a chatbot. We're going to solve it with jugaad."

---

## Hour-by-Hour Build Plan

| Hours | Time | Work |
|---|---|---|
| 0–2 | ~12pm–2pm Sat | Repo init with Claude Code · install all SDKs · "hello world" each integration · Person 3 starts populating Redis with hacks |
| 2–6 | 2pm–6pm Sat | Person 1: core Claude pipeline working · Person 2: Deepgram voice + basic UI · Person 3: Redis vector store + Browserbase · Person 4: Band multi-agent skeleton + Sentry |
| 6–8 | 6pm–8pm Sat | Dinner · first end-to-end test: speak a problem → get hack stack response via voice |
| 8–12 | 8pm–12am Sat | Person 1: all 5 agent prompts + CalFresh logic · Person 2: full UI + agent feed · Person 3: Browserbase live crawl + RAG working · Person 4: cross-domain Band triggers + Arize |
| 12–14 | 12am–2am Sat | Integration testing · fix end-to-end bugs · **Devpost draft must be up by midnight** |
| 14–18 | 2am–6am Sat | Sleep in shifts (2–3 hrs each) OR continue: polish UI, add more hacks to knowledge base |
| 18–20 | 6am–8am Sun | Wake up · assess status · breakfast |
| 20–22 | 8am–10am Sun | Final integration + polish · Berkeley Problem Map · run demo flow 5+ times |
| 22–23 | 10am–11am Sun | **Submit Devpost by 11am (hard deadline)** · screenshots · demo video |
| 23–24 | 11am–12pm Sun | Final Devpost edits (extended deadline) · practice pitch |
| — | 1pm–3pm Sun | **Judging** — all members at table, demo ready, pitch rehearsed |
| — | ~3:15pm Sun | Top 10 notification via phone call |
| — | 4pm Sun | Closing Ceremony, Wheeler Auditorium |

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/nergisRahimzade/jugaad.git
cd jugaad

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

**Environment variables required:**
```
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
REDIS_URL=
BROWSERBASE_API_KEY=
FETCH_AI_AGENT_KEY=
BAND_API_KEY=
ARIZE_API_KEY=
SENTRY_DSN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=
```

---

## Berkeley Resources in Knowledge Base

| Resource | URL |
|---|---|
| Basic Needs Center | basicneeds.berkeley.edu |
| CalFresh FAQ | basicneeds.berkeley.edu/faq/calfresh |
| Food Pantry | basicneeds.berkeley.edu/pantry |
| Financial Aid | financialaid.berkeley.edu |
| Federal Aid Updates | financialaid.berkeley.edu/apply-now/apply-for-aid/federal-updates/ |
| CAPS Counseling | uhs.berkeley.edu/counseling |
| BerkeleyTime | berkeleytime.com |
| Class Schedule | classes.berkeley.edu |
| Campus Safety | ucpd.berkeley.edu |
| BSC Co-ops | bsc.coop |
| Berkeley Rent Board | rent.berkeleyca.gov |

---

## Hackathon Logistics

- **Check-in:** 9am Saturday, second floor entrance from Sproul Plaza
- **Opening Ceremony:** 10am, Wheeler Auditorium
- **Devpost draft:** Must be up by midnight Saturday
- **Devpost final:** Submit by 11am Sunday, edits until 12pm
- **Judging:** 1pm–3pm Sunday — all team members at table
- **Top 10 notification:** ~3:15pm Sunday via phone call
- **Closing Ceremony:** 4pm Sunday, Wheeler Auditorium

**Emergency info:** Urgent emergency: 911 · Nearest hospital: Alta Bates Summit, 2001 Dwight Way · Hackathon help: #0-ask-directors on Slack · 24/7 director desk: 2nd floor across from Goldie's

---

## Team — Jugaad

> *Jugaad (जुगाड़): a Hindi word for a flexible, frugal, improvised solution born in communities that had to survive despite broken systems. At Berkeley, 17,000 students need jugaad.*

Built at UC Berkeley AI Hackathon 2026 · Ddoski's World track · [live.hackberkeley.org](https://live.hackberkeley.org)

---

## Impact

> The Berkeley Student Advisory Council for Financial Aid explicitly recommended an AI chatbot for campus systems. Jugaad is what they asked for — built in 24 hours, by students who understand the problem from the inside.

> 700,000+ UC students enrolled system-wide. 230,000+ experiencing food or housing insecurity. Every university has this problem. Berkeley is where we start.
