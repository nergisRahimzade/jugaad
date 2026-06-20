# BearBasics 🐻
 
> **Your personal financial advocate — food, housing, and aid for every UC student.**
 
BearBasics is an AI-powered resource navigator built for UC students experiencing food insecurity, housing instability, or financial hardship. Rather than dumping a generic list of links, BearBasics learns your specific situation and surfaces exactly what you qualify for — then helps you apply.
 
Built at **UC Berkeley AI Hackathon 2026** by team **Jugaad** (700+ projects, 1300+ participants).
 
---
 
## The Problem
 
**1 in 3 UC students experiences food insecurity.** Most don't know what aid they qualify for, miss deadlines, or feel too ashamed to ask. Existing resource pages are generic, outdated, and overwhelming. BearBasics changes that.
 
---
 
## What It Does
 
BearBasics is a three-step loop:
 
1. **Learn** — A conversational AI agent interviews you in under 5 minutes, learning your campus, income, housing status, and aid history.
2. **Match** — Three specialized Fetch.ai agents run in parallel to surface every food, housing, and financial aid resource you personally qualify for — ranked by urgency and value.
3. **Act** — For each resource, a one-click "Apply Now" generates pre-filled applications, personal statements, and step-by-step action plans using your real profile data.
---
 
## Features
 
### Tier 1 — Core Demo
 
#### 1. Intake Interview Agent
A Claude-powered conversational agent that replaces a cold form. It asks 6–8 natural questions to build a complete student profile in under 5 minutes.
 
**Collects:**
- UC campus (Berkeley, UCLA, Davis, etc.)
- Enrollment status — full-time, part-time, grad, undergrad
- EFC / SAI from financial aid letter
- Housing situation — on-campus, off-campus, or unstably housed
- Meal plan status — active, expired, or none
- Citizenship/residency status — affects CalFresh, DACA, undocumented-specific programs
- Current aid received (Pell, Cal Grant, loans)
- Number of dependents
**How it works:**
```
User opens app → Claude asks questions conversationally
→ Profile JSON saved to Supabase → Profile passed to all downstream agents
```
 
**Tech:** Claude claude-sonnet-4-6, FastAPI, Supabase
 
---
 
#### 2. Personalized Resource Dashboard
After intake, shows only the resources this specific student qualifies for — not a generic directory. Powered by three Fetch.ai agents running in parallel. Results are ranked by deadline urgency, match confidence, and dollar value.
 
**Each resource card includes:**
- Resource name and organization
- One-sentence match explanation (why this student qualifies)
- Dollar value or benefit description
- Deadline badge — red if under 7 days, amber if under 30
- Effort level — "5 min online form" vs "appointment required"
- "Apply Now" CTA
**Categories covered:**
 
| Category | Resources |
|---|---|
| 🍎 Food | Campus food pantries, CalFresh (SNAP), dining hall sliding scale, emergency meal swipes, community fridge locations |
| 🏠 Housing | Basic Needs emergency housing, FAFSA housing allowance appeals, off-campus sublease boards, rapid rehousing programs |
| 💰 Financial Aid | Emergency grants ($500–$1,000), Pell Grant status check, scholarship matcher by major/status, FAFSA appeal guidance, fee deferral programs |
 
**How it works:**
```
Profile JSON → 3 Fetch.ai agents run in parallel
→ Results scored + ranked → Dashboard renders
```
 
**Tech:** Fetch.ai uAgents, Next.js, Supabase, Tailwind CSS
 
---
 
#### 3. "Apply Now" Action Layer
The highest-impact feature. Clicking "Apply Now" doesn't just open a link — it uses the student's profile to pre-fill forms, generate cover letters, and create step-by-step action plans.
 
**Per resource type:**
 
| Resource | What gets generated |
|---|---|
| CalFresh | Pre-filled BenefitsCal intake + 1-page student eligibility summary |
| Emergency Grant | First-person personal statement pre-written from their profile |
| Food Pantry | Hours, map pin, bus route from campus, required ID |
| Housing | Auto-drafted FAFSA housing cost appeal letter with real numbers |
| Scholarships | Tailored 150-word application paragraph per scholarship |
 
