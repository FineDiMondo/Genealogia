import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.cli_parser import CommandParser, ParseError
from tools.agents.suggest import suggest_commands


def assert_true(cond, msg):
    if not cond:
        raise SystemExit(msg)


def test_suggestions_after_open_person():
    p = CommandParser()
    cmd = p.parse('open person GN-I1')
    out = suggest_commands(cmd, {'entity_type': 'person', 'entity_id': 'GN-I1', 'screen': 'OPEN_PERSON', 'last_command': 'open person GN-I1'})
    texts = [s.suggestion_text for s in out]
    assert_true('show card' in texts, 'missing show card suggestion')
    assert_true('show timeline' in texts, 'missing show timeline suggestion')


def test_suggestions_on_parse_error():
    try:
        CommandParser().parse('zzz')
        raise SystemExit('expected parse error')
    except ParseError as e:
        out = suggest_commands(None, {'raw': 'zzz', 'last_command': ''}, parse_error=e)
        assert_true(len(out) >= 1, 'expected suggestions for parse error')
        assert_true(any(s.suggestion_text == 'help' for s in out), 'expected help suggestion')


def test_verb_completion_fallback():
    cmd = CommandParser().parse('help')
    out = suggest_commands(cmd, {'last_command': 'help', 'screen': 'MAIN'})
    assert_true(len(out) > 0, 'expected non-empty suggestions')


if __name__ == '__main__':
    test_suggestions_after_open_person()
    test_suggestions_on_parse_error()
    test_verb_completion_fallback()
    print('suggest tests: OK')