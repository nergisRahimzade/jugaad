"""
Verify that agent seed phrases in backend/.env derive the expected Agentverse addresses.

Usage:
  cd backend
  python scripts/verify_seeds.py

Requires *_SEED and matching *_ADDRESS (or *_AGENT_ADDRESS) vars in backend/.env.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from uagents import Agent

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

AGENTS = [
    ("Coordinator", "jugaad-coordinator", "COORDINATOR_SEED", "COORDINATOR_ADDRESS"),
    ("Food", "jugaad-food-agent", "FOOD_AGENT_SEED", "FOOD_AGENT_ADDRESS"),
    ("Housing", "jugaad-housing-agent", "HOUSING_AGENT_SEED", "HOUSING_AGENT_ADDRESS"),
    (
        "Financial Aid",
        "jugaad-financial-aid-agent",
        "FINANCIAL_AID_AGENT_SEED",
        "FINANCIAL_AID_AGENT_ADDRESS",
    ),
    ("Safety", "jugaad-safety-agent", "SAFETY_AGENT_SEED", "SAFETY_AGENT_ADDRESS"),
    ("Academic", "jugaad-academic-agent", "ACADEMIC_AGENT_SEED", "ACADEMIC_AGENT_ADDRESS"),
    ("Wellness", "jugaad-wellness-agent", "WELLNESS_AGENT_SEED", "WELLNESS_AGENT_ADDRESS"),
    (
        "Scholarship",
        "jugaad-scholarship-agent",
        "SCHOLARSHIP_AGENT_SEED",
        "SCHOLARSHIP_AGENT_ADDRESS",
    ),
]


def _address_from_seed(name: str, seed: str) -> str:
    return Agent(name=name, seed=seed).address


def main() -> int:
    asyncio.set_event_loop(asyncio.new_event_loop())

    print("Jugaad seed verification\n" + "=" * 72)

    missing = []
    failures = []
    passed = 0

    for label, agent_name, seed_key, address_key in AGENTS:
        seed = os.getenv(seed_key, "").strip()
        expected = os.getenv(address_key, "").strip()

        if not seed:
            missing.append(f"{label}: missing {seed_key}")
            print(f"X {label:16} missing seed ({seed_key})")
            continue
        if not expected:
            missing.append(f"{label}: missing {address_key}")
            print(f"X {label:16} missing expected address ({address_key})")
            continue

        derived = _address_from_seed(agent_name, seed)
        if derived == expected:
            passed += 1
            print(f"OK {label:16} {derived}")
        else:
            failures.append(label)
            print(f"X {label:16} seed does not match Agentverse address")
            print(f"  expected: {expected}")
            print(f"  derived:  {derived}")

    print("=" * 72)
    print(f"Result: {passed}/8 passed")

    if missing:
        print("\nMissing env vars:")
        for item in missing:
            print(f"  - {item}")

    if failures:
        print("\nFix: copy the REAL seed phrase from Agentverse (Identity/Settings)")
        print("     for each failed agent, update backend/.env, and re-run.")
        return 1

    if passed == 8:
        print("\nAll seeds match Agentverse addresses. Tanvi can use the same *_SEED lines.")
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
