"""NORM_AGT: normalization + dedup/conflict detection (phase 4b)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from tools.agents.contracts import AgentContract
from tools.agents.message_bus import MessageBus


def _jaro_winkler(s1: str, s2: str) -> float:
    if s1 == s2:
        return 1.0
    if not s1 or not s2:
        return 0.0

    len1, len2 = len(s1), len(s2)
    match_distance = max(len1, len2) // 2 - 1
    s1_matches = [False] * len1
    s2_matches = [False] * len2

    matches = 0
    for i in range(len1):
        start = max(0, i - match_distance)
        end = min(i + match_distance + 1, len2)
        for j in range(start, end):
            if s2_matches[j] or s1[i] != s2[j]:
                continue
            s1_matches[i] = True
            s2_matches[j] = True
            matches += 1
            break

    if matches == 0:
        return 0.0

    t = 0
    k = 0
    for i in range(len1):
        if not s1_matches[i]:
            continue
        while not s2_matches[k]:
            k += 1
        if s1[i] != s2[k]:
            t += 1
        k += 1
    transpositions = t / 2

    jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0

    prefix = 0
    for i in range(min(4, len1, len2)):
        if s1[i] == s2[i]:
            prefix += 1
        else:
            break

    return jaro + 0.1 * prefix * (1 - jaro)


@dataclass
class PersonNorm:
    person_id: str
    full_name: str
    sex: str


class NormAgent:
    contract = AgentContract(
        agent_id='NORM_AGT',
        version='1.0.0',
        subscribes_to=['parse.completed'],
        publishes_to=['norm.completed', 'norm.conflict'],
    )

    def __init__(self, bus: MessageBus) -> None:
        self.contract.validate()
        self.bus = bus
        self.bus.subscribe('parse.completed', self._on_parse_completed)

    @staticmethod
    def _event_id(prefix: str) -> str:
        return f'{prefix}-{uuid4().hex[:12]}'

    @staticmethod
    def _to_person_id(xref: str | None, idx: int) -> str:
        if xref:
            clean = xref.strip('@').replace('@', '')
            return f'GN-{clean}'
        return f'GN-AUTO-{idx:06d}'

    @staticmethod
    def _to_family_id(xref: str | None, idx: int) -> str:
        if xref:
            clean = xref.strip('@').replace('@', '')
            return f'GNF-{clean}'
        return f'GNF-AUTO-{idx:06d}'

    @staticmethod
    def _extract_value(record: Dict[str, Any], tag: str) -> str:
        for c in record.get('children', []):
            if c.get('tag') == tag:
                return str(c.get('value') or '')
        return ''

    @staticmethod
    def _parse_name(name_raw: str) -> Tuple[str, str, str]:
        txt = ' '.join(name_raw.replace('/', ' / ').split())
        if '/' in txt:
            parts = txt.split('/')
            given = parts[0].strip()
            surname = parts[1].strip() if len(parts) > 1 else ''
        else:
            bits = txt.split()
            given = ' '.join(bits[:-1]) if len(bits) > 1 else txt
            surname = bits[-1] if len(bits) > 1 else ''
        full = f"{given} {surname}".strip()
        return given, surname, full

    def _on_parse_completed(self, message: Dict[str, Any]) -> None:
        result = self.process(message)
        self.bus.publish('norm.completed', result['completed'])
        if result['conflicts']:
            self.bus.publish('norm.conflict', result['conflicts'])

    def process(self, message: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        records = message.get('records', [])
        source_name = str(message.get('source_name', 'inline'))
        source_id = str(message.get('source_id', 'S-IMPORT-AUTO'))

        operations: List[Dict[str, Any]] = []
        persons: List[PersonNorm] = []
        families = 0

        person_idx = 1
        family_idx = 1
        for rec in records:
            tag = rec.get('tag')
            if tag == 'INDI':
                person_id = self._to_person_id(rec.get('xref'), person_idx)
                person_idx += 1
                name_raw = self._extract_value(rec, 'NAME')
                sex = self._extract_value(rec, 'SEX')[:1].upper() or 'U'
                if sex not in {'M', 'F', 'U'}:
                    sex = 'U'
                given, surname, full = self._parse_name(name_raw)

                persons.append(PersonNorm(person_id=person_id, full_name=full.upper(), sex=sex))

                operations.append(
                    {
                        'entity_type': 'PERSON',
                        'entity_id': person_id,
                        'operation': 'person.upsert',
                        'payload': {
                            'sex': sex,
                            'reliability': 'E',
                            'source_id': source_id,
                            'hash_state': f'norm:{person_id}:{full.upper()}',
                            'state': {'name': full, 'given_name': given, 'surname': surname},
                        },
                    }
                )

            elif tag == 'FAM':
                family_id = self._to_family_id(rec.get('xref'), family_idx)
                family_idx += 1
                families += 1
                operations.append(
                    {
                        'entity_type': 'FAMILY',
                        'entity_id': family_id,
                        'operation': 'sql.exec',
                        'payload': {
                            'sql': (
                                "INSERT OR IGNORE INTO family(family_id, reliability, source_id) "
                                "VALUES (?, ?, ?)"
                            ),
                            'params': [family_id, 'E', source_id],
                            'state': {'family_id': family_id},
                        },
                    }
                )

        conflicts: List[Dict[str, Any]] = []
        dedup_candidates = 0
        scores: List[float] = []
        for i in range(len(persons)):
            for j in range(i + 1, len(persons)):
                a = persons[i]
                b = persons[j]
                score = _jaro_winkler(a.full_name, b.full_name)
                scores.append(score)
                if score >= 0.92:
                    dedup_candidates += 1
                elif 0.85 <= score < 0.92:
                    conflicts.append(
                        {
                            'entity_type': 'PERSON_PAIR',
                            'entity_id': f'{a.person_id}|{b.person_id}',
                            'field_name': 'name_similarity',
                            'value_a': a.full_name,
                            'value_b': b.full_name,
                            'status': 'OPEN',
                            'confidence': round(score, 4),
                            'source': source_name,
                        }
                    )

        avg_conf = round(sum(scores) / len(scores), 4) if scores else 1.0

        completed_msg = {
            'event_id': self._event_id('norm-completed'),
            'agent_id': self.contract.agent_id,
            'source_name': source_name,
            'operations': operations,
            'metrics': {
                'persons': len(persons),
                'families': families,
                'dedup_candidates': dedup_candidates,
                'conflicts': len(conflicts),
                'avg_confidence': avg_conf,
            },
        }

        conflict_msg = {
            'event_id': self._event_id('norm-conflict'),
            'agent_id': self.contract.agent_id,
            'source_name': source_name,
            'conflicts': conflicts,
        }

        return {'completed': completed_msg, 'conflicts': conflict_msg if conflicts else {}}