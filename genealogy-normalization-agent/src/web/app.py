from __future__ import annotations

import asyncio
import json

from flask import Flask, render_template, request

from ..agent.normalization_engine import DataNormalizationEngine

app = Flask(__name__, template_folder="templates")
engine = DataNormalizationEngine()


@app.get("/")
def index():
    return render_template("upload.html")


@app.post("/normalize")
def normalize():
    raw = request.form.get("payload", "").strip()
    payload = json.loads(raw) if raw else {}
    records = payload if isinstance(payload, list) else [payload]
    normalized, flagged = asyncio.run(engine.normalize_batch(records, source="web"))
    return render_template(
        "results.html",
        normalized=[p.to_dict() for p in normalized],
        flagged=flagged,
    )


def main() -> None:
    app.run(host="127.0.0.1", port=5000, debug=False)


if __name__ == "__main__":
    main()
