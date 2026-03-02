"""Text shell runner for GN370 standard mode (phase 5a)."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict, List

from tools.agents.cli_parser import CommandParser, CommandSpec, ParseError
from tools.agents.pipeline_runner import AgentPipeline
from tools.agents.suggest import suggest_commands


class ShellSession:
    def __init__(self, db_path: str | Path, migrations: List[str | Path]) -> None:
        self.db_path = str(db_path)
        self.migrations = [str(m) for m in migrations]
        self.pipeline = AgentPipeline(self.db_path, self.migrations)
        self.parser = CommandParser()

        self.history: List[str] = []
        self.context: Dict[str, str] = {'entity_type': '', 'entity_id': '', 'screen': 'MAIN', 'last_command': ''}
        self.stack: List[Dict[str, str]] = []

    def run(self, raw: str) -> Dict[str, object]:
        self.history.append(raw)
        self.context['last_command'] = raw
        try:
            cmd = self.parser.parse(raw)
        except ParseError as e:
            suggestions = suggest_commands(None, {'raw': raw, **self.context}, parse_error=e)
            return {
                'ok': False,
                'code': e.code,
                'output': f"(ERR) {e.code}: {e.message} | hint: {e.hint}",
                'suggestions': [s.__dict__ for s in suggestions],
            }

        output = self._execute(cmd)
        suggestions = suggest_commands(cmd, self.context)
        return {'ok': True, 'output': output, 'suggestions': [s.__dict__ for s in suggestions]}

    def _execute(self, cmd: CommandSpec) -> str:
        v = cmd.verb
        if v == 'help':
            return self._help()
        if v == 'menu':
            return self._menu()
        if v == 'back':
            return self._back()
        if v == 'feed':
            return self._feed(cmd)
        if v == 'open':
            return self._open(cmd)
        if v == 'show':
            return self._show(cmd)
        if v == 'job':
            return self._job(cmd)
        if v == 'explain':
            return self._explain()
        if v in {'find', 'story', 'db', 'cache', 'refresh', 'quit'}:
            return f"(OK) command {v} accepted (stub phase 5a)"
        return f"(ERR) unsupported command: {cmd.raw}"

    @staticmethod
    def _help() -> str:
        return (
            'GN370 HELP | verbs: feed find open show story job db cache help back menu explain '\
            '| aliases: h b m r q'
        )

    @staticmethod
    def _menu() -> str:
        return 'MAIN MENU | 1) feed /last 10 | 2) job run pipeline | 3) open person <id> | 4) show card'

    def _back(self) -> str:
        if not self.stack:
            return '(WRN) no previous context'
        self.context = self.stack.pop()
        return f"(OK) context restored {self.context.get('entity_type')}:{self.context.get('entity_id')}"

    def _feed(self, cmd: CommandSpec) -> str:
        last = int(cmd.options.get('last', 10)) if isinstance(cmd.options.get('last', 10), str) else 10
        ftype = str(cmd.options.get('type', '')) if 'type' in cmd.options else ''

        conn = sqlite3.connect(self.db_path)
        q = 'SELECT agent_id, event_class, entity_type, entity_id FROM event_journal'
        params = []
        if ftype:
            q += ' WHERE event_class = ?'
            params.append(ftype.upper())
        q += ' ORDER BY journal_id DESC LIMIT ?'
        params.append(last)
        rows = conn.execute(q, tuple(params)).fetchall()
        conn.close()

        lines = [f"{r[0]} {r[1]} {r[2]}:{r[3]}" for r in rows]
        return '\n'.join(lines) if lines else '(OK) feed empty'

    def _open(self, cmd: CommandSpec) -> str:
        if len(cmd.args) < 2:
            return '(ERR) open requires target and id, example: open person GN-0001'
        kind = cmd.args[0].lower()
        eid = cmd.args[1]
        self.stack.append(dict(self.context))
        self.context['entity_type'] = kind
        self.context['entity_id'] = eid
        self.context['screen'] = f'OPEN_{kind.upper()}'
        return f'(OK) opened {kind} {eid}'

    def _show(self, cmd: CommandSpec) -> str:
        target = cmd.args[0].lower() if cmd.args else 'card'
        if target == 'card':
            if not self.context.get('entity_id'):
                return '(WRN) no active context'
            if self.context.get('entity_type') == 'person':
                conn = sqlite3.connect(self.db_path)
                row = conn.execute(
                    'SELECT person_id, sex, reliability, source_id FROM person WHERE person_id = ?',
                    (self.context['entity_id'],),
                ).fetchone()
                conn.close()
                if not row:
                    return '(WRN) person not found in db'
                return f'CARD PERSON {row[0]} | sex={row[1]} reliability={row[2]} source={row[3]}'
            return f"CARD {self.context.get('entity_type')} {self.context.get('entity_id')}"
        if target == 'timeline':
            return f"TIMELINE {self.context.get('entity_type')} {self.context.get('entity_id')} (stub phase 5a)"
        return f"(WRN) unsupported show target: {target}"

    def _job(self, cmd: CommandSpec) -> str:
        if len(cmd.args) >= 2 and cmd.args[0] == 'run' and cmd.args[1] in {'pipeline', 'import_norm_validate_journal'}:
            sample = '\n'.join(
                [
                    '0 @I1@ INDI',
                    '1 NAME Mario /Rossi/',
                    '1 SEX M',
                    '0 @I2@ INDI',
                    '1 NAME Maria /Rosi/',
                    '1 SEX F',
                    '0 @F1@ FAM',
                    '1 HUSB @I1@',
                    '1 WIFE @I2@',
                ]
            )
            session_id = f"sess-shell-{len(self.history)}"
            res = self.pipeline.import_gedcom(sample, 'shell_job.ged', session_id=session_id, source_id='S-SHELL')
            return (
                f"(OK) pipeline run complete | parse={res['parse_completed']} norm={res['norm_completed']} "
                f"viol={res['valid_violations']} journal={res['replay']['entries']}"
            )
        return '(ERR) job syntax: job run pipeline'

    def _explain(self) -> str:
        ex = self.pipeline.explain_last()
        trace = ex.get('trace', [])
        if not trace:
            return '(WRN) no explain trace available'
        lines = [f"EXPLAIN {ex.get('summary', '')}"]
        for t in trace:
            lines.append(f"- {t.get('topic')} via {t.get('agent_id')} ({t.get('event_id')})")
        return '\n'.join(lines)