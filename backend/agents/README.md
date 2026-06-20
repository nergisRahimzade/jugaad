# Fetch.ai Multi-Agent Lead — Person 1

This folder is your vertical. It implements the **Jugaad Coordinator + 5 specialist agents** on Fetch.ai uAgents with ASI:One-compatible chat protocol.

## Quick start (local demo)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add AGENTVERSE_API_KEY and ASI_ONE_API_KEY when ready

# Terminal 1 — run all 6 agents
python -m agents.run_bureau

# Terminal 2 — demo query (Fetch.ai sponsor moment)
python -m agents.demo_client "I need help paying for food."
```

Expected: Coordinator routes to **Food + Financial Aid** agents in parallel and returns a merged survival plan.

## Your checklist (from team split)

| Task | Status | How |
|------|--------|-----|
| Agentverse account | ✅ You have this | agentverse.ai |
| ASI:One Pro | ✅ You have this | asi1.ai |
| Install uAgents SDK | ✅ | `pip install -r requirements.txt` |
| Build Coordinator | ✅ | `agents/coordinator.py` |
| Build 5 specialists | ✅ | `agents/specialist.py` + knowledge base |
| Agent-to-agent comms | ✅ | `JugaadQuery` / `JugaadResponse` via Bureau |
| Coordinator routing | ✅ | Keyword router + cross-domain triggers |
| Register on Agentverse | 🔲 You do this | See below |
| Make discoverable | 🔲 You do this | README + keywords in Agentverse UI |
| Demo for judges | 🔲 Practice | Agentverse dashboard + live bureau |

## Register agents on Agentverse

1. Run bureau once and copy agent addresses from terminal output.
2. Set `AGENTVERSE_API_KEY` in `.env`.
3. Connect mailbox (Coordinator):
   - Click the **Agent Inspector** URL in terminal
   - Connect → **Mailbox** → Finish
4. For production demo, deploy bureau to Railway and set:
   ```
   PUBLIC_AGENT_ENDPOINT=https://your-app.railway.app/submit
   ```
5. Register:
   ```bash
   python -m agents.register_agents
   ```
6. In Agentverse UI for each agent:
   - Set handle (e.g. `@jugaad-food`)
   - Add keywords: `berkeley`, `food`, `calfresh`, `student`, `hackathon`
   - Mark **Active**

## ASI:One Pro integration (optional enhancement)

The coordinator uses chat protocol so ASI:One Chat can talk to it directly. To add ASI:One LLM reasoning inside a specialist, pass `ASI_ONE_API_KEY` and call `https://api.asi1.ai/v1` (see Fetch Innovation Lab docs).

## Integration points for teammates

| Teammate | Integration |
|----------|-------------|
| Person 2 (Claude) | Replace keyword routing in `routing.py` with Claude classification; enrich responses |
| Person 3 (Redis) | Swap `knowledge.py` static data with Redis vector search |
| Person 4 (Frontend) | POST user message to coordinator via chat protocol or FastAPI wrapper |

## Sponsor demo script (60 sec)

1. Open **Agentverse dashboard** — show 6 agents with real addresses.
2. Run demo client: *"I need help paying for food."*
3. Point to terminal logs: Food + Financial Aid agents activated in parallel.
4. Show merged CalFresh + emergency aid plan in response.
5. Say: *"Cross-domain intelligence — financial stress automatically triggers food hacks."*

## Agent ports

| Agent | Port |
|-------|------|
| Coordinator | 8000 |
| Food | 8001 |
| Housing | 8002 |
| Financial Aid | 8003 |
| Safety | 8004 |
| Academic | 8005 |
