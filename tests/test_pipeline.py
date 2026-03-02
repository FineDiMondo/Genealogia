from __future__ import annotations

import json
import unittest
from pathlib import Path

from src.portale_giardina import pipeline


class PipelineTests(unittest.TestCase):
    def test_validate_records_ok(self) -> None:
        records = pipeline.read_yaml_records()
        ok, errors = pipeline.validate(records)
        self.assertTrue(ok, msg=f"Validation errors: {errors}")

    def test_build_generates_site(self) -> None:
        rc = pipeline.run_build()
        self.assertEqual(rc, 0)
        root = Path("04_site")
        self.assertTrue((root / "index.html").exists())
        self.assertTrue((root / "timeline.html").exists())
        self.assertTrue((root / "search-index.json").exists())
        data = json.loads((root / "search-index.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(data), 10)


if __name__ == "__main__":
    unittest.main()

