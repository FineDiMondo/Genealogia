"""VALID_AGT: business validation agent (phase 4c)."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import uuid4

from tools.agents.contracts import AgentContract
from tools.agents.message_bus import MessageBus

YEAR_RE = re.compile(r"(\d{4})")


class ValidAgent:
    contract = AgentContract(
        agent_id='VALID_AGT',
        version='1.0.0',
        subscribes_to=['norm.completed'],
        publishes_to=['valid.violation', 'valid.clear'],
    )

    def __init__(self, bus: MessageBus) -> None:
        self.contract.validate()
        self.bus = bus
        self.bus.subscribe('norm.completed', self._on_norm_completed)

    @staticmethod
    def _event_id(prefix: str) -> str:
        return f'{prefix}-{uuid4().hex[:12]}'

    @staticmethod
    def _extract_year(text: str) -> Optional[int]:
        if not text:
            return None
        m = YEAR_RE.search(str(text))
        return int(m.group(1)) if m else None

    def _on_norm_completed(self, message: Dict[str, Any]) -> None:
        result = self.process(message)
        topic = 'valid.violation' if result['violations'] else 'valid.clear'
        self.bus.publish(topic, result)

    def process(self, message: Dict[str, Any]) -> Dict[str, Any]:
        operations = message.get('operations', [])
        source_name = str(message.get('source_name', 'inline'))

        births: Dict[str, int] = {}
        families: Dict[str, Dict[str, str]] = {}
        parent_child: Dict[str, Set[str]] = {}
        child_births: Dict[str, List[int]] = {}

        for op in operations:
            entity_type = op.get('entity_type')
            payload = op.get('payload', {})
            entity_id = op.get('entity_id')

            if entity_type == 'PERSON':
                st = payload.get('state', {})
                yr = self._extract_year(st.get('birth_year') or st.get('birth_date') or '')
                if yr is not None:
                    births[str(entity_id)] = yr

            if entity_type == 'FAMILY':
                st = payload.get('state', {})
                father = st.get('father_id') or st.get('partner_a_id')
                mother = st.get('mother_id') or st.get('partner_b_id')
                children = st.get('children', [])
                fam = {'father': father, 'mother': mother, 'children': children}
                families[str(entity_id)] = fam

        # Build parent->child adjacency for cycle detection + biological checks
        for fam in families.values():
            for p in [fam.get('father'), fam.get('mother')]:
                if p:
                    parent_child.setdefault(p, set())
                    for c in fam.get('children') or []:
                        parent_child[p].add(c)
                        if c in births:
                            child_births.setdefault(p, []).append(births[c])

        violations: List[Dict[str, Any]] = []

        # 1) Cycle check via DFS
        visited: Set[str] = set()
        stack: Set[str] = set()

        def dfs(node: str) -> bool:
            if node in stack:
                return True
            if node in visited:
                return False
            visited.add(node)
            stack.add(node)
            for nxt in parent_child.get(node, set()):
                if dfs(nxt):
                    return True
            stack.remove(node)
            return False

        for n in list(parent_child.keys()):
            if dfs(n):
                violations.append(
                    {
                        'severity': 'ERROR',
                        'rule': 'genealogy_cycle',
                        'entity_type': 'GRAPH',
                        'entity_id': n,
                        'message': 'Detected cycle in parent-child graph',
                    }
                )
                break

        # 2) Biological age range check
        current_year = datetime.utcnow().year
        for parent, child_years in child_births.items():
            p_birth = births.get(parent)
            if p_birth is None:
                continue
            for cy in child_years:
                age = cy - p_birth
                if age < 12:
                    violations.append(
                        {
                            'severity': 'ERROR',
                            'rule': 'biological_age_min',
                            'entity_type': 'PERSON',
                            'entity_id': parent,
                            'message': f'Parent age at child birth too low: {age}',
                        }
                    )
                if age > 80:
                    violations.append(
                        {
                            'severity': 'WARN',
                            'rule': 'biological_age_max',
                            'entity_type': 'PERSON',
                            'entity_id': parent,
                            'message': f'Parent age at child birth unusually high: {age}',
                        }
                    )
            if current_year - p_birth > 120:
                violations.append(
                    {
                        'severity': 'WARN',
                        'rule': 'person_longevity_outlier',
                        'entity_type': 'PERSON',
                        'entity_id': parent,
                        'message': f'Person age exceeds 120 years: {current_year - p_birth}',
                    }
                )

        # 3) Sibling spacing check (same family children)
        for fam_id, fam in families.items():
            years: List[int] = []
            for child in fam.get('children') or []:
                if child in births:
                    years.append(births[child])
            years.sort()
            for i in range(1, len(years)):
                if years[i] == years[i - 1]:
                    violations.append(
                        {
                            'severity': 'WARN',
                            'rule': 'sibling_same_year',
                            'entity_type': 'FAMILY',
                            'entity_id': fam_id,
                            'message': f'Siblings with identical birth year: {years[i]}',
                        }
                    )

        return {
            'event_id': self._event_id('valid-result'),
            'agent_id': self.contract.agent_id,
            'source_name': source_name,
            'violations': violations,
            'summary': {
                'errors': sum(1 for v in violations if v['severity'] == 'ERROR'),
                'warns': sum(1 for v in violations if v['severity'] == 'WARN'),
                'infos': sum(1 for v in violations if v['severity'] == 'INFO'),
            },
        }