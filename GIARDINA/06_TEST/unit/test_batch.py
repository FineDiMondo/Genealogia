from __future__ import annotations

import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PROG = ROOT / "GIARDINA" / "03_PROG"
sys.path.insert(0, str(PROG))

from copy_compiler import compile_all
from validator import validate_records


class GiardinaBatchTests(unittest.TestCase):
    def test_compile_copy(self) -> None:
        schemas = compile_all()
        self.assertGreaterEqual(len(schemas), 6)

    def test_validate_records(self) -> None:
        result = validate_records()
        self.assertIn(result.rc, [0, 4])


if __name__ == "__main__":
    unittest.main()
