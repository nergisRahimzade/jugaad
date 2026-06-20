# Fetch.ai Multi-Agent Lead — Person 1

8 agents: **Coordinator + 7 specialists** (Food, Housing, Financial Aid, Scholarship, Wellness, Safety, Academic).

## Quick start

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# All agents + auto demo
RUN_DEMO=1 python -m agents.run_bureau

# Manual demo
python -m agents.demo_client "I need help paying for food."
```

**Food demo routes to:** Food + Financial Aid + Scholarship (cross-domain triggers).

## Integrations

| Service | Env var | Status |
|---------|---------|--------|
| Fetch.ai uAgents | built-in | ✅ Bureau + mailbox |
| Agentverse | `AGENTVERSE_API_KEY` | Register via `register_agents.py` |
| ASI:One Pro | `ASI_ONE_API_KEY` | ✅ Personalizes specialist summaries |
| Band | `BAND_API_KEY`, `BAND_ROOM_ID` | ✅ Shared room + REST fallback |
| Redis | `REDIS_URL` | ✅ Vector search hook (Person 3 fills data) |
| Browserbase | `BROWSERBASE_API_KEY` | ✅ Live resource hook (Person 3 wires crawl) |

## Band cross-domain triggers

| Agent detects | Also activates |
|---------------|----------------|
| Financial aid stress | Food, Wellness |
| Food insecurity | Financial Aid, Scholarship |
| Academic struggle | Wellness, Financial Aid |
| Wellness stress | Financial Aid |

Band events appear in merged response and terminal logs.

## Agent manifest

| Agent | Domain |
|-------|--------|
| Coordinator | routes all queries |
| Food | food |
| Housing | housing |
| Financial Aid | financial_aid |
| Scholarship | scholarship |
| Wellness | wellness |
| Safety | safety |
| Academic | academic |

## Sponsor demo (60 sec)

1. Agentverse dashboard — 8 agents with real addresses
2. `RUN_DEMO=1 python -m agents.run_bureau`
3. Show logs: Food + Financial Aid + Scholarship + Band room events
4. Point to merged CalFresh + aid + scholarship plan
