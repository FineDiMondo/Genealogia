from __future__ import annotations

import asyncio
import argparse
import json
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from ..agent.normalization_engine import DataNormalizationEngine


class IncomingHandler(FileSystemEventHandler):
    def __init__(self, engine: DataNormalizationEngine, out_dir: Path) -> None:
        super().__init__()
        self.engine = engine
        self.out_dir = out_dir
        self.out_dir.mkdir(parents=True, exist_ok=True)

    def on_created(self, event):  # noqa: N802
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.suffix.lower() != ".json":
            return
        payload = json.loads(path.read_text(encoding="utf-8"))
        records = payload if isinstance(payload, list) else [payload]
        normalized, flagged = asyncio.run(self.engine.normalize_batch(records, source="daemon"))
        out_file = self.out_dir / f"{path.stem}.normalized.json"
        out_file.write_text(json.dumps({"normalized": [p.to_dict() for p in normalized], "flagged": flagged}, ensure_ascii=False, indent=2), encoding="utf-8")


def run_monitor(incoming_dir: str = "data/incoming", output_dir: str = "data/normalized") -> None:
    in_dir = Path(incoming_dir)
    in_dir.mkdir(parents=True, exist_ok=True)
    engine = DataNormalizationEngine()
    handler = IncomingHandler(engine, Path(output_dir))
    observer = Observer()
    observer.schedule(handler, str(in_dir), recursive=False)
    observer.start()
    try:
        while True:
            observer.join(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


def main() -> None:
    parser = argparse.ArgumentParser(description="Monitor incoming folder and normalize new JSON files.")
    parser.add_argument("--incoming", default="data/incoming", help="Input folder to watch")
    parser.add_argument("--output", default="data/normalized", help="Output folder for normalized files")
    args = parser.parse_args()
    run_monitor(incoming_dir=args.incoming, output_dir=args.output)


if __name__ == "__main__":
    main()
