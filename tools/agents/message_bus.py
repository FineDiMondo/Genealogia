"""In-memory publish/subscribe bus for GN370 agent layer v1 (phase 4a)."""

from collections import defaultdict
from dataclasses import dataclass
from typing import Callable, Dict, List


class MessageBusError(Exception):
    pass


class MalformedMessageError(MessageBusError):
    pass


@dataclass(frozen=True)
class PublishResult:
    topic: str
    delivered: int


class MessageBus:
    def __init__(self) -> None:
        self._subscribers: Dict[str, List[Callable[[dict], None]]] = defaultdict(list)
        self._history: Dict[str, List[dict]] = defaultdict(list)

    def subscribe(self, topic: str, handler: Callable[[dict], None]) -> None:
        if not topic or not topic.strip():
            raise ValueError('topic is required')
        if not callable(handler):
            raise ValueError('handler must be callable')
        self._subscribers[topic].append(handler)

    def publish(self, topic: str, payload: dict) -> PublishResult:
        if not topic or not topic.strip():
            raise ValueError('topic is required')
        if not isinstance(payload, dict):
            raise MalformedMessageError('payload must be a dict')
        if 'event_id' not in payload:
            raise MalformedMessageError("payload missing required key 'event_id'")

        self._history[topic].append(payload)
        delivered = 0
        for handler in self._subscribers.get(topic, []):
            handler(payload)
            delivered += 1
        return PublishResult(topic=topic, delivered=delivered)

    def subscriber_count(self, topic: str) -> int:
        return len(self._subscribers.get(topic, []))

    def history(self, topic: str) -> List[dict]:
        return list(self._history.get(topic, []))