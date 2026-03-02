from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path


class AuditLogger:
    def __init__(self, path: str = "logs/audit.log") -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def write(self, event: str, payload: dict) -> None:
        line = {
            "timestamp": datetime.now().isoformat(),
            "event": event,
            "payload": payload,
        }
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(line, ensure_ascii=False) + "\n")
