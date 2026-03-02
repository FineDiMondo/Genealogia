"""Phase 4c tests: VALID_AGT + EXPL_AGT."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.expl_agent import ExplAgent
from tools.agents.message_bus import MessageBus
from tools.agents.valid_agent import ValidAgent


def assert_true(cond, msg):
    if not cond:
        raise SystemExit(msg)


def _publish_norm(bus: MessageBus, operations):
    bus.publish(
        'norm.completed',
        {
            'event_id': 'norm-evt-1',
            'agent_id': 'NORM_AGT',
            'source_name': 'fixture',
            'operations': operations,
            'metrics': {'persons': 0, 'families': 0, 'dedup_candidates': 0, 'conflicts': 0, 'avg_confidence': 1.0},
        },
    )


def test_valid_detects_genealogy_cycle():
    bus = MessageBus()
    ValidAgent(bus)

    ops = [
        {'entity_type': 'PERSON', 'entity_id': 'P1', 'payload': {'state': {'birth_year': 1900}}},
        {'entity_type': 'PERSON', 'entity_id': 'P2', 'payload': {'state': {'birth_year': 1925}}},
        {'entity_type': 'FAMILY', 'entity_id': 'F1', 'payload': {'state': {'father_id': 'P1', 'mother_id': None, 'children': ['P2']}}},
        {'entity_type': 'FAMILY', 'entity_id': 'F2', 'payload': {'state': {'father_id': 'P2', 'mother_id': None, 'children': ['P1']}}},
    ]
    _publish_norm(bus, ops)

    violations = bus.history('valid.violation')
    assert_true(len(violations) == 1, 'expected valid.violation event')
    rules = [v['rule'] for v in violations[0]['violations']]
    assert_true('genealogy_cycle' in rules, 'expected genealogy_cycle violation')


def test_valid_detects_bio_range_outliers():
    bus = MessageBus()
    ValidAgent(bus)

    ops = [
        {'entity_type': 'PERSON', 'entity_id': 'P10', 'payload': {'state': {'birth_year': 2000}}},
        {'entity_type': 'PERSON', 'entity_id': 'C10', 'payload': {'state': {'birth_year': 2008}}},
        {'entity_type': 'FAMILY', 'entity_id': 'F10', 'payload': {'state': {'father_id': 'P10', 'mother_id': None, 'children': ['C10']}}},
    ]
    _publish_norm(bus, ops)

    violations = bus.history('valid.violation')
    assert_true(len(violations) == 1, 'expected valid.violation event')
    severities = [v['severity'] for v in violations[0]['violations']]
    assert_true('ERROR' in severities, 'expected ERROR for biological age min')


def test_expl_traces_last_dependency_chain():
    bus = MessageBus()
    ExplAgent(bus)

    bus.publish('parse.completed', {'event_id': 'e1', 'agent_id': 'PARSE_AGT', 'source_name': 's1'})
    bus.publish('norm.completed', {'event_id': 'e2', 'agent_id': 'NORM_AGT', 'source_name': 's1', 'operations': []})
    bus.publish('valid.clear', {'event_id': 'e3', 'agent_id': 'VALID_AGT', 'source_name': 's1', 'violations': []})

    bus.publish('user.request.explain', {'event_id': 'req-x', 'payload': {'mode': 'last'}})
    expl = bus.history('explain.completed')
    assert_true(len(expl) == 1, 'expected one explain.completed')
    assert_true(len(expl[0]['trace']) >= 3, 'expected dependency trace with at least 3 events')
    assert_true(expl[0]['trace'][-1]['topic'] == 'valid.clear', 'expected last topic valid.clear')


if __name__ == '__main__':
    test_valid_detects_genealogy_cycle()
    test_valid_detects_bio_range_outliers()
    test_expl_traces_last_dependency_chain()
    print('agent layer phase 4c tests: OK')