**Tech:** Claude claude-sonnet-4-6, FastAPI
 
---
 
### Tier 2 — Differentiators
 
#### 4. Fetch.ai Multi-Agent Pipeline
Three autonomous uAgents on the Agentverse network, each specialized for one domain, running concurrently via the Fetch.ai mailbox protocol.
 
**The three agents:**
- **FoodAgent** — queries campus dining relief, local food bank data, checks CalFresh income eligibility thresholds against student EFC
- **HousingAgent** — checks Basic Needs Center waitlist status, queries emergency housing boards, calculates FAFSA housing cost-of-attendance gap
- **AidAgent** — matches scholarships by major/status/campus, surfaces emergency micro-grants, checks Pell/Cal Grant eligibility, identifies unclaimed aid
**How it works:**
```
Profile broadcast to all 3 agents
→ Agents run in parallel on Agentverse
→ Results collected via mailbox protocol
→ Merged + ranked by FastAPI
```
 
**Tech:** Fetch.ai uAgents SDK, Agentverse, Python asyncio
 
> Fetch.ai agents have real addresses on Agentverse, verifiable by judges.
 
---
 
#### 5. Cognition Self-Healing Data Layer
Resource databases go stale. Food pantry hours change. Emergency fund deadlines pass. Cognition's agent autonomously monitors resource URLs, detects outdated data, and regenerates scrapers — without human intervention.
 
**What it does:**
- Monitors all resource URLs on a 6-hour cron
- Detects 404s, changed page structures, or outdated hours/deadlines
- Autonomously writes an updated scraper or pulls fresh structured data
- Logs a "data freshness" score in the admin view
- Sends a Slack/email alert if a critical resource goes offline
**Tech:** Cognition API, Python cron, Supabase
 
> Logs show autonomous re-scraping with timestamps — verifiable in demo.
 
---
 
#### 6. Deadline Alert Engine
Students miss aid because they didn't know about a deadline, not because they chose not to apply. Proactive alerts fire at 30 days, 7 days, and 48 hours before each relevant deadline.
 
**Tracks:**
- FAFSA priority deadline per campus
- Emergency grant application windows (quarterly)
- CalFresh recertification deadlines (every 6–12 months)
- Scholarship deadlines matched to student profile
- Fee deferral request windows (per-semester)
**Alert channels:**
- In-app notification with one-click "start application"
- Email digest (weekly upcoming deadlines summary)
- SMS via Twilio — for students who check email infrequently
**Tech:** Supabase scheduled functions, Resend (email), Twilio (SMS)
 
---
 
### Tier 3 — Polish & Story
 
#### 7. Peer Navigator Chat
Many students don't use food pantries because they feel ashamed. This anonymous, judgment-free chat answers both the emotional and practical sides of questions about financial hardship. Tone is a knowledgeable, non-judgmental peer — not a customer service bot.
 
**Example questions it handles:**
- "Is it embarrassing to use the food pantry? Will people see me?"
- "I'm undocumented — am I eligible for any of these programs?"
- "My EFC is $0 but I still can't afford rent. What can I do?"
- "How do I write an appeal letter for more financial aid?"
**System prompt approach:** Acknowledge the emotional reality first → normalize ("1 in 3 UC students experiences this") → give specific actionable steps. Never lecture. Always end with one concrete next action.
 
**Tech:** Claude claude-sonnet-4-6 (streaming API)
 
---
 
#### 8. Impact Counter
A live metrics display on the landing page showing real-time impact. Signals scale thinking to judges and future stakeholders.
 
**Metrics:**
- Students onboarded (live count from Supabase)
- Total aid surfaced in dollars (aggregate across all users)
- Applications assisted (Apply Now click-throughs)
- Resources monitored across UC campuses
**Tech:** Supabase real-time, Next.js
 
---
 
#### 9. SMS Fallback
Students with poor campus WiFi, older phones, or limited data shouldn't be excluded. A Twilio-powered SMS endpoint lets any student text a number, answer 3 quick questions, and receive their top 3 resources as a text message.
 
**Flow:**
```
Text "START" to (510) XXX-XXXX
→ Bot asks: campus, housing situation, EFC tier
→ Returns top 3 resources with direct links
```
 
