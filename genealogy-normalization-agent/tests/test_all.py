from __future__ import annotations

from src.api.server import app
from src.daemon.monitor import DaemonMonitor

def test_suite_placeholder() -> None:
    assert app.title == "Genealogy Data Normalization Agent"


def test_daemon_constructs_with_defaults() -> None:
    monitor = DaemonMonitor()
    assert monitor.giardina.input_dir.exists()
