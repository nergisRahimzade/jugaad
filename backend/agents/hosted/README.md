# Agentverse Hosted Agents — Setup Guide

Agents run **on agentverse.ai** (not locally). No seeds, no `run_bureau`, no mailbox.

## Order of setup

### Step 1 — Create 7 specialists first

For each folder below, on [agentverse.ai](https://agentverse.ai) → **My Agents** → **+ New Agent** → **Blank Agent**:

| Folder | Agent name on Agentverse |
|--------|--------------------------|
| `food/` | Jugaad Food Agent |
| `housing/` | Jugaad Housing Agent |
| `financial_aid/` | Jugaad Financial Aid Agent |
| `scholarship/` | Jugaad Scholarship Agent |
| `wellness/` | Jugaad Wellness Agent |
| `safety/` | Jugaad Safety Agent |
| `academic/` | Jugaad Academic Agent |

For each specialist:

1. Open the agent editor
2. Replace the entire `agent.py` with the code from this folder's `agent.py` (**one file only**)
3. Delete `messages.py` if you added it earlier (not needed anymore)
4. Click **Run**
5. Copy the agent **address** (`agent1q...`) from the overview

Test individually: use Agentverse chat — e.g. "I need help with food"

### Step 2 — Create Coordinator last

1. **+ New Agent** → **Blank** → name: **Jugaad Coordinator Agent**
2. Add these files from `hosted/coordinator/`:
   - `agent.py`
   - `routing.py`
   - `addresses.py`
   - `messages.py`
3. Edit `addresses.py` — paste all 7 specialist addresses
4. Click **Run**
5. Copy Coordinator address for your frontend / demo

### Step 3 — Test multi-agent flow

Chat with the **Coordinator** on Agentverse:

> I need help paying for food

Expected: routes to Food + Financial Aid + Scholarship (cross-domain), merged survival plan.

## Optional — ASI:One

Add `ASI_ONE_API_KEY` in **Agent Secrets** if you extend agents to call ASI:One (not required for base demo).

## Repo reference (not run locally)

| Path | Purpose |
|------|---------|
| `knowledge.py` | Full Berkeley hack text (source of truth) |
| `routing.py` | Same routing logic as coordinator copy |
| `config.py` | Paste addresses into `.env` for frontend reference |

## Frontend

Put Coordinator address in `.env`:

```env
COORDINATOR_ADDRESS=agent1q...
FOOD_AGENT_ADDRESS=agent1q...
# ... etc
```
