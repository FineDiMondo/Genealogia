DB lifecycle operations (Windows CMD)
=====================================

Scripts:
- tools\db\db_backup.cmd [tag] [--keep-all]
- tools\db\db_reset.cmd [--keep-backup]
- tools\db\db_restore.cmd <backup_zip>
- tools\db\db_rebuild.cmd

Lock:
- A lock file is used at data\.lock to avoid concurrent operations.
- If lock exists, commands return error "DB BUSY".

Backup format:
- ZIP archive of data\current
- filename: data\backups\backup_YYYYMMDD_HHMMSS_<tag>.zip
- companion manifest: data\backups\backup_... .manifest.json

Exit codes:
- 0 OK
- 1 WARN
- 2 INPUT ERROR
- 3 SYSTEM ERROR

Notes:
- On GitHub Pages (web-only) these operations cannot run; use local shell/launcher.
- Rebuild currently validates structure and appends db.rebuild event; extend pipeline as needed.
