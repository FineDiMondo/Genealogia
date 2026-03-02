import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.agents.cli_parser import CommandParser, ParseError


def assert_true(cond, msg):
    if not cond:
        raise SystemExit(msg)


def test_parse_basic_with_options_and_quotes():
    p = CommandParser()
    cmd = p.parse('find person "paolo giardina" /last 5 --type person.updated')
    assert_true(cmd.verb == 'find', 'verb mismatch')
    assert_true(cmd.args[0] == 'person', 'arg0 mismatch')
    assert_true(cmd.args[1] == 'paolo giardina', 'quoted arg mismatch')
    assert_true(cmd.options['last'] == '5', '/last mismatch')
    assert_true(cmd.options['type'] == 'person.updated', '--type mismatch')


def test_alias_mapping():
    p = CommandParser()
    cmd = p.parse('h')
    assert_true(cmd.verb == 'help', 'alias h should map to help')
    cmd2 = p.parse('b')
    assert_true(cmd2.verb == 'back', 'alias b should map to back')


def test_syntax_errors():
    p = CommandParser()
    try:
        p.parse('')
        raise SystemExit('expected ParseError EMPTY_COMMAND')
    except ParseError as e:
        assert_true(e.code == 'EMPTY_COMMAND', 'wrong error code for empty command')

    try:
        p.parse('unknowncmd')
        raise SystemExit('expected ParseError UNKNOWN_VERB')
    except ParseError as e:
        assert_true(e.code == 'UNKNOWN_VERB', 'wrong error code for unknown verb')

    try:
        p.parse('find "unterminated')
        raise SystemExit('expected ParseError UNBALANCED_QUOTES')
    except ParseError as e:
        assert_true(e.code == 'UNBALANCED_QUOTES', 'wrong error for unbalanced quotes')


if __name__ == '__main__':
    test_parse_basic_with_options_and_quotes()
    test_alias_mapping()
    test_syntax_errors()
    print('cli parser tests: OK')