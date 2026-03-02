from __future__ import annotations

import asyncio
import json
from datetime import datetime

from flask import Flask, jsonify, render_template, request

from ..dashboard.service import DashboardService
from ..agent.normalization_engine import DataNormalizationEngine

app = Flask(__name__, template_folder="templates", static_folder="static")
engine = DataNormalizationEngine()
dashboard = DashboardService()


@app.get("/")
def index():
    return render_template("upload.html")


@app.get("/dashboard")
def dashboard_view():
    return render_template("dashboard.html")


@app.post("/normalize")
def normalize():
    raw = request.form.get("payload", "").strip()
    payload = json.loads(raw) if raw else {}
    records = payload if isinstance(payload, list) else [payload]
    normalized, flagged = asyncio.run(engine.normalize_batch(records, source="web"))
    dashboard.record_normalization_batch(normalized, source_system="web", domain="individuals")
    return render_template(
        "results.html",
        normalized=[p.to_dict() for p in normalized],
        flagged=flagged,
    )


@app.get("/api/v1/dashboard/metrics")
def api_dashboard_metrics():
    return jsonify(dashboard.get_metrics_payload())


@app.get("/api/v1/dashboard/sources")
def api_dashboard_sources():
    return jsonify(dashboard.get_sources_payload())


@app.get("/api/v1/dashboard/timeline")
def api_dashboard_timeline():
    return jsonify(dashboard.get_timeline_payload())


@app.get("/api/v1/dashboard/reuse")
def api_dashboard_reuse():
    return jsonify(dashboard.get_reuse_payload())


@app.get("/api/v1/dashboard/quality")
def api_dashboard_quality():
    return jsonify(dashboard.get_quality_payload())


@app.post("/api/v1/dashboard/history")
def api_dashboard_history():
    payload = request.get_json(force=True, silent=True) or {}
    result = dashboard.export_history(
        start_date=str(payload.get("start_date", datetime.now().date().isoformat())),
        end_date=str(payload.get("end_date", datetime.now().date().isoformat())),
        export_format=str(payload.get("export_format", "json")),
    )
    return jsonify(result)


def main() -> None:
    app.run(host="127.0.0.1", port=5000, debug=False)


if __name__ == "__main__":
    main()
