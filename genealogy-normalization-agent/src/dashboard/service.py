from __future__ import annotations

import csv
import json
import os
import sqlite3
from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime
from datetime import timedelta
from pathlib import Path
from typing import Any

from ..agent.data_models import NormalizedPerson

DOMAINS = [
    "individuals",
    "families",
    "heraldry",
    "noble_titles",
    "possessions",
    "family_history",
    "descriptions",
]

DEFAULT_TARGETS = {
    "individuals": 1247,
    "families": 432,
    "heraldry": 78,
    "noble_titles": 34,
    "possessions": 67,
    "family_history": 156,
    "descriptions": 120,
}


class DashboardService:
    def __init__(self, db_path: str | None = None, targets_path: str | None = None) -> None:
        base_data_dir = Path("data/dashboard")
        base_data_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = Path(db_path or os.getenv("DASHBOARD_DB_PATH", str(base_data_dir / "metrics.sqlite3")))
        self.targets_path = Path(targets_path or os.getenv("DASHBOARD_TARGETS_PATH", str(base_data_dir / "targets.json")))
        self.export_dir = base_data_dir / "exports"
        self.export_dir.mkdir(parents=True, exist_ok=True)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
        self._ensure_targets_file()
        self._ensure_open_session()

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _initialize_db(self) -> None:
        ddl = """
        CREATE TABLE IF NOT EXISTS normalization_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            domain TEXT NOT NULL,
            total_records INTEGER NOT NULL,
            normalized_records INTEGER NOT NULL,
            auto_approved INTEGER NOT NULL,
            flagged_for_review INTEGER NOT NULL,
            quality_score REAL NOT NULL,
            source_system TEXT NOT NULL,
            records_from_source INTEGER NOT NULL,
            avg_confidence REAL NOT NULL,
            completeness_score REAL NOT NULL,
            source_agreement_score REAL NOT NULL,
            processing_time_seconds INTEGER NOT NULL,
            records_per_minute INTEGER NOT NULL,
            cache_hit_rate REAL NOT NULL,
            time_saved_minutes INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS normalization_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            record_id TEXT NOT NULL,
            domain TEXT NOT NULL,
            original_data TEXT NOT NULL,
            normalized_data TEXT NOT NULL,
            source_system TEXT NOT NULL,
            source_id TEXT NOT NULL,
            confidence_score REAL NOT NULL,
            completeness_score REAL NOT NULL,
            auto_approved INTEGER NOT NULL,
            flagged_reasons TEXT NOT NULL,
            cache_hit INTEGER NOT NULL,
            previous_normalization_id INTEGER,
            time_saved_seconds INTEGER NOT NULL,
            changes_json TEXT NOT NULL,
            user_reviewed INTEGER NOT NULL DEFAULT 0,
            user_feedback TEXT
        );

        CREATE TABLE IF NOT EXISTS normalization_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT UNIQUE NOT NULL,
            domain TEXT NOT NULL,
            normalized_data TEXT NOT NULL,
            source_system TEXT NOT NULL,
            normalization_history_id INTEGER NOT NULL,
            times_reused INTEGER NOT NULL DEFAULT 0,
            last_reused TEXT,
            time_saved_total_seconds INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS normalization_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_minutes INTEGER,
            experiment_name TEXT,
            notes TEXT,
            total_records_processed INTEGER NOT NULL DEFAULT 0,
            total_normalized INTEGER NOT NULL DEFAULT 0,
            quality_score REAL NOT NULL DEFAULT 0,
            time_saved_minutes INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON normalization_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_metrics_domain ON normalization_metrics(domain);
        CREATE INDEX IF NOT EXISTS idx_metrics_source ON normalization_metrics(source_system);
        CREATE INDEX IF NOT EXISTS idx_history_record_id ON normalization_history(record_id);
        CREATE INDEX IF NOT EXISTS idx_history_domain ON normalization_history(domain);
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON normalization_history(timestamp);
        CREATE INDEX IF NOT EXISTS idx_history_source ON normalization_history(source_system);
        CREATE INDEX IF NOT EXISTS idx_cache_record_id ON normalization_cache(record_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_id ON normalization_sessions(session_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_start ON normalization_sessions(start_time);
        """
        with self._conn() as conn:
            conn.executescript(ddl)
            conn.commit()

    def _ensure_targets_file(self) -> None:
        if self.targets_path.exists():
            return
        self.targets_path.write_text(json.dumps(DEFAULT_TARGETS, ensure_ascii=False, indent=2), encoding="utf-8")

    def _load_targets(self) -> dict[str, int]:
        try:
            data = json.loads(self.targets_path.read_text(encoding="utf-8"))
        except Exception:
            data = DEFAULT_TARGETS
        for d in DOMAINS:
            data.setdefault(d, DEFAULT_TARGETS.get(d, 0))
        return {k: int(v) for k, v in data.items()}

    def _ensure_open_session(self) -> None:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT session_id FROM normalization_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1"
            ).fetchone()
            if row:
                return
            sid = f"SESSION-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            conn.execute(
                """
                INSERT INTO normalization_sessions (
                    session_id, start_time, experiment_name, notes
                ) VALUES (?, ?, ?, ?)
                """,
                (sid, datetime.now().isoformat(), "dashboard-monitoring", "Auto-created session"),
            )
            conn.commit()

    def _active_session_id(self, conn: sqlite3.Connection) -> str:
        row = conn.execute(
            "SELECT session_id FROM normalization_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1"
        ).fetchone()
        if row:
            return str(row["session_id"])
        sid = f"SESSION-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        conn.execute(
            "INSERT INTO normalization_sessions (session_id, start_time, experiment_name) VALUES (?, ?, ?)",
            (sid, datetime.now().isoformat(), "dashboard-monitoring"),
        )
        return sid

    @staticmethod
    def _compute_completeness(person: NormalizedPerson) -> float:
        fields = [person.given_names, person.family_name, person.birth_date, person.birth_place, person.death_date, person.death_place]
        filled = sum(1 for f in fields if f)
        return round((filled / len(fields)) * 100, 2)

    @staticmethod
    def _compute_source_agreement(person: NormalizedPerson) -> float:
        if not person.conflict_reasons:
            return 95.0
        if person.flagged_for_review:
            return 70.0
        return 82.0

    def record_normalization_batch(
        self,
        persons: list[NormalizedPerson],
        source_system: str,
        domain: str = "individuals",
        processing_time_seconds: int = 0,
    ) -> None:
        if not persons:
            return
        ts = datetime.now().isoformat()
        with self._conn() as conn:
            session_id = self._active_session_id(conn)
            auto_approved = 0
            flagged = 0
            total_time_saved = 0
            cache_hits = 0
            confidence_values: list[float] = []
            completeness_values: list[float] = []
            source_agreement_values: list[float] = []

            for person in persons:
                confidence_values.append(person.confidence * 100)
                completeness = self._compute_completeness(person)
                source_agreement = self._compute_source_agreement(person)
                completeness_values.append(completeness)
                source_agreement_values.append(source_agreement)
                if person.flagged_for_review:
                    flagged += 1
                else:
                    auto_approved += 1

                cache_row = conn.execute(
                    "SELECT id, normalization_history_id, times_reused, time_saved_total_seconds FROM normalization_cache WHERE record_id = ?",
                    (person.person_id,),
                ).fetchone()
                cache_hit = bool(cache_row)
                time_saved_seconds = 0
                previous_history_id = None
                if cache_hit:
                    cache_hits += 1
                    time_saved_seconds = 180
                    total_time_saved += time_saved_seconds
                    previous_history_id = int(cache_row["normalization_history_id"])
                history_payload = (
                    ts,
                    person.person_id,
                    domain,
                    json.dumps({}, ensure_ascii=False),
                    json.dumps(person.to_dict(), ensure_ascii=False),
                    source_system,
                    person.person_id,
                    round(person.confidence * 100, 2),
                    completeness,
                    0 if person.flagged_for_review else 1,
                    json.dumps(person.conflict_reasons, ensure_ascii=False),
                    1 if cache_hit else 0,
                    previous_history_id,
                    time_saved_seconds,
                    json.dumps([asdict(c) for c in person.changes], ensure_ascii=False),
                )
                conn.execute(
                    """
                    INSERT INTO normalization_history (
                        timestamp, record_id, domain, original_data, normalized_data,
                        source_system, source_id, confidence_score, completeness_score,
                        auto_approved, flagged_reasons, cache_hit, previous_normalization_id,
                        time_saved_seconds, changes_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    history_payload,
                )
                history_id = int(conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"])
                if cache_hit:
                    conn.execute(
                        """
                        UPDATE normalization_cache
                        SET normalization_history_id = ?, times_reused = ?, last_reused = ?, time_saved_total_seconds = ?
                        WHERE record_id = ?
                        """,
                        (
                            history_id,
                            int(cache_row["times_reused"]) + 1,
                            ts,
                            int(cache_row["time_saved_total_seconds"]) + time_saved_seconds,
                            person.person_id,
                        ),
                    )
                else:
                    conn.execute(
                        """
                        INSERT INTO normalization_cache (
                            record_id, domain, normalized_data, source_system, normalization_history_id,
                            times_reused, last_reused, time_saved_total_seconds, created_at
                        ) VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?)
                        """,
                        (
                            person.person_id,
                            domain,
                            json.dumps(person.to_dict(), ensure_ascii=False),
                            source_system,
                            history_id,
                            ts,
                            ts,
                        ),
                    )

            normalized_count = len(persons)
            avg_confidence = round(sum(confidence_values) / max(len(confidence_values), 1), 2)
            avg_completeness = round(sum(completeness_values) / max(len(completeness_values), 1), 2)
            avg_source_agreement = round(sum(source_agreement_values) / max(len(source_agreement_values), 1), 2)
            quality_score = round((avg_confidence + avg_completeness + avg_source_agreement) / 3, 2)
            hit_rate = round((cache_hits / normalized_count) * 100, 2)
            rpm = int((normalized_count / max(processing_time_seconds, 1)) * 60) if processing_time_seconds else normalized_count

            domain_total = conn.execute(
                "SELECT COUNT(*) AS c FROM normalization_history WHERE domain = ?",
                (domain,),
            ).fetchone()["c"]
            source_total = conn.execute(
                "SELECT COUNT(*) AS c FROM normalization_history WHERE source_system = ?",
                (source_system,),
            ).fetchone()["c"]
            conn.execute(
                """
                INSERT INTO normalization_metrics (
                    timestamp, domain, total_records, normalized_records, auto_approved, flagged_for_review,
                    quality_score, source_system, records_from_source, avg_confidence, completeness_score,
                    source_agreement_score, processing_time_seconds, records_per_minute, cache_hit_rate, time_saved_minutes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ts,
                    domain,
                    int(domain_total),
                    normalized_count,
                    auto_approved,
                    flagged,
                    quality_score,
                    source_system,
                    int(source_total),
                    avg_confidence,
                    avg_completeness,
                    avg_source_agreement,
                    int(processing_time_seconds),
                    rpm,
                    hit_rate,
                    int(total_time_saved / 60),
                ),
            )
            conn.execute(
                """
                UPDATE normalization_sessions
                SET total_records_processed = total_records_processed + ?,
                    total_normalized = total_normalized + ?,
                    quality_score = ?,
                    time_saved_minutes = time_saved_minutes + ?
                WHERE session_id = ?
                """,
                (normalized_count, normalized_count, quality_score, int(total_time_saved / 60), session_id),
            )
            conn.commit()

    def get_metrics_payload(self) -> dict[str, Any]:
        targets = self._load_targets()
        now = datetime.now()
        with self._conn() as conn:
            domains: dict[str, Any] = {}
            total_records = 0
            normalized_records = 0
            auto_approved = 0
            flagged = 0
            quality_values: list[float] = []
            for domain in DOMAINS:
                row = conn.execute(
                    """
                    SELECT
                        COUNT(*) AS normalized,
                        SUM(CASE WHEN auto_approved = 1 THEN 1 ELSE 0 END) AS auto_approved,
                        AVG(confidence_score) AS avg_confidence,
                        AVG(completeness_score) AS completeness,
                        AVG(CASE WHEN flagged_reasons = '[]' THEN 95 ELSE 75 END) AS source_agreement
                    FROM normalization_history
                    WHERE domain = ?
                    """,
                    (domain,),
                ).fetchone()
                normalized = int(row["normalized"] or 0)
                domain_total = max(int(targets.get(domain, 0)), normalized)
                domain_flagged = max(0, normalized - int(row["auto_approved"] or 0))
                avg_confidence = round(float(row["avg_confidence"] or 0.0), 2)
                completeness = float(row["completeness"] or 0.0)
                source_agreement = float(row["source_agreement"] or 0.0)
                qscore = round((avg_confidence + completeness + source_agreement) / 3, 2) if normalized else 0.0
                domains[domain] = {
                    "total": domain_total,
                    "normalized": normalized,
                    "auto_approved": int(row["auto_approved"] or 0),
                    "flagged": domain_flagged,
                    "quality_score": qscore,
                    "avg_confidence": round(avg_confidence / 100, 2) if avg_confidence else 0.0,
                }
                total_records += domain_total
                normalized_records += normalized
                auto_approved += int(row["auto_approved"] or 0)
                flagged += domain_flagged
                if qscore:
                    quality_values.append(qscore)

            active_session = conn.execute(
                "SELECT start_time FROM normalization_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1"
            ).fetchone()
            start_time = datetime.fromisoformat(str(active_session["start_time"])) if active_session else now
            last_sync_row = conn.execute("SELECT MAX(timestamp) AS ts FROM normalization_metrics").fetchone()
            last_sync = str(last_sync_row["ts"] or now.isoformat())
            return {
                "timestamp": now.isoformat(),
                "domains": domains,
                "overall": {
                    "total_records": total_records,
                    "normalized_records": normalized_records,
                    "auto_approved": auto_approved,
                    "flagged": flagged,
                    "pending_review": flagged,
                    "quality_score": round(sum(quality_values) / max(len(quality_values), 1), 2) if quality_values else 0.0,
                    "last_sync": last_sync,
                    "session_duration_seconds": int((now - start_time).total_seconds()),
                },
            }

    def get_sources_payload(self) -> dict[str, Any]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT source_system, COUNT(*) AS count, AVG(confidence_score) AS quality
                FROM normalization_history
                GROUP BY source_system
                ORDER BY count DESC
                """
            ).fetchall()
            total = sum(int(r["count"]) for r in rows) or 1
            sources: dict[str, Any] = {}
            for row in rows:
                count = int(row["count"])
                sources[str(row["source_system"])] = {
                    "count": count,
                    "percentage": round((count / total) * 100, 1),
                    "domains_covered": ["individuals"],
                    "quality_score": round(float(row["quality"] or 0.0), 1),
                }
            imported_raw = int(total)
            normalized_clean = int(
                conn.execute("SELECT COUNT(*) AS c FROM normalization_history").fetchone()["c"]
            )
            avg_quality = float(
                conn.execute("SELECT AVG(confidence_score) AS v FROM normalization_history").fetchone()["v"] or 0.0
            )
            quality_improvement = round(max(0.0, avg_quality - 80.0), 1)
            return {
                "timestamp": datetime.now().isoformat(),
                "sources": sources,
                "data_flow": {
                    "imported_raw": imported_raw,
                    "normalized_clean": normalized_clean,
                    "quality_improvement": quality_improvement,
                },
            }

    def get_timeline_payload(self) -> dict[str, Any]:
        now = datetime.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        with self._conn() as conn:
            today_count = int(
                conn.execute("SELECT COUNT(*) AS c FROM normalization_history WHERE date(timestamp) = ?", (today.isoformat(),)).fetchone()["c"]
            )
            yesterday_count = int(
                conn.execute("SELECT COUNT(*) AS c FROM normalization_history WHERE date(timestamp) = ?", (yesterday.isoformat(),)).fetchone()["c"]
            )
            week_start = today - timedelta(days=today.weekday())
            week_count = int(
                conn.execute(
                    "SELECT COUNT(*) AS c FROM normalization_history WHERE date(timestamp) >= ?",
                    (week_start.isoformat(),),
                ).fetchone()["c"]
            )
            month_start = today.replace(day=1)
            month_count = int(
                conn.execute(
                    "SELECT COUNT(*) AS c FROM normalization_history WHERE date(timestamp) >= ?",
                    (month_start.isoformat(),),
                ).fetchone()["c"]
            )
        change = 0 if yesterday_count == 0 else round(((today_count - yesterday_count) / max(yesterday_count, 1)) * 100)
        trend = "STABLE"
        if change > 0:
            trend = "ACCELERATING"
        elif change < 0:
            trend = "DECELERATING"
        return {
            "timeline": [
                {"label": f"Today ({today.strftime('%b %d')})", "date": today.isoformat(), "normalized": today_count, "change": change},
                {
                    "label": f"Yesterday ({yesterday.strftime('%b %d')})",
                    "date": yesterday.isoformat(),
                    "normalized": yesterday_count,
                    "change": 0,
                },
                {"label": "This Week", "normalized": week_count, "change": change},
                {"label": "This Month", "normalized": month_count, "change": change},
            ],
            "trend": trend,
        }

    def get_reuse_payload(self) -> dict[str, Any]:
        with self._conn() as conn:
            cache_row = conn.execute(
                """
                SELECT
                    COUNT(*) AS cache_records,
                    SUM(times_reused) AS reused,
                    SUM(time_saved_total_seconds) AS saved
                FROM normalization_cache
                """
            ).fetchone()
            history_count = int(conn.execute("SELECT COUNT(*) AS c FROM normalization_history").fetchone()["c"] or 0)
            cache_records = int(cache_row["cache_records"] or 0)
            times_reused = int(cache_row["reused"] or 0)
            saved_seconds = int(cache_row["saved"] or 0)
            hit_rate = round((times_reused / max(history_count, 1)) * 100, 1)
            by_domain_rows = conn.execute(
                """
                SELECT domain, COUNT(*) AS cached, SUM(times_reused) AS reused, SUM(time_saved_total_seconds) AS saved
                FROM normalization_cache
                GROUP BY domain
                ORDER BY cached DESC
                """
            ).fetchall()
            by_domain = [
                {
                    "name": str(r["domain"]),
                    "cached": int(r["cached"] or 0),
                    "times_reused": int(r["reused"] or 0),
                    "time_saved_minutes": round(int(r["saved"] or 0) / 60, 1),
                }
                for r in by_domain_rows
            ]
            return {
                "cache_records": cache_records,
                "cache_hit_rate": hit_rate,
                "times_reused_total": times_reused,
                "time_saved_total_minutes": round(saved_seconds / 60, 1),
                "efficiency_gain": round(hit_rate * 10, 1),
                "by_domain": by_domain,
            }

    def get_quality_payload(self) -> dict[str, Any]:
        with self._conn() as conn:
            row = conn.execute(
                """
                SELECT
                    AVG(completeness_score) AS completeness,
                    AVG(CASE WHEN flagged_reasons = '[]' THEN 95 ELSE 75 END) AS agreement,
                    AVG(confidence_score) AS confidence,
                    AVG(CASE WHEN auto_approved = 1 THEN 100 ELSE 60 END) AS resolution
                FROM normalization_history
                """
            ).fetchone()
            by_domain_rows = conn.execute(
                """
                SELECT domain, AVG(completeness_score) AS completeness, AVG(confidence_score) AS confidence
                FROM normalization_history
                GROUP BY domain
                """
            ).fetchall()
            by_domain = {
                str(r["domain"]): {
                    "completeness": round(float(r["completeness"] or 0.0), 1),
                    "confidence": round(float(r["confidence"] or 0.0), 1),
                }
                for r in by_domain_rows
            }
            return {
                "completeness": round(float(row["completeness"] or 0.0), 1),
                "source_agreement": round(float(row["agreement"] or 0.0), 1),
                "avg_confidence": round(float(row["confidence"] or 0.0), 1),
                "conflict_resolution_rate": round(float(row["resolution"] or 0.0), 1),
                "by_domain": by_domain,
            }

    def export_history(self, start_date: str, end_date: str, export_format: str = "json") -> dict[str, Any]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT
                    timestamp, record_id, domain, source_system, confidence_score,
                    completeness_score, auto_approved, flagged_reasons, cache_hit,
                    time_saved_seconds, changes_json
                FROM normalization_history
                WHERE date(timestamp) BETWEEN date(?) AND date(?)
                ORDER BY timestamp ASC
                """,
                (start_date, end_date),
            ).fetchall()
            records = [dict(r) for r in rows]

        if export_format.lower() == "csv":
            out = self.export_dir / f"history_{start_date}_{end_date}.csv"
            if records:
                with out.open("w", encoding="utf-8", newline="") as handle:
                    writer = csv.DictWriter(handle, fieldnames=list(records[0].keys()))
                    writer.writeheader()
                    writer.writerows(records)
            else:
                out.write_text("", encoding="utf-8")
            return {"start_date": start_date, "end_date": end_date, "export_format": "csv", "path": str(out), "count": len(records)}

        out_json = self.export_dir / f"history_{start_date}_{end_date}.json"
        out_json.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
        return {
            "start_date": start_date,
            "end_date": end_date,
            "export_format": "json",
            "path": str(out_json),
            "count": len(records),
            "records": records,
        }
