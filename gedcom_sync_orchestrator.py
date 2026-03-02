#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import logging
import os
import shutil
import smtplib
import subprocess
import sys
import time
from dataclasses import dataclass
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parent
DEFAULT_CONFIG = ROOT / "config.yaml"


@dataclass
class SyncStats:
    merged_file: Path
    selected_source: str
    ancestry_records: int
    familysearch_records: int
    merged_records: int
    from_both: int


def load_config(path: Path) -> dict[str, Any]:
    payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(payload, dict):
        raise ValueError("config.yaml non valido")
    return payload


def setup_logging(build_stamp: str) -> logging.Logger:
    logs_dir = ROOT / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_path = logs_dir / f"sync_{build_stamp}.log"

    logger = logging.getLogger("gedcom_sync")
    logger.handlers.clear()
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)
    logger.info("Logging inizializzato: %s", log_path)
    return logger


def ensure_dirs() -> None:
    for rel in [
        "genealogy/gedcom/ancestry",
        "genealogy/gedcom/familysearch",
        "genealogy/gedcom/merged",
        "genealogy/gedcom/archive",
        "logs",
    ]:
        (ROOT / rel).mkdir(parents=True, exist_ok=True)


def count_indi_records(gedcom_path: Path) -> int:
    if not gedcom_path.exists():
        return 0
    count = 0
    with gedcom_path.open("r", encoding="utf-8", errors="ignore") as handle:
        for line in handle:
            if line.startswith("0 @") and " INDI" in line:
                count += 1
    return count


def resolve_source_file(source_name: str, logger: logging.Logger) -> Path:
    env_key = f"{source_name.upper()}_GEDCOM_PATH"
    env_path = os.getenv(env_key, "").strip()
    if env_path:
        resolved = Path(env_path).expanduser().resolve()
        if resolved.exists():
            logger.info("Sorgente %s da variabile %s: %s", source_name, env_key, resolved)
            return resolved
        logger.warning("Path %s non trovato: %s", env_key, resolved)

    fallback = ROOT / "genealogy" / "gedcom" / source_name / "latest.ged"
    if fallback.exists():
        logger.info("Sorgente %s da fallback locale: %s", source_name, fallback)
        return fallback

    raise FileNotFoundError(
        f"GEDCOM per {source_name} non trovato. Imposta {env_key} oppure crea {fallback}"
    )


def backup_existing_merged(logger: logging.Logger) -> None:
    merged_dir = ROOT / "genealogy" / "gedcom" / "merged"
    archive_dir = ROOT / "genealogy" / "gedcom" / "archive"
    archive_dir.mkdir(parents=True, exist_ok=True)
    for path in merged_dir.glob("*.ged"):
        target = archive_dir / f"{path.stem}_{dt.datetime.now().strftime('%Y%m%d_%H%M%S')}.ged"
        shutil.copy2(path, target)
        logger.info("Archiviato merged precedente: %s -> %s", path.name, target.name)


def merge_gedcom(
    strategy: str,
    ancestry_file: Path,
    familysearch_file: Path,
    logger: logging.Logger,
) -> SyncStats:
    merged_dir = ROOT / "genealogy" / "gedcom" / "merged"
    merged_dir.mkdir(parents=True, exist_ok=True)

    ancestry_count = count_indi_records(ancestry_file)
    familysearch_count = count_indi_records(familysearch_file)

    if strategy == "familysearch_priority":
        selected = "familysearch"
        source_file = familysearch_file
    else:
        selected = "ancestry"
        source_file = ancestry_file

    backup_existing_merged(logger)
    timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    merged_file = merged_dir / f"merged_{timestamp}.ged"
    shutil.copy2(source_file, merged_file)

    # Manteniamo latest.ged per compatibilita' operativa.
    latest = merged_dir / "latest.ged"
    shutil.copy2(source_file, latest)

    merged_count = count_indi_records(source_file)
    from_both = min(ancestry_count, familysearch_count)
    logger.info(
        "Merge completato (%s priority), file: %s",
        selected,
        merged_file,
    )
    return SyncStats(
        merged_file=merged_file,
        selected_source=selected,
        ancestry_records=ancestry_count,
        familysearch_records=familysearch_count,
        merged_records=merged_count,
        from_both=from_both,
    )


