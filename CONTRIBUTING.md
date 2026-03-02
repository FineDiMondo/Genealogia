# Contributing to Genealogia GN370-NEXT

## Principio

Le modifiche tecniche e funzionali devono rimanere **semplici e tracciabili** come quello standard COBOL/CICS del mainframe.
Ogni tipo di modifica ha un **workflow guidato** e una **checklist**.

---

## 1. Aggiungere un nuovo comando COBOL CLI

### Passo 1: definisci il copybook (se necessario)

Se il comando legge/scrive un record nuovo, crea una copybook in `copybooks/`:

```
copybooks/NEWREC.CPY
```

Formato:
```plaintext
       01 NEWREC-REC.
          05 ID                 PIC X(16).
          05 FIELD-A            PIC X(60).
          05 FIELD-B            PIC 9(04).
```

Linee guida:
- Solo livelli `01` e `05`
- PIC: `X(n)` e `9(n)` supportati
- Lunghezza totale record ≤ 4KB
- Vedi [COPYBOOK_FORMAT.md](docs/COPYBOOK_FORMAT.md)

### Passo 2: crea il modulo COBOL

Crea `cobol/src/GENNEW00.cbl` (naming: `GEN<funzione><numero>.cbl`):

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. GENNEW00.

       DATA DIVISION.
       FILE SECTION.
       FD INPUT-FILE.
       01 INPUT-REC.
          COPY "NEWREC.CPY".

       WORKING-STORAGE SECTION.
       COPY "CLIARGS.CPY".
       01 WS-COUNTER          PIC 9(8) VALUE 0.

       PROCEDURE DIVISION.
       MAIN-ENTRY.
           MOVE 0 TO LK-RETURN-CODE
           ... logica ...
           GOBACK.
```

### Passo 3: registra il comando in GENCLI.cbl

Modifica `cobol/src/GENCLI.cbl`:

```cobol
           EVALUATE LK-CMD
             ...
             WHEN "NEWCMD"
               CALL "GENNEW00" USING LK-CLI-ARGS
             ...
           END-EVALUATE
```

Aggiorna SHOW-HELP:
```cobol
       SHOW-HELP.
           DISPLAY "  NEWCMD <params>"
```

### Passo 4: testa localmente

```powershell
.\cobol\build.ps1
.\cobol\bin\GENCLI.exe NEWCMD arg1
```

### Passo 5: aggiungi test in cobol/test.ps1

```powershell
Write-Host "== TEST: NEWCMD ==`n" -ForegroundColor Cyan
& $exe NEWCMD arg1
$rcNew = $LASTEXITCODE
```

### Checklist

- [ ] Copybook creato in `copybooks/`
- [ ] Modulo COBOL in `cobol/src/`
- [ ] Comando registrato in GENCLI.cbl
- [ ] SHOW-HELP aggiornato
- [ ] `.\cobol\build.ps1` passa
- [ ] `.\cobol\test.ps1` passa
- [ ] Nessun TODO nel codice
- [ ] PR con questa checklist compilata

---

## 2. Aggiungere una nuova schermata CICS (MVS)

### Passo 1: crea il file HTML

Crea `mvs/GENNEW01.html`:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GENNEW01</title>
  <link rel="stylesheet" href="assets/cics-370.css">
</head>
<body class="cics-terminal">
  <div class="cics-container">
    <div class="cics-header">
      GENNEW01 - NEW SCREEN
    </div>

    <div class="cics-body">
      <!-- contenuto -->
    </div>

    <div class="cics-footer">
      <span>PF1=AIUTO</span>
      <span>PF3=FINE</span>
    </div>
  </div>

  <script src="assets/cics-runtime.js"></script>
  <script>
    // logica schermata
    function init() {
      // ...
    }
    init();
  </script>
</body>
</html>
```

