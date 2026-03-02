import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, Iterable, Optional


ZERO_HASH = '0' * 64


class TransactionManager:
    """Single write-path manager for GN370 SQLite persistence.

    Invariant: every SQLite connection opened by this class registers `sha256()`
    before executing SQL. This is required by migration 003 trigger
    `trg_event_journal_hash_chain_insert`.
    """

    def __init__(self, db_path: str | Path, migrations: Optional[Iterable[str | Path]] = None) -> None:
        self.db_path = str(db_path)
        self.migrations = [str(m) for m in (migrations or [])]

    @staticmethod
    def _sha256_hex(text: Any) -> str:
        if text is None:
            text = ''
        return hashlib.sha256(str(text).encode('utf-8')).hexdigest()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.execute('PRAGMA foreign_keys = ON;')
        conn.create_function('sha256', 1, self._sha256_hex)
        return conn

    def apply_migrations(self) -> None:
        conn = self._connect()
        try:
            for migration in self.migrations:
                sql = Path(migration).read_text(encoding='utf-8')
                conn.executescript(sql)
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def _canonical_payload(payload: Dict[str, Any]) -> str:
        return json.dumps(payload, sort_keys=True, separators=(',', ':'))

    def _compute_entry_hash(self, prev_hash: str, payload_json: str) -> str:
        return self._sha256_hex(f"{prev_hash}{payload_json}")

    @staticmethod
    def _event_class(operation: str) -> str:
        return operation.upper().replace('.', '_')

    @staticmethod
    def _apply_operation(conn: sqlite3.Connection, operation: str, payload: Dict[str, Any], entity_id: str) -> None:
        if operation == 'person.upsert':
            conn.execute(
                """
                INSERT INTO person(person_id, sex, reliability, source_id, hash_state)
                VALUES(?, ?, ?, ?, ?)
                ON CONFLICT(person_id) DO UPDATE SET
                    sex=excluded.sex,
                    reliability=excluded.reliability,
                    source_id=excluded.source_id,
                    hash_state=excluded.hash_state
                """,
                (
                    entity_id,
                    payload['sex'],
                    payload['reliability'],
                    payload.get('source_id'),
                    payload['hash_state'],
                ),
            )
            return

        if operation == 'sql.exec':
            conn.execute(payload['sql'], tuple(payload.get('params', [])))
            return

        raise ValueError(f'Unsupported operation: {operation}')

    def write(
        self,
        entity_type: str,
        entity_id: str,
        operation: str,
        payload: Dict[str, Any],
        agent_id: str,
        session_id: str,
        user_cmd: str,
    ) -> Dict[str, Any]:
        payload_json = self._canonical_payload(payload)
        event_class = self._event_class(operation)

        conn = self._connect()
        try:
            conn.execute('BEGIN')

            existing = conn.execute(
                """
                SELECT journal_id, entry_hash
                FROM event_journal
                WHERE session_id = ?
                  AND event_class = ?
                  AND entity_type = ?
                  AND entity_id = ?
                  AND payload = ?
                ORDER BY journal_id DESC
                LIMIT 1
                """,
                (session_id, event_class, entity_type, entity_id, payload_json),
            ).fetchone()
            if existing:
                conn.execute('ROLLBACK')
                return {
                    'journal_id': existing[0],
                    'entry_hash': existing[1],
                    'status': 'duplicate',
                }

            self._apply_operation(conn, operation, payload, entity_id)

            tip = conn.execute(
                "SELECT entry_hash FROM event_journal ORDER BY journal_id DESC LIMIT 1"
            ).fetchone()
            prev_hash = tip[0] if tip else ZERO_HASH
            entry_hash = self._compute_entry_hash(prev_hash, payload_json)

            cur = conn.execute(
                """
                INSERT INTO event_journal(
                    agent_id, event_class, entity_type, entity_id,
                    payload, session_id, user_cmd, prev_hash, entry_hash
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    agent_id,
                    event_class,
                    entity_type,
                    entity_id,
                    payload_json,
                    session_id,
                    user_cmd,
                    prev_hash,
                    entry_hash,
                ),
            )
            journal_id = cur.lastrowid
            conn.commit()
            return {
                'journal_id': journal_id,
                'entry_hash': entry_hash,
                'status': 'written',
            }
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def replay(self, session_id: str) -> Dict[str, Any]:
        conn = self._connect()
        try:
            rows = conn.execute(
                """
                SELECT journal_id, entity_type, entity_id, payload, prev_hash, entry_hash
                FROM event_journal
                WHERE session_id = ?
                ORDER BY journal_id ASC
                """,
                (session_id,),
            ).fetchall()

            state: Dict[str, Any] = {}
            chain_valid = True
            for _, entity_type, entity_id, payload_json, prev_hash, entry_hash in rows:
                expected = self._compute_entry_hash(prev_hash, payload_json)
                if expected.lower() != str(entry_hash).lower():
                    chain_valid = False

                payload_obj = json.loads(payload_json)
                key = f"{entity_type}:{entity_id}"
                if isinstance(payload_obj, dict) and 'state' in payload_obj:
                    state[key] = payload_obj['state']
                else:
                    state[key] = payload_obj

            return {
                'session_id': session_id,
                'entries': len(rows),
                'chain_valid': chain_valid,
                'state': state,
            }
        finally:
            conn.close()