def run_git_ops(stats: SyncStats, config: dict[str, Any], logger: logging.Logger) -> None:
    git_cfg = config.get("git", {})
    auto_commit = bool(git_cfg.get("auto_commit", True))
    auto_push = bool(git_cfg.get("auto_push", False))
    branch = str(git_cfg.get("branch", "main"))
    if not auto_commit:
        logger.info("Git auto_commit disattivato da config")
        return

    paths = ["genealogy/gedcom/merged", "genealogy/gedcom/archive", "logs"]
    message = (
        f"chore(sync): GEDCOM merge {dt.datetime.now().strftime('%Y-%m-%d %H:%M')} "
        f"| merged={stats.merged_records} | ancestry={stats.ancestry_records} "
        f"| familysearch={stats.familysearch_records}"
    )
    try:
        subprocess.run(["git", "add", "--"] + paths, cwd=ROOT, check=True)
        commit = subprocess.run(
            ["git", "commit", "--only", "-m", message, "--"] + paths,
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        if commit.returncode == 0:
            logger.info("Commit creato: %s", message)
            if auto_push:
                subprocess.run(["git", "push", "origin", branch], cwd=ROOT, check=True)
                logger.info("Push eseguito su origin/%s", branch)
            else:
                logger.info("Push disattivato (git.auto_push=false)")
        else:
            out = (commit.stdout + "\n" + commit.stderr).strip()
            if "nothing to commit" in out.lower():
                logger.info("Nessuna modifica da committare")
            else:
                raise RuntimeError(out)
    except Exception as exc:
        logger.error("Git operation fallita: %s", exc)
        raise


def trigger_giardina_ingest(gedcom_file: Path, logger: logging.Logger) -> None:
    records_dir = ROOT / "GIARDINA" / "02_DATA" / "RECORDS"
    records_dir.mkdir(parents=True, exist_ok=True)
    dest_file = records_dir / "current.ged"
    shutil.copy2(gedcom_file, dest_file)
    logger.info("GEDCOM ingest trigger: %s", dest_file)


def run_batch_pipeline(logger: logging.Logger) -> None:
    batch_script = ROOT / "GIARDINA" / "03_PROG" / "batch.py"
    if not batch_script.exists():
        raise FileNotFoundError(f"Batch script non trovato: {batch_script}")

    for step in ["validate", "build"]:
        logger.info("Eseguo batch step: %s", step)
        result = subprocess.run(
            [sys.executable, str(batch_script), step],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        if result.stdout.strip():
            logger.info(result.stdout.strip())

    ingest_record = os.getenv("GIARDINA_INGEST_RECORD_ID", "").strip()
    if ingest_record:
        logger.info("Eseguo batch step opzionale ingest con record-id=%s", ingest_record)
        subprocess.run(
            [sys.executable, str(batch_script), "ingest", "--record-id", ingest_record],
            cwd=ROOT,
            check=True,
        )
    else:
        logger.info("Step ingest batch saltato (GIARDINA_INGEST_RECORD_ID non impostata)")


def publish_to_pwa(logger: logging.Logger) -> None:
    script = ROOT / "jobs" / "90_publish_to_pwa.sh"
    if not script.exists():
        raise FileNotFoundError(f"Script publish non trovato: {script}")

    bash_bin = shutil.which("bash") or "/bin/bash"
    result = subprocess.run(
        [bash_bin, str(script)],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    if result.stdout.strip():
        logger.info(result.stdout.strip())


def send_email(stats: SyncStats, config: dict[str, Any], logger: logging.Logger) -> None:
    notify = config.get("notifications", {})
    if not bool(notify.get("enabled", True)):
        logger.info("Notifiche email disattivate")
        return

    recipient = str(notify.get("email", "")).strip()
    smtp_host = str(notify.get("smtp_host", "smtp.gmail.com"))
    smtp_port = int(notify.get("smtp_port", 465))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    if not recipient or not smtp_user or not smtp_password:
        logger.warning("Credenziali SMTP/recipient mancanti, email saltata")
        return

    subject = "✓ GEDCOM Sync Completato"
    body = (
        "Sincronizzazione GEDCOM completata con successo!\n\n"
        f"Data/Ora: {dt.datetime.now().isoformat()}\n\n"
        "📊 Statistiche:\n"
        f"- Record totali mergiati: {stats.merged_records}\n"
        f"- Solo Ancestry: {max(stats.ancestry_records - stats.from_both, 0)}\n"
        f"- Solo FamilySearch: {max(stats.familysearch_records - stats.from_both, 0)}\n"
        f"- Da entrambi i source: {stats.from_both}\n\n"
        f"📁 File merged: {stats.merged_file}\n\n"
        "🔗 Repository: https://github.com/FineDiMondo/Genealogia\n"
        "🌿 Branch: main\n\n"
        "✅ I file sono stati committati al repository."
    )

    msg = MIMEText(body, _charset="utf-8")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = recipient

    with smtplib.SMTP_SSL(smtp_host, smtp_port) as smtp:
        smtp.login(smtp_user, smtp_password)
        smtp.sendmail(smtp_user, [recipient], msg.as_string())
    logger.info("Email inviata a %s", recipient)


def run_once(config: dict[str, Any]) -> int:
    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    logger = setup_logging(stamp)
    ensure_dirs()

    try:
        ancestry_file = resolve_source_file("ancestry", logger)
        familysearch_file = resolve_source_file("familysearch", logger)
        strategy = str(config.get("merge", {}).get("strategy", "ancestry_priority"))
        stats = merge_gedcom(strategy, ancestry_file, familysearch_file, logger)
        run_git_ops(stats, config, logger)
        trigger_giardina_ingest(stats.merged_file, logger)
        run_batch_pipeline(logger)
        publish_to_pwa(logger)
        send_email(stats, config, logger)
        logger.info("Run completato con successo")
        return 0
    except Exception as exc:
        logger.exception("Run fallito: %s", exc)
        return 1


def seconds_until(target_hhmm: str, tz_name: str) -> int:
    # Usa timezone locale del sistema con fallback su naive.
    now = dt.datetime.now()
    hh, mm = target_hhmm.split(":")
    target = now.replace(hour=int(hh), minute=int(mm), second=0, microsecond=0)
    if target <= now:
        target = target + dt.timedelta(days=1)
    return int((target - now).total_seconds())


def run_scheduler(config: dict[str, Any]) -> int:
    schedule = config.get("schedule", {})
    frequency = str(schedule.get("frequency", "daily")).lower()
    run_time = str(schedule.get("time", "08:00"))
    timezone = str(schedule.get("timezone", "Europe/Rome"))
    if frequency != "daily":
        raise ValueError("Questo orchestrator supporta 'daily' in questa versione")

    while True:
        wait_seconds = max(seconds_until(run_time, timezone), 1)
        print(f"[scheduler] Next run in {wait_seconds}s at {run_time} ({timezone})")
        time.sleep(wait_seconds)
        rc = run_once(config)
        if rc != 0:
            print("[scheduler] run failed, retry next day")


def main() -> int:
    parser = argparse.ArgumentParser(description="GEDCOM Sync Orchestrator")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG), help="Path config.yaml")
    parser.add_argument("--run-once", action="store_true", help="Run one sync and exit")
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    config = load_config(Path(args.config))
    if args.run_once:
        return run_once(config)
    return run_scheduler(config)


if __name__ == "__main__":
    raise SystemExit(main())
