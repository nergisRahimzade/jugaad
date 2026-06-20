"""Run all Jugaad agents together via uAgents Bureau."""

import os

from uagents import Bureau

from .bureau_demo_client import demo_client
from .config import (
    ACADEMIC,
    COORDINATOR,
    FINANCIAL_AID,
    FOOD,
    HOUSING,
    SAFETY,
    SCHOLARSHIP,
    WELLNESS,
)
from .coordinator import coordinator, register_specialist_addresses
from .specialist import create_specialist_agent

food_agent = create_specialist_agent(FOOD)
housing_agent = create_specialist_agent(HOUSING)
financial_aid_agent = create_specialist_agent(FINANCIAL_AID)
safety_agent = create_specialist_agent(SAFETY)
academic_agent = create_specialist_agent(ACADEMIC)
wellness_agent = create_specialist_agent(WELLNESS)
scholarship_agent = create_specialist_agent(SCHOLARSHIP)

register_specialist_addresses(
    {
        FOOD.domain: food_agent.address,
        HOUSING.domain: housing_agent.address,
        FINANCIAL_AID.domain: financial_aid_agent.address,
        SAFETY.domain: safety_agent.address,
        ACADEMIC.domain: academic_agent.address,
        WELLNESS.domain: wellness_agent.address,
        SCHOLARSHIP.domain: scholarship_agent.address,
    }
)

bureau = Bureau(
    port=COORDINATOR.port,
    endpoint=f"http://127.0.0.1:{COORDINATOR.port}/submit",
)
bureau.add(coordinator)
bureau.add(food_agent)
bureau.add(housing_agent)
bureau.add(financial_aid_agent)
bureau.add(safety_agent)
bureau.add(academic_agent)
bureau.add(wellness_agent)
bureau.add(scholarship_agent)
if os.getenv("RUN_DEMO", "0") == "1":
    bureau.add(demo_client)


def print_agent_manifest() -> None:
    agents = [
        ("Coordinator", coordinator),
        ("Food", food_agent),
        ("Housing", housing_agent),
        ("Financial Aid", financial_aid_agent),
        ("Safety", safety_agent),
        ("Academic", academic_agent),
        ("Wellness", wellness_agent),
        ("Scholarship", scholarship_agent),
    ]
    print("\n=== Jugaad Agent Addresses (save for Agentverse + demo) ===")
    for label, agent in agents:
        print(f"  {label:16} {agent.address}")
    print("============================================================\n")


if __name__ == "__main__":
    print_agent_manifest()
    bureau.run()
