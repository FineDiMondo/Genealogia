"""PARSE_AGT: deterministic GEDCOM parser agent (phase 4b)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from uuid import uuid4

from tools.agents.contracts import AgentContract
from tools.agents.message_bus import MessageBus


GEDCOM_RE = re.compile(r"^(?P<level>\d+)\s+(?:(?P<xref>@[^@]+@)\s+)?(?P<tag>[A-Z0-9_]+)(?:\s+(?P<value>.*))?$")


@dataclass
class ParseNode:
    line: int
    level: int
    tag: str
    xref: Optional[str]
    value: str
    children: List['ParseNode']

    def to_dict(self) -> Dict[str, Any]:
        return {
            'line': self.line,
            'level': self.level,
            'tag': self.tag,
            'xref': self.xref,
            'value': self.value,
            'children': [c.to_dict() for c in self.children],
        }


class ParseAgent:
    contract = AgentContract(
        agent_id='PARSE_AGT',
        version='1.0.0',
        subscribes_to=['user.request.parse'],
        publishes_to=['parse.completed', 'parse.error'],
    )

    def __init__(self, bus: MessageBus) -> None:
        self.contract.validate()
        self.bus = bus
        self.bus.subscribe('user.request.parse', self._on_parse_request)

    @staticmethod
    def _event_id(prefix: str) -> str:
        return f'{prefix}-{uuid4().hex[:12]}'

    def _on_parse_request(self, message: Dict[str, Any]) -> None:
        payload = message.get('payload', {})
        result = self.process(payload)
        self.bus.publish(result['topic'], result['message'])

    def process(self, message: Dict[str, Any]) -> Dict[str, Any]:
        raw_text = message.get('raw_text')
        source_name = str(message.get('source_name', 'inline'))
        if not isinstance(raw_text, str) or not raw_text.strip():
            return {
                'topic': 'parse.error',
                'message': {
                    'event_id': self._event_id('parse-error'),
                    'agent_id': self.contract.agent_id,
                    'source_name': source_name,
                    'errors': [{'line': 0, 'message': 'raw_text is required'}],
                },
            }

        roots: List[ParseNode] = []
        stack: List[ParseNode] = []
        errors: List[Dict[str, Any]] = []

        for idx, line in enumerate(raw_text.replace('\r\n', '\n').split('\n'), start=1):
            if not line.strip():
                continue
            m = GEDCOM_RE.match(line)
            if not m:
                errors.append({'line': idx, 'message': f'invalid GEDCOM syntax: {line}'})
                continue

            node = ParseNode(
                line=idx,
                level=int(m.group('level')),
                tag=m.group('tag'),
                xref=m.group('xref'),
                value=(m.group('value') or '').strip(),
                children=[],
            )

            while stack and stack[-1].level >= node.level:
                stack.pop()

            if stack:
                stack[-1].children.append(node)
            else:
                roots.append(node)
            stack.append(node)

        if errors:
            return {
                'topic': 'parse.error',
                'message': {
                    'event_id': self._event_id('parse-error'),
                    'agent_id': self.contract.agent_id,
                    'source_name': source_name,
                    'errors': errors,
                },
            }

        records = [r.to_dict() for r in roots if r.level == 0]
        counts = {
            'lines': len(raw_text.splitlines()),
            'records_total': len(records),
            'individuals': sum(1 for r in records if r['tag'] == 'INDI'),
            'families': sum(1 for r in records if r['tag'] == 'FAM'),
        }

        return {
            'topic': 'parse.completed',
            'message': {
                'event_id': self._event_id('parse-completed'),
                'agent_id': self.contract.agent_id,
                'source_name': source_name,
                'records': records,
                'counts': counts,
            },
        }