**Tech:** Twilio, FastAPI webhook, Claude claude-sonnet-4-6
 
---
 
## Tech Stack
 
| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 + Tailwind CSS | Fast to build, polished output |
| AI — Core | Claude claude-sonnet-4-6 | Intake, recommendations, peer chat, Apply Now generation |
| AI — Agents | Fetch.ai uAgents + Agentverse | True multi-agent parallel resource fetching |
| AI — Ops | Cognition | Autonomous self-healing data maintenance |
| Backend | FastAPI (Python) | Plays natively with Fetch.ai Python SDK |
| Database | Supabase (Postgres) | Instant auth + real-time + scheduled functions |
| SMS | Twilio | Accessible fallback for low-connectivity users |
| Email | Resend | Deadline alert digests |
| Deployment | Vercel (frontend) + Railway (FastAPI) | Sub-5-minute deploys |
 
---
 
## Architecture
 
```
┌─────────────────────────────────────────────────────────┐
│                      Next.js Frontend                    │
│         Intake UI · Dashboard · Apply Now · Chat         │
└───────────────────────┬─────────────────────────────────┘
                        │ REST
┌───────────────────────▼─────────────────────────────────┐
│                     FastAPI Backend                      │
│          Profile router · Agent orchestrator             │
└──────┬──────────────┬──────────────────┬────────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐  ┌───────▼──────┐
│  Claude API │ │ Fetch.ai   │  │  Supabase    │
│  Intake +   │ │ Agentverse │  │  Profiles +  │
│  Apply Now  │ │ 3 Agents   │  │  Resources   │
└─────────────┘ └─────┬──────┘  └──────────────┘
                      │
         ┌────────────┼────────────┐
    ┌────▼────┐ ┌─────▼────┐ ┌────▼─────┐
    │  Food   │ │ Housing  │ │   Aid    │
    │  Agent  │ │  Agent   │ │  Agent   │
    └─────────┘ └──────────┘ └──────────┘
```
 
---
 
## Data Strategy
 
Resource data is seeded as structured JSON (30–40 verified UC Berkeley + UCLA resources) and augmented at runtime by Fetch.ai agents. Cognition monitors for staleness every 6 hours.
 
**Why hardcoded seed data?**
Live scraping at 3am during a hackathon is a liability. A solid, verified seed JSON ensures the demo never fails. Agents augment and refresh this data — they don't replace it.
 
**Seed data includes:**
- UC Berkeley Basic Needs Center (hours, services, eligibility)
- UC Berkeley Food Pantry
- CalFresh income thresholds by household size
- FAFSA priority deadlines per UC campus
- Emergency grant programs at Berkeley + UCLA
- Community fridges within 1 mile of campus
---
 
## Demo Script (2 minutes)
 
| Time | What happens |
|---|---|
| 0:00–0:15 | Open with the problem — "1 in 3 UC students faces food insecurity. Most don't know what they qualify for." |
| 0:15–0:45 | Run intake interview live with pre-built profile: Maria, UC Berkeley junior, EFC $0, off-campus, no meal plan |
| 0:45–1:15 | Dashboard populates — point out 3 Fetch.ai agents ran in parallel. Show Agentverse panel. |
| 1:15–1:35 | Click "Apply Now" for emergency grant — personal statement generates in 3 seconds, pre-written in first person |
| 1:35–1:50 | Show Cognition self-healing log — "At 2am, a resource page changed. Cognition detected and re-scraped it automatically." |
| 1:50–2:00 | Close — "We're not building a resource list. We're building every low-income UC student's financial advocate." |
 
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
FETCH_AI_AGENT_KEY=
COGNITION_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=
```
 
---
 
## Team — Jugaad
 
> *Jugaad (जुगाड़): a Hindi word for a flexible, frugal, improvised solution — making something work against the odds.*
 
Built at UC Berkeley AI Hackathon 2026.
 
---
 
## Impact
 
> 700,000+ UC students are enrolled across the UC system. An estimated 230,000+ experience some form of food or housing insecurity. BearBasics is built to reach all of them.
