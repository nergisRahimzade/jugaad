"""
Register Jugaad agents on Agentverse for ASI:One discoverability.

Prerequisites:
  1. Copy backend/.env.example → backend/.env
  2. Set AGENTVERSE_API_KEY from agentverse.ai → Profile → API Keys
  3. Run agents once locally to confirm addresses (python -m agents.run_bureau)

Usage:
  cd backend && python -m agents.register_agents
"""

import os
import sys

from dotenv import load_dotenv
from uagents import Agent
from uagents_core.utils.registration import (
    AgentverseRequestError,
    RegistrationRequestCredentials,
    register_chat_agent,
)

from .config import (
    ACADEMIC,
    AGENTVERSE_API_KEY,
    COORDINATOR,
    FINANCIAL_AID,
    FOOD,
    HOUSING,
    PUBLIC_AGENT_ENDPOINT,
    SAFETY,
)

load_dotenv()

README_TEMPLATE = """![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)
![domain:jugaad](https://img.shields.io/badge/domain-jugaad-3D8BD3)

# {name}

{description}

## Use cases
{use_cases}

## Capabilities
- Berkeley student resource navigation
- Personalized hack stack recommendations
- Multi-agent collaboration via Fetch.ai uAgents

## Example queries
{examples}
"""


AGENT_METADATA = [
    (
        COORDINATOR,
        "Jugaad Coordinator Agent",
        "Routes Berkeley student problems to specialist agents and merges personalized survival plans.",
        [
            "I need help paying for food.",
            "I'm struggling with housing.",
            "I can't afford tuition this semester.",
        ],
    ),
    (
        FOOD,
        "Jugaad Food Agent",
        "CalFresh stacking, food pantry access, free food calendar, and food insecurity hacks for UC Berkeley.",
        [
            "How do I apply for CalFresh as a student?",
            "Where is the food pantry on campus?",
            "I can't afford groceries this week.",
        ],
    ),
    (
        HOUSING,
        "Jugaad Housing Agent",
        "BSC co-op housing, emergency bridge housing, rent control rights, and lease guidance for Berkeley students.",
        [
            "I might be homeless this week.",
            "How do I apply to BSC co-ops?",
            "My landlord is raising rent illegally.",
        ],
    ),
    (
        FINANCIAL_AID,
        "Jugaad Financial Aid Agent",
        "Emergency grants, Special Circumstances appeals, micro-scholarships, and fee payment plans.",
        [
            "FAFSA is delayed — what can I do?",
            "Find me emergency financial aid.",
            "How do I file a special circumstances appeal?",
        ],
    ),
    (
        SAFETY,
        "Jugaad Safety Agent",
        "SafeWalk, walking buddy matching, safe route recommendations for late-night campus travel.",
        [
            "I need to walk from Main Stacks to Unit 2 late at night.",
            "Is Telegraph safe after 10pm?",
            "How do I request SafeWalk?",
        ],
    ),
    (
        ACADEMIC,
        "Jugaad Academic Agent",
        "BerkeleyTime enrollment strategy, study groups, prerequisite checks, and academic survival hacks.",
        [
            "I'm failing CS 10 — what are my options?",
            "How do I find an easier section on BerkeleyTime?",
            "Do I have a registration hold?",
        ],
    ),
]


def _build_readme(name: str, description: str, examples: list[str]) -> str:
    use_cases = "\n".join(f"- {ex}" for ex in examples)
    example_block = "\n".join(f'- "{ex}"' for ex in examples)
    return README_TEMPLATE.format(
        name=name,
        description=description,
        use_cases=use_cases,
        examples=example_block,
    )


def register_all() -> None:
    if not AGENTVERSE_API_KEY:
        print("ERROR: Set AGENTVERSE_API_KEY in backend/.env")
        sys.exit(1)

    endpoint = PUBLIC_AGENT_ENDPOINT or "http://127.0.0.1:8000/submit"
    if not PUBLIC_AGENT_ENDPOINT:
        print(
            "WARNING: PUBLIC_AGENT_ENDPOINT not set — using localhost.\n"
            "For judging, deploy to Railway/Fly and set a public HTTPS endpoint.\n"
        )

    for cfg, display_name, description, examples in AGENT_METADATA:
        agent = Agent(name=cfg.name, seed=cfg.seed)
        readme = _build_readme(display_name, description, examples)
        credentials = RegistrationRequestCredentials(
            agent_seed_phrase=cfg.seed,
            agentverse_api_key=AGENTVERSE_API_KEY,
        )

        try:
            register_chat_agent(
                name=display_name,
                endpoint=endpoint if cfg.domain == "coordinator" else endpoint,
                active=True,
                credentials=credentials,
                readme=readme,
                metadata={
                    "categories": ["education", "social-impact", "berkeley"],
                    "is_public": "True",
                    "domain": cfg.domain,
                },
            )
            print(f"✓ Registered {display_name}")
            print(f"  Address: {agent.address}\n")
        except AgentverseRequestError as exc:
            print(f"✗ Failed to register {display_name}: {exc}")
            if exc.from_exc:
                print(f"  Caused by: {exc.from_exc}")


if __name__ == "__main__":
    register_all()
