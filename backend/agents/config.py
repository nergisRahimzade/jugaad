"""Configuration for Agentverse hosted agents (addresses + API keys only)."""

import os

from dotenv import load_dotenv

load_dotenv()

AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY", "")
ASI_ONE_API_KEY = os.getenv("ASI_ONE_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "")
BROWSERBASE_API_KEY = os.getenv("BROWSERBASE_API_KEY", "")
BAND_API_KEY = os.getenv("BAND_API_KEY", "")
BAND_ROOM_ID = os.getenv("BAND_ROOM_ID", "")

# Paste agent1q... addresses from Agentverse after creating hosted agents
COORDINATOR_ADDRESS = os.getenv("COORDINATOR_ADDRESS", "")
FOOD_AGENT_ADDRESS = os.getenv("FOOD_AGENT_ADDRESS", "")
HOUSING_AGENT_ADDRESS = os.getenv("HOUSING_AGENT_ADDRESS", "")
FINANCIAL_AID_AGENT_ADDRESS = os.getenv("FINANCIAL_AID_AGENT_ADDRESS", "")
SAFETY_AGENT_ADDRESS = os.getenv("SAFETY_AGENT_ADDRESS", "")
ACADEMIC_AGENT_ADDRESS = os.getenv("ACADEMIC_AGENT_ADDRESS", "")
WELLNESS_AGENT_ADDRESS = os.getenv("WELLNESS_AGENT_ADDRESS", "")
SCHOLARSHIP_AGENT_ADDRESS = os.getenv("SCHOLARSHIP_AGENT_ADDRESS", "")

AGENT_ADDRESSES: dict[str, str] = {
    "coordinator": COORDINATOR_ADDRESS,
    "food": FOOD_AGENT_ADDRESS,
    "housing": HOUSING_AGENT_ADDRESS,
    "financial_aid": FINANCIAL_AID_AGENT_ADDRESS,
    "safety": SAFETY_AGENT_ADDRESS,
    "academic": ACADEMIC_AGENT_ADDRESS,
    "wellness": WELLNESS_AGENT_ADDRESS,
    "scholarship": SCHOLARSHIP_AGENT_ADDRESS,
}
