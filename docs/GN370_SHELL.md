# GN370 Shell

Shell 370 unica per consultazione genealogica su GitHub Pages.

## Comandi
- `help` / `h`: mostra help comandi.
- `menu` / `m`: stampa menu operativo.
- `back` / `b`: ripristina stato precedente da stack.
- `refresh` / `r`: invalida cache fetch locale e ricarica dati su chiamata successiva.
- `feed [last N] [/type T] [/since YYYY-MM-DD] [/entity person|family|story] [/id ID]`.
- `story list`: elenco storie disponibili.
- `story open <storyId>`: apre contesto storia.
- `story play <storyId>`: riproduce transcript .story.
- `open person <id>`: apre scheda persona (JSON).
- `open xref <@I123@>`: apre persona tramite xref GEDCOM.
- `open rec <TYPE> <ID>`: apre record fixed-length da `data/current/records`.
- `show copy <TYPE>`: mostra struttura copybook con offset/lunghezze.
- `validate rec <TYPE> <ID>`: valida lunghezza e campi numerici.
- `job run IMPORT_RECORDS`: esegue pipeline browser-side con progress bar retro.
- `job status`: stato job corrente/ultimo.
- `job log --tail 50`: coda log operazioni job.
- `db status`: stato DB locale (meta + counts).
- `db backup [tag]`: backup sicuro (web: istruzioni offline).
- `db reset [--keep-backup]`: reset store con backup pre-operazione.
- `db rebuild`: rebuild con backup pre-operazione.
- `db restore <backup_file>`: restore da backup zip.
- `rm help`: guida operativa RootsMagic bridge.
- `rm import`: istruzioni batch offline (in browser non esegue processi).
- `show card`: stampa dettagli oggetto corrente.
- `clear`: svuota output.

## Esempi
- `feed last 10`
- `feed /type person.updated /last 15`
- `feed last 30 /entity person /id P0001005`
- `story list`
- `story play SAMPLE`
- `open person P0000001`
- `open xref @I1@`
- `open rec PERSON P#SAMPLE001`
- `show copy PERSON`
- `validate rec EVENT E#SAMPLE001`
- `job run IMPORT_RECORDS`
- `job log --tail 30`
- `db status`
- `db backup pre_release`
- `rm help`

## PF Keys
- `PF1`: help
- `PF3`: back
- `PF5`: refresh
- `PF7`: pagina su
- `PF8`: pagina giu
- `PF9`: menu
- `PF10`: focus command line
- `PF12`: quit (in browser mostra warning)

## Base path GitHub Pages
Tutti i fetch/path usano URL relativi risolti in runtime con `new URL(path, window.location.href)`.
- in Pages: `./data/current/...`, `./copybooks/...`, `./assets/...`
- in locale: stessi path relativi

## Aggiungere un evento e verificare feed
1. Aprire `data/current/events.ndjson`.
2. Aggiungere una riga JSON valida (una riga = un evento).
3. Aprire shell e lanciare `feed last 10`.

## Open Points
1. Identificatori: confermare formato canonico (`P#######`, `F#######`, `S#######`).
2. Tassonomia eventi: definire lista type canonici e naming finale.
3. Branch/filtro: decidere come mappare ramo attivo su tag/entity.
4. Privacy: separare metadati pubblici da dati sensibili.
5. Ricerca: soglia per introdurre indice (`SQLite` vs file index statico).
6. Integrazione launcher SDL2: strategia condivisa per stesso event journal.
7. Performance: dimensione massima `events.ndjson` e rolling/chunk policy.
