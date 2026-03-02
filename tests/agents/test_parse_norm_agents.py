"""Phase 4b tests: PARSE_AGT + NORM_AGT on in-memory bus."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.message_bus import MessageBus
from tools.agents.parse_agent import ParseAgent
from tools.agents.norm_agent import NormAgent


def assert_true(cond, msg):
    if not cond:
        raise SystemExit(msg)


def test_parse_and_norm_pipeline_happy_path():
    bus = MessageBus()
    ParseAgent(bus)
    NormAgent(bus)

    ged = "\n".join(
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
    bus.publish('user.request.parse', {'event_id': 'req-1', 'payload': {'raw_text': ged, 'source_name': 'sample.ged'}})

    parse_events = bus.history('parse.completed')
    norm_events = bus.history('norm.completed')
    assert_true(len(parse_events) == 1, 'expected one parse.completed event')
    assert_true(parse_events[0]['counts']['individuals'] == 2, 'expected 2 individuals')
    assert_true(parse_events[0]['counts']['families'] == 1, 'expected 1 family')

    assert_true(len(norm_events) == 1, 'expected one norm.completed event')
    metrics = norm_events[0]['metrics']
    assert_true(metrics['persons'] == 2, 'norm persons count mismatch')
    assert_true(metrics['families'] == 1, 'norm families count mismatch')
    assert_true(len(norm_events[0]['operations']) >= 3, 'expected person/family operations')


def test_parse_error_with_line_position():
    bus = MessageBus()
    ParseAgent(bus)

    bad = "\n".join(['0 @I1@ INDI', 'BROKEN LINE', '1 NAME Mario /Rossi/'])
    bus.publish('user.request.parse', {'event_id': 'req-2', 'payload': {'raw_text': bad, 'source_name': 'bad.ged'}})

    errs = bus.history('parse.error')
    assert_true(len(errs) == 1, 'expected one parse.error event')
    assert_true(errs[0]['errors'][0]['line'] == 2, 'expected syntax error line=2')


def test_norm_conflict_detection_for_ambiguous_names():
    bus = MessageBus()
    ParseAgent(bus)
    NormAgent(bus)

    ged = "\n".join(
        [
            '0 @I10@ INDI',
            '1 NAME Giovanni /Giardina/',
            '1 SEX M',
            '0 @I11@ INDI',
            '1 NAME Giovana /Giardena/',
            '1 SEX F',
        ]
    )
    bus.publish('user.request.parse', {'event_id': 'req-3', 'payload': {'raw_text': ged, 'source_name': 'conflict.ged'}})

    conflicts = bus.history('norm.conflict')
    assert_true(len(conflicts) == 1, 'expected one norm.conflict event')
    assert_true(len(conflicts[0]['conflicts']) >= 1, 'expected at least one conflict row')
    assert_true(conflicts[0]['conflicts'][0]['status'] == 'OPEN', 'expected OPEN conflict status')


if __name__ == '__main__':
    test_parse_and_norm_pipeline_happy_path()
    test_parse_error_with_line_position()
    test_norm_conflict_detection_for_ambiguous_names()
    print('agent layer phase 4b tests: OK')