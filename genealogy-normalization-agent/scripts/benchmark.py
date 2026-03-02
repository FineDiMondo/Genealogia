from __future__ import annotations

import asyncio
import json
import time
from statistics import mean

from fastapi.testclient import TestClient

from src.agent.normalization_engine import DataNormalizationEngine
from src.api.server import app
from src.rules.duplicate_detection import DuplicateDetector


def _sample_record(i: int) -> dict:
    return {
        "person_id": f"P{i:06d}",
        "given_names": "PIETRO",
        "family_name": "d'agostino",
        "birth_date": "15 MAR 1500",
        "birth_place": "Palermo",
    }


def measure_single_record() -> float:
    engine = DataNormalizationEngine()
    t0 = time.perf_counter()
    asyncio.run(engine.normalize_record(_sample_record(1), source="benchmark"))
    return (time.perf_counter() - t0) * 1000.0


def measure_batch(n: int) -> float:
    engine = DataNormalizationEngine()
    data = [_sample_record(i) for i in range(n)]
    t0 = time.perf_counter()
    asyncio.run(engine.normalize_batch(data, source="benchmark"))
    return time.perf_counter() - t0


def measure_duplicates(n: int = 1000) -> float:
    records = [_sample_record(i) for i in range(n)]
    t0 = time.perf_counter()
    DuplicateDetector.detect(records, threshold=0.90)
    return time.perf_counter() - t0


def measure_api_health() -> float:
    t0 = time.perf_counter()
    with TestClient(app) as client:
        resp = client.get("/health")
        if resp.status_code != 200:
            raise RuntimeError("health endpoint benchmark failed")
    return (time.perf_counter() - t0) * 1000.0


def run_benchmarks() -> dict:
    single_runs = [measure_single_record() for _ in range(3)]
    results = {
        "single_record_ms_avg": round(mean(single_runs), 3),
        "batch_100_s": round(measure_batch(100), 3),
        "batch_1000_s": round(measure_batch(1000), 3),
        "duplicate_detection_1000_s": round(measure_duplicates(1000), 3),
        "api_health_ms": round(measure_api_health(), 3),
    }
    return results


def main() -> None:
    results = run_benchmarks()
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
