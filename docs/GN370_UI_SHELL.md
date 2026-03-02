# GN370 UI Shell

## Scope
Single 370-style web shell for GitHub Pages static deployment.

## Layout
The active UI has four fixed zones:
- `HEADER`: build/data/context plus always-on technology banner.
- `OUTPUT`: paged text buffer rendered in monospace.
- `SUGGEST`: contextual suggestions (max 8).
- `COMMAND ===>`: central command input.

Footer keeps PF key hints (`PF1`, `PF3`, `PF5`, `PF7`, `PF8`, `PF9`, `PF10`, `PF12`).

## Command Mapping
Web shell minimum commands:
- `help`
- `feed last 10` and feed filters
- `open person <id>`
- `show card`
- `explain`

Additional debug bridge commands:
- `state show`
- `state load [runtime/session_state.json]`
- `job run pipeline` (mapped to existing `IMPORT_RECORDS` web pipeline simulation/loader)

## Session State Bridge
Canonical JSON shape (`runtime/session_state.json`):
```json
{
  "context": { "entityType": "person", "entityId": "GN-I1" },
  "lastCommand": "open person GN-I1",
  "outputLines": ["..."],
  "suggestions": ["show card :: persona corrente"],
  "techBanner": {
    "ontology": "3NF NORMALIZATION",
    "algorithm": "Referential Integrity",
    "tech": "GN370 WEB SHELL",
    "agent": "VALID_AGT",
    "source": "JOURNAL NDJSON"
  }
}
```

Web runtime behavior:
- Keeps session state in memory.
- Persists state to `localStorage` (`gn370_session_state_v1`).
- Can load a saved JSON session for debug/replay.

## Technology Banner
Banner is mandatory on every context:
- feed -> journal stream read/filter
- open/show -> entity lookup + card projection
- job run pipeline -> pipeline orchestration
- explain -> derivation trace

## Retro Progress Bar
Standard rendering:
`[############--------]  60%  STEP_NAME  (n/total)`

Web mode uses file-read or step-based progress for commands that cannot execute write operations in browser.

## Web vs Local Limits
- Web shell is read-only for data: no disk writes.
- Local launcher/shell runner remains reference implementation for write path and journal mutation.
- Bridge export/import is for observability and debug handoff.

## Open Points
- Python-to-web state export timing policy (manual vs automatic snapshots).
- Long-term history persistence strategy (memory/localStorage/file export).
- Stable mapping between local IDs and external FS/RootsMagic references.
