"""Suggestion engine for GN370 command shell (phase 5a)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

from tools.agents.cli_parser import ALLOWED_VERBS, CommandSpec, ParseError


@dataclass
class Suggestion:
    suggestion_text: str
    reason: str
    confidence: float


def suggest_commands(
    partial: Optional[CommandSpec],
    context: Dict[str, str],
    parse_error: Optional[ParseError] = None,
) -> List[Suggestion]:
    out: List[Suggestion] = []
    last_cmd = context.get('last_command', '').strip()
    entity_type = context.get('entity_type', '').lower()
    entity_id = context.get('entity_id', '')

    if parse_error is not None:
        raw = context.get('raw', '')
        if raw:
            for v in sorted(ALLOWED_VERBS):
                if v.startswith(raw.split()[0].lower()[:1]):
                    out.append(Suggestion(f'{v}', f'Correzione per errore {parse_error.code}', 0.72))
        out.append(Suggestion('help', 'Mostra sintassi comandi validi', 0.95))
        return out[:8]

    if partial is None:
        out.extend(
            [
                Suggestion('help', 'Comandi disponibili', 0.9),
                Suggestion('menu', 'Menu principale shell', 0.88),
                Suggestion('feed /last 10', 'Mostra ultimi eventi journal', 0.86),
            ]
        )
        return out[:8]

    if partial.verb == 'open' and partial.args[:1] == ['person']:
        pid = partial.args[1] if len(partial.args) > 1 else entity_id or 'GN-...'
        out.extend(
            [
                Suggestion('show card', 'Mostra card della persona aperta', 0.95),
                Suggestion('show timeline', 'Mostra timeline eventi persona', 0.9),
                Suggestion(f'feed /entity person /id {pid}', 'Filtra feed per persona corrente', 0.88),
            ]
        )

    if partial.verb in {'help', 'menu'}:
        out.extend(
            [
                Suggestion('feed /last 10', 'Controlla attivita recente', 0.82),
                Suggestion('job run pipeline', 'Esegui pipeline agent end-to-end', 0.8),
            ]
        )

    if partial.verb == 'feed':
        out.extend(
            [
                Suggestion('feed /last 10', 'Ultimi 10 eventi', 0.92),
                Suggestion('feed /type PERSON_UPSERT', 'Filtra per tipo evento', 0.84),
            ]
        )

    if partial.verb == 'show' and entity_type == 'person' and entity_id:
        out.append(Suggestion(f'open person {entity_id}', 'Riapri contesto persona', 0.83))

    if partial.verb == 'job' and partial.args[:2] == ['run', 'pipeline']:
        out.append(Suggestion('feed /last 10', 'Verifica eventi dopo pipeline', 0.9))

    if not out and last_cmd:
        out.append(Suggestion(last_cmd, 'Ripeti ultimo comando utile', 0.7))

    if not out:
        out.extend([Suggestion(v, 'Comando disponibile', 0.55) for v in sorted(ALLOWED_VERBS)[:8]])

    unique: List[Suggestion] = []
    seen = set()
    for s in out:
        key = s.suggestion_text.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(s)
    unique.sort(key=lambda x: x.confidence, reverse=True)
    return unique[:8]