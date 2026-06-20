"""Shared configuration for Jugaad uAgents."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class AgentConfig:
    name: str
    seed: str
    port: int
    domain: str


COORDINATOR = AgentConfig(
    name="jugaad-coordinator",
    seed=os.getenv("COORDINATOR_SEED", "jugaad-coordinator-seed-berkeley-2026"),
    port=8000,
    domain="coordinator",
)

FOOD = AgentConfig(
    name="jugaad-food-agent",
    seed=os.getenv("FOOD_AGENT_SEED", "jugaad-food-agent-seed-berkeley-2026"),
    port=8001,
    domain="food",
)

HOUSING = AgentConfig(
    name="jugaad-housing-agent",
    seed=os.getenv("HOUSING_AGENT_SEED", "jugaad-housing-agent-seed-berkeley-2026"),
    port=8002,
    domain="housing",
)

FINANCIAL_AID = AgentConfig(
    name="jugaad-financial-aid-agent",
    seed=os.getenv("FINANCIAL_AID_AGENT_SEED", "jugaad-financial-aid-seed-berkeley-2026"),
    port=8003,
    domain="financial_aid",
)

SAFETY = AgentConfig(
    name="jugaad-safety-agent",
    seed=os.getenv("SAFETY_AGENT_SEED", "jugaad-safety-agent-seed-berkeley-2026"),
    port=8004,
    domain="safety",
)

ACADEMIC = AgentConfig(
    name="jugaad-academic-agent",
    seed=os.getenv("ACADEMIC_AGENT_SEED", "jugaad-academic-agent-seed-berkeley-2026"),
    port=8005,
    domain="academic",
)

SPECIALISTS = [FOOD, HOUSING, FINANCIAL_AID, SAFETY, ACADEMIC]

AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY", "")
ASI_ONE_API_KEY = os.getenv("ASI_ONE_API_KEY", "")
PUBLIC_AGENT_ENDPOINT = os.getenv("PUBLIC_AGENT_ENDPOINT", "")