Vedi template in:
- [mvs/intro.html](mvs/intro.html) - entrypoint
- [mvs/GENIND01.html](mvs/GENIND01.html) - schermata dati
- [mvs/GENTRE01.html](mvs/GENTRE01.html) - schermata albero

### Passo 2: registra nel menu

Modifica `mvs/intro.html`:

```html
 8. NUOVA SCHERMATA ............ GENNEW01 (WORK IN PROGRESS)
```

Cambia stato quando pronta:
```html
 8. NUOVA SCHERMATA ............ GENNEW01
```

### Passo 3: collega al menu

In `mvs/assets/cics-runtime.js`, aggiungi:

```javascript
function goScreen(screenId) {
  if (screenId === 'GENNEW01') {
    window.location.href = GEN.withBase('mvs/GENNEW01.html');
  }
}
```

### Checklist

- [ ] File HTML creato in `mvs/GENNEW01.html`
- [ ] Classico CICS layout rispettato (header/body/footer)
- [ ] CSS da `assets/cics-370.css`
- [ ] PF keys implementati
- [ ] Registrato nel menu principale
- [ ] Test locale: passa senza errori console
- [ ] Link path relativi (no path assoluti `/...`)
- [ ] Nessun TODO nel markup

---

## 3. Aggiungere un nuovo schema DB (migrazione SQL)

### Passo 1: crea la migrazione numerata

Crea `tools/db/migrations/003_<descrizione>.sql`:

```sql
-- Migration 003: descrizione
-- Author: <name>
-- Date: 2026-03-XX

CREATE TABLE IF NOT EXISTS new_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field1 TEXT NOT NULL,
  field2 INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (field1) REFERENCES other_table(id)
);

CREATE INDEX IF NOT EXISTS idx_new_table_field1 ON new_table(field1);

-- Update schema version
INSERT INTO schema_version (version_code, description, migration_hash, applied_by)
VALUES ('2026.03.003', 'Added new_table', 'SHA256_HASH', 'system');
```

### Passo 2: testa la migrazione

```bash
python tools/test/test_db_migration.py
```

O aggiungi test in `tests/schema/test_migration_003.py`:

```python
import sqlite3
from pathlib import Path

MIGRATIONS = [
    Path('tools/db/migrations/001_gn370_next_core.sql'),
    Path('tools/db/migrations/002_domain_schema.sql'),
    Path('tools/db/migrations/003_<descrizione>.sql'),
]

def test_migration_003():
    conn = sqlite3.connect(':memory:')
    for migration in MIGRATIONS:
        conn.executescript(migration.read_text())
    
    # assert: table exists, indexes created, etc.
    rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    assert any('new_table' in r for r in rows)
    
    conn.close()
    print('Migration 003 test: OK')
```

### Passo 3: valida integrità

- Test FK, CHECK, UNIQUE con dati validi e invalidi
- Assicura che `schema_version` sia aggiornata

### Checklist

- [ ] Migrazione creata con numero sequenziale
- [ ] SHA256_HASH della migrazione documentato
- [ ] Test positivi/negativi su vincoli
- [ ] schema_version aggiornata
- [ ] `npm run test:db:migration` passa
- [ ] Nessun conflitto di schema con altre PR aperte

---

## 4. Estendere la Shell GN370

### Aggiungere un comando

Modifica `assets/gn370.js`:

```javascript
// Near parseCommand() 
function parseCommand(raw) {
  // ... existing parser ...
  // Add new command pattern:
  if (cmd === 'newcmd') {
    return { cmd: 'newcmd', args: rest, opts };
  }
}

// Add command handler
async function cmdNewCmd(pc) {
  const msg = `NEWCMD result for ${pc.args.join(' ')}`;
  writeOK(msg);
  renderOutput();
}

// Register in execute()
async function execute(raw) {
  const pc = parseCommand(raw);
  
  switch (pc.cmd) {
    // ... existing cases ...
    case 'newcmd':
      await cmdNewCmd(pc);
      break;
  }
}
```

