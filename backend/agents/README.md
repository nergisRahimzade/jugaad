# Fetch.ai Multi-Agent Lead — Person 1

8 **Agentverse hosted agents**: Coordinator + 7 specialists.

## Setup (website only — no seeds)

See **`hosted/README.md`** for step-by-step instructions.

```text
backend/agents/hosted/
  coordinator/   → agent.py + routing.py + addresses.py + messages.py
  food/          → agent.py + messages.py
  housing/       → ...
  financial_aid/
  scholarship/
  wellness/
  safety/
  academic/
```

1. Create each agent on [agentverse.ai](https://agentverse.ai)
2. Paste code from the matching folder
3. Run each agent on Agentverse
4. Paste specialist addresses into `coordinator/addresses.py`
5. Paste all addresses into `backend/.env` for the frontend

## Demo query

Chat with Coordinator on Agentverse:

> I need help paying for food

Routes to Food + Financial Aid + Scholarship → merged survival plan.

## Reference modules (not executed locally)

| File | Purpose |
|------|---------|
| `knowledge.py` | Berkeley hacks source text |
| `routing.py` | Keyword + cross-domain routing |
| `response_builder.py` | Used by Claude FastAPI layer |

## Integrations

| Service | Env var | Where used |
|---------|---------|------------|
| Agentverse | Hosted UI | All 8 agents |
| ASI:One Pro | `ASI_ONE_API_KEY` | Optional in Agent Secrets |
| Band / Redis / Browserbase | env vars | Claude layer + future hosted extensions |

## Sponsor demo (60 sec)

1. Agentverse dashboard — 8 agents with live addresses
2. Chat with Coordinator: food insecurity query
3. Show merged multi-domain plan in Agent Logs
4. Point to cross-domain routing (Food + Financial Aid + Scholarship)
