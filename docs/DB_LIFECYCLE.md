# DB Lifecycle (Backup / Reset / Rebuild / Restore)

Questo documento definisce la procedura sicura di reinizializzazione del data store locale.

## Scope

- Store primario: `data/current/` (records, entities, indexes, events, meta)
- Backup: `data/backups/backup_YYYYMMDD_HHMMSS_<tag>.zip`
- Lock globale: `data/.lock`

## Comandi batch

- `tools\db\db_backup.cmd [tag] [--keep-all]`
- `tools\db\db_reset.cmd [--keep-backup]`
- `tools\db\db_rebuild.cmd`
- `tools\db\db_restore.cmd <backup_zip>`

## Sicurezza operativa

1. Acquire lock (`data/.lock`)
2. Backup pre-operazione quando richiesto
3. Operazione principale
4. Validazione minima output
5. Append evento in `events.ndjson`
6. Release lock

Se lock esiste: `(ERR) DB BUSY`.

## Backup atomico

- Archive creato in `*.tmp.zip`
- Rename finale a `*.zip`
- Manifest affiancato `*.manifest.json` con:
  - `commit7` da `version.json`
  - timestamp UTC
  - lista file + sha256 + size
  - counts e byte totali

## Retention policy

- Default: mantieni ultimi 10 backup
- Opzione `--keep-all` per non applicare retention

## Reset

- Esegue backup `pre_reset`
- Sposta `data/current` in `data/trash/current_<ts>`
- Ricrea struttura base
- Scrive `data/current/meta/last_reset.json`

## Rebuild

- Esegue backup `pre_rebuild`
- Ricostruisce struttura/manifest minima
- Scrive `last_rebuild.json`
- Appende evento `db.rebuild`
- In caso failure: usare `db_restore.cmd` sull'ultimo backup

## Restore

- Esegue backup `pre_restore`
- Sposta current in trash
- Estrae backup zip in `data/current`
- Valida file core
- Appende evento `db.restore`

## Failure handling

- Errore pre-backup o lock: stop immediato
- Errore restore/rebuild: non cancellare trash, suggerire restore manuale

## Open Points

1. Web-only vs local-run: su GitHub Pages non e possibile scrivere su disco; DB ops solo offline.
2. Formato backup: ZIP (Windows) vs tar.gz (cross-platform).
3. Retention avanzata e cifratura backup per dati privati.
4. Migrazione schema copybook: transform incrementale vs reset totale.
