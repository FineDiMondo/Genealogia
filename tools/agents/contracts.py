"""Agent contracts for GN370 agent layer v1 (phase 4a)."""

from dataclasses import dataclass
from typing import Any, Dict, List, Protocol


ALLOWED_AGENT_IDS = {
    'PARSE_AGT',
    'NORM_AGT',
    'VALID_AGT',
    'STORY_AGT',
    'SYNC_AGT',
    'EXPL_AGT',
    'INFER_AGT',
}


@dataclass(frozen=True)
class AgentContract:
    agent_id: str
    version: str
    subscribes_to: List[str]
    publishes_to: List[str]

    def validate(self) -> None:
        if self.agent_id not in ALLOWED_AGENT_IDS:
            raise ValueError(f'Unknown agent_id: {self.agent_id}')
        if not self.version or not self.version.strip():
            raise ValueError('Agent version is required')
        if any(not topic or not topic.strip() for topic in self.subscribes_to):
            raise ValueError('subscribes_to contains empty topic')
        if any(not topic or not topic.strip() for topic in self.publishes_to):
            raise ValueError('publishes_to contains empty topic')


class Agent(Protocol):
    contract: AgentContract

    def process(self, message: Dict[str, Any]) -> Dict[str, Any]:
        ...


def default_contracts_v1() -> Dict[str, AgentContract]:
    contracts = {
        'PARSE_AGT': AgentContract('PARSE_AGT', '1.0.0', [], ['parse.completed', 'parse.error']),
        'NORM_AGT': AgentContract('NORM_AGT', '1.0.0', ['parse.completed'], ['norm.completed', 'norm.conflict']),
        'VALID_AGT': AgentContract('VALID_AGT', '1.0.0', ['norm.completed', 'journal.write'], ['valid.violation', 'valid.clear']),
        'STORY_AGT': AgentContract('STORY_AGT', '1.0.0', ['user.request.story'], ['story.completed']),
        'SYNC_AGT': AgentContract('SYNC_AGT', '1.0.0', ['user.request.sync'], ['sync.diff.ready', 'sync.imported']),
        'EXPL_AGT': AgentContract('EXPL_AGT', '1.0.0', ['*'], ['explain.completed']),
        'INFER_AGT': AgentContract('INFER_AGT', '1.0.0', ['user.request.infer'], ['infer.suggestion']),
    }
    for contract in contracts.values():
        contract.validate()
    return contracts