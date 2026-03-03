# Piano di migrazione completo verso COBOL/CICS interattivo

## 1) Obiettivo e vincoli

Obiettivo: migrare l'intero progetto Genealogia verso una piattaforma **COBOL/CICS interattiva**, avviabile da **shell Unix**, con **database SQL integrato** e una catena di build che produca:

- artefatti COBOL/CICS per ambienti mainframe/emulati;
- moduli di supporto in assembler per parti performance/integrazione basso livello;
- una **shell di pseudocompilazione** in linguaggio compilato multipiattaforma (proposta: C99 o Rust) eseguibile su Linux/macOS/Windows.

Vincoli pratici:
- mantenere la fruibilità web esistente durante la transizione;
- garantire rollback e coesistenza transitoria (strangler pattern);
- avere automazione CI ripetibile, senza dipendere da workstation specifiche.

## 2) Architettura target

### 2.1 Layer funzionali

1. **Canale interattivo CICS**
   - transazioni: `GNIN` (individui), `GNFM` (famiglie), `GNEV` (eventi), `GNQY` (query).
   - mappe BMS per schermate 3270.

2. **Business COBOL**
   - programmi online CICS (`EXEC CICS LINK/XCTL`);
   - servizi batch COBOL per import/export GEDCOM e riconciliazione.

3. **Persistence SQL**
   - DB relazionale (DB2 target principale, PostgreSQL target dev);
   - accesso tramite SQL embedded + copybook record layout condivisi.

4. **Assembler bridge**
   - routine assembler isolate per conversioni, packing/unpacking e adapter I/O;
   - interfaccia stabile via copybook e convenzioni chiamata documentate.

5. **Shell di pseudocompilazione multipiattaforma (`gnx`)**
   - CLI unica per build, lint, transpile, package, deploy e smoke test;
   - implementazione compilata (preferenza Rust, fallback C99).

### 2.2 Strategia di interoperabilità

- mantenere API/JSON esistenti come adapter esterno temporaneo;
- introdurre `facade` COBOL per domini core (individui/famiglie/eventi);
- migrazione progressiva per bounded context con feature toggle.

## 3) Modello dati SQL integrato

### 3.1 Schema minimo iniziale

- `persons(id, given_name, surname, sex, birth_date, death_date, place_id, ... )`
- `families(id, spouse1_id, spouse2_id, marriage_date, place_id, ... )`
- `events(id, person_id, family_id, event_type, event_date, place_id, source_id, ... )`
- `places(id, name, latitude, longitude, hierarchy, ... )`
- `sources(id, citation, repository, quality, ... )`
- `media(id, owner_type, owner_id, uri, mime_type, checksum, ... )`

### 3.2 Standard di accesso

- SQL embedded in COBOL con sezioni dedicate (`EXEC SQL BEGIN/END DECLARE SECTION`);
- naming coerente copybook `<ENTITA>.CPY` + DTO SQL;
- controllo concorrenza: optimistic lock (campo `version_no`) per online CICS;
- audit: `created_at`, `updated_at`, `updated_by_txn` su tabelle critiche.

## 4) Roadmap di migrazione (12 mesi)

### Fase 0 — Assessment e baseline (2 settimane)

Deliverable:
- inventario componenti e dipendenze;
- matrice funzionalità correnti vs target CICS;
- KPI baseline (latenza, throughput, error rate, copertura test).

Uscita:
- backlog prioritizzato e mappa rischi firmata.

### Fase 1 — Fondazioni piattaforma (4 settimane)

Deliverable:
- repository layout `cobol/`, `cics/`, `asm/`, `sql/`, `tooling/gnx/`;
- bootstrap DB (DDL + seed);
- pipeline CI per build COBOL + test SQL + lint copybook.

Uscita:
- ambiente dev riproducibile con singolo comando shell.

### Fase 2 — Shell di pseudocompilazione `gnx` (4 settimane)

Comandi target:
- `gnx init`, `gnx parse`, `gnx transpile`, `gnx build`, `gnx package`, `gnx run-smoke`.

Funzioni:
- parser DSL pseudo-COBOL (subset dichiarativo);
- generazione COBOL skeleton + JCL/template script;
- validazioni statiche (campi, pic clauses, naming).

Uscita:
- tool binario multipiattaforma versionato.

### Fase 3 — Dominio core: Individui/Famiglie (8 settimane)

Deliverable:
- transazioni CICS CRUD base;
- mappe BMS per funzioni principali;
- SQL embedded stabile su DB target;
- test integrazione online e batch.

Uscita:
- traffico reale parziale instradato a stack COBOL/CICS.