Aggiorna help:
```javascript
function printHelp() {
  // ... add to help list ...
  appendLine(`  newcmd <args...>`);
}
```

### Checklist

- [ ] Comando nella grammar parseCommand()
- [ ] Handler async implementato
- [ ] Registrato in execute()
- [ ] Help aggiornato
- [ ] Test locale in browser: F10 HELP mostra nuovo comando
- [ ] Nessun console.error

---

## 5. Workflow di sviluppo standard

### Setup locale

```powershell
# 1. Clone e setup
git clone <repo>
cd Genealogia

# 2. Verifica toolchain
.\cobol\bat\01_verify_toolchain.bat

# 3. Build
.\cobol\build.ps1

# 4. Test
npm run test:all
```

### Development cycle

```powershell
# 1. Crea branch
git checkout -b feature/NEWCMD

# 2. Implementa (vedi sezioni sopra)
# 3. Testa localmente
.\cobol\build.ps1
.\cobol\test.ps1
npm run test:all

# 4. Commit
git add .
git commit -m "feat: add NEWCMD - [descrizione]"

# 5. Push e PR
git push origin feature/NEWCMD
# Compila PR template con DoD checklist
```

### PR review checklist

- [ ] Titolo segue convenzione: `feat:`, `fix:`, `docs:`
- [ ] Descrizione chiara
- [ ] Tutti i test passano
- [ ] Checklist DoD compilata
- [ ] Nessun TODO nel codice
- [ ] Almeno un reviewer tecnico approva

---

## 6. Deployment e CI/CD

### GitHub Pages (frontend)

```powershell
# Build WebAssembly
.\engine_scummlike_web\build_web.cmd

# ci/workflows/pages.yml esegue automaticamente
```

### COBOL CLI (Windows batch)

```powershell
# Esecuzione locale
.\cobol\bat\04_run_ui.bat
.\cobol\bat\05_run_cli.bat REPORT
```

### Database migrations

Eseguire manualmente se necessario:
```powershell
python tools/test/test_db_migration.py
# Oppure:
npm run test:db:migration
```

---

## 7. Troubleshooting

### Build fallisce: `cobc not found`

```powershell
# Installa GnuCOBOL via MSYS2 o aggiungi al PATH
$env:Path = "C:\msys64\ucrt64\bin;$env:Path"
```

### Test fallisce: copybook mismatch

```powershell
# Verifica che CPY sia in cobol/copy/ e referenziata correttamente
# Linea COPY deve essere: COPY "<COPYNAME>.CPY".
```

### PR merge bloccata

```powershell
# Assicura che:
1. npm run test:all passi localmente
2. Nessun TODO nel codice consegnato
3. DoD checklist sia 100%
4. Almeno un reviewer approvi
```

---

## 8. Domande frequenti

**Q: Posso usare linguaggi diversi da COBOL per nuovi moduli?**
A: Sì, se necessario (Python per batch, JavaScript per UI). Verifica che sia già di standard nel progetto.

**Q: Come testo una modifica senza fare build completa?**
A: Per JavaScript: aperisci il file HTML e controlla console. Per COBOL: compila solo il modulo interessato prima di fare full build.

**Q: Dove trovo i dati di test?**
A: In `data/current/entities/` (NDJSON) o `data/backups/` per restore da backup.

**Q: Quale è il formato data standard?**
A: ISO 8601: `YYYY-MM-DD` per date, `YYYY-MM-DDTHH:MM:SSZ` per timestamp UTC.

---

## Supporto

- Roadmap: vedi [ROADMAP.md](docs/ROADMAP.md)
- Architettura: vedi [GN370_NEXT_ARCHITECTURE.md](docs/GN370_NEXT_ARCHITECTURE.md)
- DoD: vedi [DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)
- LEXICON: vedi [LEXICON.md](docs/LEXICON.md)

Per dubbi, apri una discussione o contatta il team tech.
