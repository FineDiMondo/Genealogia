"""Agent pipeline orchestrator: IMPORT -> NORMALIZE -> VALIDATE -> JOURNAL."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable

from tools.agents.expl_agent import ExplAgent
from tools.agents.message_bus import MessageBus
from tools.agents.norm_agent import NormAgent
from tools.agents.parse_agent import ParseAgent
from tools.agents.valid_agent import ValidAgent
from tools.db.transaction_manager import TransactionManager


class AgentPipeline:
    def __init__(self, db_path: str | Path, migrations: Iterable[str | Path]) -> None:
        self.bus = MessageBus()
        self.tm = TransactionManager(db_path, migrations)
        self.tm.apply_migrations()

        self.parse_agent = ParseAgent(self.bus)
        self.norm_agent = NormAgent(self.bus)
        self.valid_agent = ValidAgent(self.bus)
        self.expl_agent = ExplAgent(self.bus)

        self.bus.subscribe('parse.completed', self._on_parse_completed)
        self.bus.subscribe('norm.completed', self._on_norm_completed)
        self.bus.subscribe('norm.conflict', self._on_norm_conflict)
        self.bus.subscribe('valid.violation', self._on_valid_violation)
        self.bus.subscribe('valid.clear', self._on_valid_clear)

    def _audit_write(self, agent_id: str, session_id: str, user_cmd: str, payload: Dict[str, Any]) -> None:
        self.tm.write(
            entity_type='PIPELINE',
            entity_id='IMPORT',
            operation='sql.exec',
            payload={'sql': 'SELECT 1', 'params': [], 'state': payload},
            agent_id=agent_id,
            session_id=session_id,
            user_cmd=user_cmd,
        )

    def _on_parse_completed(self, message: Dict[str, Any]) -> None:
        session_id = str(message.get('session_id', 'sess-default'))
        user_cmd = str(message.get('user_cmd', 'IMPORT'))
        self._audit_write(
            agent_id='PARSE_AGT',
            session_id=session_id,
            user_cmd=user_cmd,
            payload={
                'counts': message.get('counts', {}),
                'source_name': message.get('source_name'),
            },
        )

    def _on_norm_completed(self, message: Dict[str, Any]) -> None:
        session_id = str(message.get('session_id', 'sess-default'))
        user_cmd = str(message.get('user_cmd', 'IMPORT'))

        for op in message.get('operations', []):
            self.tm.write(
                entity_type=op.get('entity_type', 'UNKNOWN'),
                entity_id=op.get('entity_id', 'UNKNOWN'),
                operation=op.get('operation', 'sql.exec'),
                payload=op.get('payload', {'sql': 'SELECT 1', 'params': []}),
                agent_id='NORM_AGT',
                session_id=session_id,
                user_cmd=user_cmd,
            )

        self._audit_write(
            agent_id='NORM_AGT',
            session_id=session_id,
            user_cmd=user_cmd,
            payload={'metrics': message.get('metrics', {})},
        )

    def _on_norm_conflict(self, message: Dict[str, Any]) -> None:
        session_id = str(message.get('session_id', 'sess-default'))
        user_cmd = str(message.get('user_cmd', 'IMPORT'))
        for cf in message.get('conflicts', []):
            payload = {
                'sql': (
                    'INSERT INTO conflict_log(entity_type, entity_id, field_name, value_a, value_b, status, resolution_note) '
                    'VALUES (?, ?, ?, ?, ?, ?, ?)'
                ),
                'params': [
                    cf.get('entity_type'),
                    cf.get('entity_id'),
                    cf.get('field_name'),
                    cf.get('value_a'),
                    cf.get('value_b'),
                    'OPEN',
                    f"confidence={cf.get('confidence')}",
                ],
                'state': cf,
            }
            self.tm.write(
                entity_type='CONFLICT',
                entity_id=str(cf.get('entity_id', 'unknown')),
                operation='sql.exec',
                payload=payload,
                agent_id='NORM_AGT',
                session_id=session_id,
                user_cmd=user_cmd,
            )

    def _on_valid_violation(self, message: Dict[str, Any]) -> None:
        session_id = str(message.get('session_id', 'sess-default'))
        user_cmd = str(message.get('user_cmd', 'IMPORT'))
        for v in message.get('violations', []):
            payload = {
                'sql': (
                    'INSERT INTO conflict_log(entity_type, entity_id, field_name, value_a, value_b, status, resolution_note) '
                    'VALUES (?, ?, ?, ?, ?, ?, ?)'
                ),
                'params': [
                    v.get('entity_type'),
                    v.get('entity_id'),
                    v.get('rule'),
                    '',
                    '',
                    'OPEN',
                    v.get('message'),
                ],
                'state': v,
            }
            self.tm.write(
                entity_type='VALIDATION',
                entity_id=str(v.get('entity_id', 'unknown')),
                operation='sql.exec',
                payload=payload,
                agent_id='VALID_AGT',
                session_id=session_id,
                user_cmd=user_cmd,
            )

        self._audit_write(
            agent_id='VALID_AGT',
            session_id=session_id,
            user_cmd=user_cmd,
            payload={'summary': message.get('summary', {})},
        )

    def _on_valid_clear(self, message: Dict[str, Any]) -> None:
        session_id = str(message.get('session_id', 'sess-default'))
        user_cmd = str(message.get('user_cmd', 'IMPORT'))
        self._audit_write(
            agent_id='VALID_AGT',
            session_id=session_id,
            user_cmd=user_cmd,
            payload={'summary': message.get('summary', {}), 'clear': True},
        )

    def _ensure_source(self, source_id: str, source_name: str, session_id: str, user_cmd: str) -> None:
        self.tm.write(
            entity_type='SOURCE',
            entity_id=source_id,
            operation='sql.exec',
            payload={
                'sql': 'INSERT OR IGNORE INTO source(source_id, source_type, title) VALUES (?, ?, ?)',
                'params': [source_id, 'GEDCOM', source_name],
                'state': {'source_id': source_id, 'source_name': source_name},
            },
            agent_id='SYNC_AGT',
            session_id=session_id,
            user_cmd=user_cmd,
        )

    def import_gedcom(self, raw_text: str, source_name: str, session_id: str, source_id: str = 'S-IMPORT-AUTO') -> Dict[str, Any]:
        user_cmd = f'IMPORT GEDCOM {source_name}'
        self._ensure_source(source_id, source_name, session_id, user_cmd)

        before = {
            'parse': len(self.bus.history('parse.completed')),
            'norm': len(self.bus.history('norm.completed')),
            'valid_err': len(self.bus.history('valid.violation')),
            'valid_ok': len(self.bus.history('valid.clear')),
        }

        self.bus.publish(
            'user.request.parse',
            {
                'event_id': f'req-{session_id}',
                'payload': {
                    'raw_text': raw_text,
                    'source_name': source_name,
                    'source_id': source_id,
                    'session_id': session_id,
                    'user_cmd': user_cmd,
                },
            },
        )

        parse_events = self.bus.history('parse.completed')[before['parse']:]
        norm_events = self.bus.history('norm.completed')[before['norm']:]
        valid_viol = self.bus.history('valid.violation')[before['valid_err']:]
        valid_clear = self.bus.history('valid.clear')[before['valid_ok']:]

        replay = self.tm.replay(session_id)
        return {
            'session_id': session_id,
            'parse_completed': len(parse_events),
            'norm_completed': len(norm_events),
            'valid_violations': len(valid_viol),
            'valid_clear': len(valid_clear),
            'replay': replay,
            'parse_counts': parse_events[-1]['counts'] if parse_events else {},
            'norm_metrics': norm_events[-1]['metrics'] if norm_events else {},
        }

    def explain_last(self) -> Dict[str, Any]:
        self.bus.publish('user.request.explain', {'event_id': 'req-explain', 'payload': {'mode': 'last'}})
        events = self.bus.history('explain.completed')
        return events[-1] if events else {'trace': [], 'summary': 'No explain output'}

    def dump_journal(self, session_id: str) -> str:
        replay = self.tm.replay(session_id)
        return json.dumps(replay, ensure_ascii=True, sort_keys=True)