### Fase 4 — Eventi, fonti, luoghi + GEDCOM pipeline (8 settimane)

Deliverable:
- servizi completi su domini rimanenti;
- import/export GEDCOM in batch COBOL;
- routine assembler per conversioni performance-critical.

Uscita:
- parity funzionale >= 90% con sistema legacy.

### Fase 5 — Hardening, DR e cutover (6 settimane)

Deliverable:
- disaster recovery procedure;
- tuning SQL indici/piani;
- runbook operativo e formazione.

Uscita:
- go-live progressivo + decommission controllato moduli legacy.

## 5) Eseguibilità da shell Unix

### 5.1 Contratto CLI unico

```bash
./gnx init --profile dev
./gnx transpile specs/*.gnx --out cobol/gen
./gnx build --target cics --sql-profile pg-dev
./gnx run-smoke --txn GNIN,GNFM
./gnx package --format deploy-bundle
```

### 5.2 Script di orchestrazione consigliati

- `scripts/dev/up.sh`: avvio DB + runtime emulato + seed;
- `scripts/dev/build_all.sh`: transpile + compile + link + test;
- `scripts/dev/smoke.sh`: test transazioni critiche;
- `scripts/release/release.sh`: package e checksum artefatti.

## 6) Assembler multipiattaforma: approccio pragmatico

"Assembler multipiattaforma" non è realistico come singolo sorgente nativo per tutte le architetture.
Per rispettare il requisito in modo industriale:

1. definire un **IR basso livello comune** generato da `gnx`;
2. avere backend per:
   - HLASM (z/Architecture target mainframe),
   - GAS/NASM (x86_64 Linux dev),
   - opzionale ARM64 GAS.
3. mantenere test di equivalenza funzionale tra backend.

Risultato: stessa semantica, assembler specifico per architettura con toolchain coerente.

## 7) Strategia test e quality gates

- unit test su moduli COBOL isolati (framework compatibile ambiente scelto);
- integration test SQL (migrazioni + query plan);
- contract test su copybook e layout record;
- smoke test CICS automatizzati da CLI;
- performance gate su transazioni principali (P95/P99).

Quality gate minimo per release:
- test pass >= 95%;
- regressioni critiche = 0;
- rollback provato su ambiente stage;
- pacchetto firmato con checksum e manifest.

## 8) Sicurezza e compliance

- segregazione credenziali DB via secret manager;
- masking dati sensibili in dump/log;
- audit trail per operazioni di modifica genealogica;
- policy retention backup + cifratura at-rest/in-transit.

## 9) Team e responsabilità

- **Migration Lead**: pianificazione, dipendenze, rischio;
- **COBOL/CICS squad**: online/batch, BMS, transazioni;
- **Data squad**: modello SQL, performance, migrazioni;
- **Tooling squad**: `gnx` CLI, transpiler, pipeline;
- **SRE/Platform**: ambienti, osservabilità, runbook.

## 10) Backlog operativo iniziale (primi 30 giorni)

1. creare skeleton `gnx` (CLI + config + logging);
2. definire DSL minima (record, field, pic, sql-binding);
3. predisporre schema SQL v1 + migration tool;
4. implementare prima transazione end-to-end `GNIN`;
5. impostare smoke test shell + report CI;
6. redigere standard copybook/assembler interop.

## 11) Rischi principali e mitigazioni

- **Gap competenze COBOL/CICS** → pairing + training sprint iniziali;
- **Deriva requisiti multipiattaforma assembler** → IR + backend separati;
- **Tempi ETL GEDCOM** → pipeline incrementale e profiling precoce;
- **Instabilità cutover** → canary release + dual-write temporaneo controllato.

## 12) Definition of Done migrazione

La migrazione è completata quando:
- tutte le capability core operano su COBOL/CICS + SQL;
- CLI `gnx` consente build/test/package end-to-end da shell Unix;
- esistono backend assembler documentati per target previsti;
- monitoraggio, DR, sicurezza e runbook sono validati in stage/prod.

## 13) Stato di esecuzione (bootstrap implementato)

Implementazione minima già disponibile nel repository:

- CLI compilata `gnx` in C99: `tooling/gnx/src/gnx.c` + `tooling/gnx/Makefile`;
- comandi operativi `init`, `parse`, `transpile`, `build`, `run-smoke`, `package`;
- DSL esempio in `specs/individui.gnx`;
- schema SQL baseline in `sql/schema_v1.sql`;
- orchestrazione shell Unix in `scripts/dev/*.sh` e `scripts/release/release.sh`.

Questa baseline consente un percorso end-to-end eseguibile da shell Unix, come primo step concreto della migrazione.
