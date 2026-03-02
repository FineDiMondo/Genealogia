"""Formal CLI parser for GN370 shell (phase 5a)."""

from __future__ import annotations

import shlex
from dataclasses import dataclass, field
from typing import Dict, List


ALIAS_MAP = {
    'h': 'help',
    'b': 'back',
    'm': 'menu',
    'r': 'refresh',
    'q': 'quit',
}

ALLOWED_VERBS = {
    'feed',
    'find',
    'open',
    'show',
    'story',
    'job',
    'db',
    'cache',
    'help',
    'back',
    'menu',
    'refresh',
    'quit',
    'explain',
}


class ParseError(Exception):
    def __init__(self, code: str, message: str, hint: str) -> None:
        super().__init__(f'{code}: {message}')
        self.code = code
        self.message = message
        self.hint = hint


@dataclass
class CommandSpec:
    verb: str
    args: List[str] = field(default_factory=list)
    options: Dict[str, str | bool] = field(default_factory=dict)
    raw: str = ''
    alias_used: str | None = None


class CommandParser:
    def parse(self, raw: str) -> CommandSpec:
        text = (raw or '').strip()
        if not text:
            raise self._err('EMPTY_COMMAND', 'comando vuoto', 'Digita HELP o MENU')

        tokens = self._tokenize(text)
        first = tokens[0].lower()
        alias_used = None
        if first in ALIAS_MAP:
            alias_used = first
            first = ALIAS_MAP[first]

        if first not in ALLOWED_VERBS:
            raise self._err('UNKNOWN_VERB', f"verbo non riconosciuto: {tokens[0]}", 'Usa HELP per elenco comandi')

        args: List[str] = []
        opts: Dict[str, str | bool] = {}

        i = 1
        while i < len(tokens):
            t = tokens[i]
            if t.startswith('/') and len(t) > 1:
                key = t[1:].lower()
                if not key:
                    raise self._err('INVALID_OPTION', f'opzione non valida: {t}', 'Usa /key o /key value')
                nxt = tokens[i + 1] if i + 1 < len(tokens) else None
                if nxt is not None and not nxt.startswith('/') and not nxt.startswith('--'):
                    opts[key] = nxt
                    i += 2
                    continue
                opts[key] = True
                i += 1
                continue

            if t.startswith('--') and len(t) > 2:
                key = t[2:].lower()
                nxt = tokens[i + 1] if i + 1 < len(tokens) else None
                if nxt is not None and not nxt.startswith('/') and not nxt.startswith('--'):
                    opts[key] = nxt
                    i += 2
                    continue
                opts[key] = True
                i += 1
                continue

            args.append(t)
            i += 1

        return CommandSpec(verb=first, args=args, options=opts, raw=text, alias_used=alias_used)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        try:
            return shlex.split(text)
        except ValueError as exc:
            raise CommandParser._err('UNBALANCED_QUOTES', 'virgolette non bilanciate', 'Chiudi la stringa tra doppi apici') from exc

    @staticmethod
    def _err(code: str, message: str, hint: str) -> ParseError:
        return ParseError(code=code, message=message, hint=hint)
