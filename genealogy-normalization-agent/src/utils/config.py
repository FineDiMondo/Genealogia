from __future__ import annotations

from pathlib import Path

import yaml


def load_yaml_config(path: str) -> dict:
    cfg_path = Path(path)
    if not cfg_path.exists():
        return {}
    with cfg_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

