"""EXPL_AGT: dependency tracing agent (phase 4c)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4

from tools.agents.contracts import AgentContract
from tools.agents.message_bus import MessageBus


class ExplAgent:
    contract = AgentContract(
        agent_id='EXPL_AGT',
        version='1.0.0',
        subscribes_to=['*', 'user.request.explain'],
        publishes_to=['explain.completed'],
    )

    def __init__(self, bus: MessageBus) -> None:
        self.contract.validate()
        self.bus = bus
        self.graph: List[Dict[str, Any]] = []

        # explicit subscriptions for topics used in v1
        for topic in [
            'parse.completed',
            'parse.error',
            'norm.completed',
            'norm.conflict',
            'valid.violation',
            'valid.clear',
        ]:
            self.bus.subscribe(topic, self._capture(topic))

        self.bus.subscribe('user.request.explain', self._on_explain_request)

    @staticmethod
    def _event_id(prefix: str) -> str:
        return f'{prefix}-{uuid4().hex[:12]}'

    def _capture(self, topic: str):
        def handler(message: Dict[str, Any]) -> None:
            self.graph.append(
                {
                    'topic': topic,
                    'event_id': message.get('event_id'),
                    'agent_id': message.get('agent_id'),
                    'source_name': message.get('source_name'),
                    'message': message,
                }
            )

        return handler

    def _find_last(self, entity_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for item in reversed(self.graph):
            msg = item.get('message', {})
            if not entity_id:
                return item
            if msg.get('entity_id') == entity_id:
                return item
            for op in msg.get('operations', []) if isinstance(msg, dict) else []:
                if op.get('entity_id') == entity_id:
                    return item
        return None

    def _on_explain_request(self, message: Dict[str, Any]) -> None:
        result = self.process(message.get('payload', {}))
        self.bus.publish('explain.completed', result)

    def process(self, message: Dict[str, Any]) -> Dict[str, Any]:
        mode = message.get('mode', 'last')
        entity_id = message.get('entity_id')

        target = self._find_last(entity_id if mode == 'entity' else None)
        if not target:
            return {
                'event_id': self._event_id('explain-empty'),
                'agent_id': self.contract.agent_id,
                'trace': [],
                'summary': 'No trace available',
            }

        idx = self.graph.index(target)
        trace = self.graph[max(0, idx - 3): idx + 1]

        return {
            'event_id': self._event_id('explain-completed'),
            'agent_id': self.contract.agent_id,
            'trace': [
                {
                    'topic': t['topic'],
                    'event_id': t['event_id'],
                    'agent_id': t['agent_id'],
                    'source_name': t['source_name'],
                }
                for t in trace
            ],
            'summary': f"Derived from {len(trace)} event(s), last topic={target['topic']}",
        }