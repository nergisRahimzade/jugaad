import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent

_hacks: list[dict] = []
_hacks_by_id: dict[str, dict] = {}
_hacks_by_domain: dict[str, list[dict]] = {}


def _load():
    global _hacks, _hacks_by_id, _hacks_by_domain
    with open(_DATA_DIR / "seed_hacks.json") as f:
        _hacks = json.load(f)
    _hacks_by_id = {h["id"]: h for h in _hacks}
    for h in _hacks:
        _hacks_by_domain.setdefault(h["domain"], []).append(h)


_load()


def get_all_hacks() -> list[dict]:
    return _hacks


def get_hack_by_id(hack_id: str) -> dict | None:
    return _hacks_by_id.get(hack_id)


def get_hacks_by_domain(domain: str) -> list[dict]:
    return _hacks_by_domain.get(domain, [])


def get_calfresh_thresholds() -> dict:
    with open(_DATA_DIR / "calfresh_thresholds.json") as f:
        return json.load(f)
