"""Phase 4a tests: message bus behavior and agent contract validation."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.contracts import AgentContract, default_contracts_v1
from tools.agents.message_bus import MalformedMessageError, MessageBus


def assert_true(cond, msg):
    if not cond:
        raise SystemExit(msg)


def test_publish_without_subscriber_is_silent():
    bus = MessageBus()
    result = bus.publish('parse.completed', {'event_id': 'e1', 'data': 1})
    assert_true(result.delivered == 0, 'publish without subscriber should deliver 0')


def test_subscriber_waits_until_publish():
    bus = MessageBus()
    received = []

    def handler(msg):
        received.append(msg['event_id'])

    bus.subscribe('norm.completed', handler)
    assert_true(received == [], 'subscriber should be waiting before publish')
    bus.publish('norm.completed', {'event_id': 'e2'})
    assert_true(received == ['e2'], 'subscriber should receive message after publish')


def test_malformed_payload_raises_controlled_error():
    bus = MessageBus()
    try:
        bus.publish('valid.violation', 'not-a-dict')
        raise SystemExit('expected MalformedMessageError for non-dict payload')
    except MalformedMessageError:
        pass

    try:
        bus.publish('valid.violation', {'x': 1})
        raise SystemExit('expected MalformedMessageError for missing event_id')
    except MalformedMessageError:
        pass


def test_contracts_validation_and_registry():
    contracts = default_contracts_v1()
    assert_true('PARSE_AGT' in contracts, 'PARSE_AGT contract missing')
    assert_true('VALID_AGT' in contracts, 'VALID_AGT contract missing')

    bad = AgentContract('UNKNOWN', '1.0.0', ['a'], ['b'])
    try:
        bad.validate()
        raise SystemExit('expected ValueError for unknown agent id')
    except ValueError:
        pass


if __name__ == '__main__':
    test_publish_without_subscriber_is_silent()
    test_subscriber_waits_until_publish()
    test_malformed_payload_raises_controlled_error()
    test_contracts_validation_and_registry()
    print('agent layer phase 4a tests: OK')