from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import click

from ..agent.normalization_engine import DataNormalizationEngine
from ..exporters.gedcom_exporter import export_minimal_gedcom
from ..exporters.json_exporter import export_json
from ..rules.duplicate_detection import DuplicateDetector


@click.group()
def cli() -> None:
    """Genealogy Data Normalization CLI."""


@cli.command("normalize-file")
@click.argument("input_file", type=click.Path(exists=True))
@click.option("--source", default="cli")
def normalize_file(input_file: str, source: str) -> None:
    payload = json.loads(Path(input_file).read_text(encoding="utf-8"))
    records = payload if isinstance(payload, list) else [payload]
    engine = DataNormalizationEngine()
    normalized, flagged = asyncio.run(engine.normalize_batch(records, source=source))
    click.echo(json.dumps({"normalized": [p.to_dict() for p in normalized], "flagged": flagged}, ensure_ascii=False, indent=2))


@cli.command("run-demo")
def run_demo() -> None:
    sample = {
        "person_id": "PDEMO01",
        "given_names": "PIETRO",
        "family_name": "d'agostino",
        "birth_date": "15 MAR 1500",
        "birth_place": "palermo",
    }
    engine = DataNormalizationEngine()
    result = asyncio.run(engine.normalize_record(sample, source="demo"))
    click.echo(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))


@cli.command("detect-duplicates")
@click.argument("input_file", type=click.Path(exists=True))
@click.option("--threshold", default=0.92, type=float)
def detect_duplicates(input_file: str, threshold: float) -> None:
    payload = json.loads(Path(input_file).read_text(encoding="utf-8"))
    records = payload if isinstance(payload, list) else [payload]
    click.echo(json.dumps({"duplicates": DuplicateDetector.detect(records, threshold=threshold)}, ensure_ascii=False, indent=2))


@cli.command("export")
@click.argument("input_file", type=click.Path(exists=True))
@click.option("--format", "fmt", type=click.Choice(["json", "gedcom"]), default="json")
@click.option("--output", required=True, type=click.Path())
def export_data(input_file: str, fmt: str, output: str) -> None:
    payload: Any = json.loads(Path(input_file).read_text(encoding="utf-8"))
    records = payload if isinstance(payload, list) else [payload]
    if fmt == "json":
        export_json({"records": records}, output)
    else:
        export_minimal_gedcom(records, output)
    click.echo(f"written: {output}")


if __name__ == "__main__":
    cli()
