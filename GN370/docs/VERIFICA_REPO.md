# VERIFICA_REPO

## 0) Impostazione Verifica (Regole)

```text
Timestamp verifica: 2026-03-05T09:24:54.6667805+01:00
Repo verificato: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370
Git base (repo padre): C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS
Branch corrente: feature/gedcom-ims-file-clean
HEAD commit: d4496a8717e5bfab0a86b6cfccd9a042610b4d0d
Stato git su GN370: ?? GN370/ (cartella non tracciata nel repo padre)
Ambiente: node v24.14.0, npm 11.9.0
Config toolchain rilevate in GN370: nessuna (nessun package.json/eslint/prettier/tsconfig/vite/webpack).
Metodo: tutte le affermazioni derivano da file locali o output comandi locali.
```

## 1) Snapshot Repo (sintesi)

```text
Totale file inventariati: 79
Distribuzione per tipologia:
- BUILD/CONFIG: 4
- COBOL-SRC: 24
- COBOL-WASM: 1
- DATASET: 9
- DOC: 4
- IO-ADAPTER: 6
- JOB: 2
- OTHER: 7
- RUNTIME-JS: 13
- TOOLING: 4
- TX: 3
- UI: 2
File binari rilevati: 0
```

Riferimento inventario completo: `C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/INVENTARIO_REPO.md`

## 2) Verifica Paradigma (Aderenza)

### A) Batch

1. Moduli JOB in `assets/jobs/*.job.*`
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/jobs/GN370DEMO.job.mjs
12: export default {
13:   jobName: "GN370DEM",
14:   steps: [
15:     {
```
   Azione correttiva minima: nessuna.

2. Ogni JOB dichiara JOBNAME e STEP list
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/jobs/GN370DEMO.job.mjs
13:   jobName: "GN370DEM",
14:   steps: [
35:       stepName: "S002READ",
```
   Azione correttiva minima: nessuna.

3. Loader COBOL/WASM invocabile da step
   Stato: PARTIAL
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/CALL.mjs
26:     const imsPath = path.resolve(this.gnRoot, "LOAD", "IMS", `${pgm}.mjs`);
27:     const cblPath = path.resolve(this.gnRoot, "LOAD", "CBL", `${pgm}.mjs`);
28:     return (await loadFrom(imsPath)) || (await loadFrom(cblPath));
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/wasm/.keep (placeholder, nessun .wasm)
```
   Azione correttiva minima: MISSING implementare loader WASM in `runtime/region` o estendere `APP/REGION/CALL.mjs` per `.wasm`.

4. Spool batch e RC aggregation
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs
29:     return {
30:       jobName,
31:       steps: stepReports,
32:       rc: aggregateRc(stepReports.map((s) => s.rc))
33:     };
73:       context.journal.append("ABEND", abend);
74:       context.spool.writeBoth(`${abend.abendCode} ${abend.message}`);
```
   Azione correttiva minima: nessuna.

Stato complessivo A (Batch): PARTIAL

### B) Online IMS/DC

1. Scheduler kron/region presente
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs
92:   async startRegion(regionDef) {
118:   async dispatchMessage(regionId, message) {
157:   async stopRegion(regionId) {
```
   Azione correttiva minima: nessuna.

2. Moduli TX presenti (`tx/*.js` o equivalente)
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/tx/GN370DEMO.tx.mjs
12: export function buildGn370DemoRegion() {
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/TX/TXGN01.mjs
1: export function runTxGn01(command) {
```
   Azione correttiva minima: nessuna.

3. attachOnlineProgram + dispatch message-driven
   Stato: PARTIAL
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs
112:     context.onlineProgram = regionDef?.onlineProgram || null;
125:     const normalized = context.terminal.ingestInput(message || {});
135:     if (typeof context.onlineProgram === "function") {
136:       const out = await context.onlineProgram({
```
   Azione correttiva minima: MISSING metodo esplicito `attachOnlineProgram(regionId, fn)` in `runtime/region/kron.mjs`.

4. Terminale 24x80 (input/output buffer)
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/terminal-24x80.mjs
5: export class Terminal24x80 {
6:   constructor(rows = 24, cols = 80) {
9:     this.output = Array.from({ length: rows }, () => blankLine(cols));
13:   ingestInput(input = {}) {
20:   updateOutput(lines = []) {
```
   Azione correttiva minima: nessuna.

Stato complessivo B (Online): PARTIAL

### C) COBOL-in-WASM

1. Moduli COBOL-WASM o placeholder
   Stato: PARTIAL
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/wasm/.keep
File unico presente nella cartella cobol/wasm (nessun modulo .wasm rilevato).
```
   Azione correttiva minima: MISSING compilare almeno un modulo `cobol/wasm/<PGM>.wasm` e collegarlo al loader step.

2. IO adapter con OPEN/READ/WRITE/REWRITE/DELETE/CLOSE
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/io-adapter.mjs
35:   OPEN(ddname, mode = "INPUT") {
45:   READ(ddname, opts = {}) {
57:   WRITE(ddname, record) {
67:   REWRITE(ddname, record, opts = {}) {
81:   DELETE(ddname, opts = {}) {
95:   CLOSE(ddname) {
```
   Azione correttiva minima: nessuna.

3. Dataset in RAM durante la run
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/dataset-store.mjs
9:   constructor() {
10:     this.datasets = new Map();
23:         records: [],
25:         index: new KsdsIndex(),
```
   Azione correttiva minima: nessuna.

Stato complessivo C (COBOL-in-WASM): PARTIAL

### D) Contract DDNAME + PSB/PCB gating

1. Formato PSB/PCB e loader presenti
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/psb/GN37DEMO.psb.json
2:   "psbName": "GN37DEMO",
3:   "pcbs": [
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/psb-loader.mjs
27: export function loadPsbDocument(input) {
```
   Azione correttiva minima: nessuna.

2. Gating su OPEN e operazioni IO
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/dd-allocator.mjs
66:     if (!isDdAuthorized(psbModel, dd.ddname, "OPEN")) {
67:       raiseAbend(ABEND.DDNAUTH, `DD ${dd.ddname} not authorized by active PSB/PCB`, { ddname: dd.ddname, op: "OPEN" });
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/io-adapter.mjs
23:     if (!isDdAuthorized(this.psbModel, ddname, op)) {
24:       raiseAbend(ABEND.DDNAUTH, `DD ${ddname} not authorized for ${op}`, { ddname, op });
```
   Azione correttiva minima: nessuna.

3. ABEND 12 su DDNAME non autorizzata
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/abend.mjs
1: export const ABEND = Object.freeze({
2:   DDNAUTH: "ABEND12-DDNAUTH",
12: const RC_BY_ABEND = Object.freeze({
13:   [ABEND.DDNAUTH]: 12,
```
   Azione correttiva minima: nessuna.

Stato complessivo D (DDNAME/PSB/PCB): OK

### E) Control Plane

1. Journal append-only
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/journal.mjs
8:   append(eventType, payload = {}) {
16:     this.entries.push(record);
20:   snapshot() {
21:     return this.entries.slice();
```
   Azione correttiva minima: nessuna.

2. Checkpoint previsto (opzionale)
   Stato: PARTIAL
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_ARCHITECTURE_SPEC.md
82: 4. `kron.stopRegion()` con flush/checkpoint configurabile
Comando su runtime: rg -n "checkpoint|ckpt|CHKPT" runtime -> nessun match
```
   Azione correttiva minima: MISSING introdurre `runtime/region/checkpoint.mjs` e hook in `startBatch/stopRegion`.

3. Stop-on-severe + RC policy
   Stato: OK
   Evidenza:
```text
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/rc-policy.mjs
16: export function shouldStopOnRc(rc, policy = {}) {
19:   if (cls === "SEVERE") {
20:     return true;
PATH: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs
24:       if (shouldStopOnRc(stepReport.rc, step?.rcPolicy || options.rcPolicy)) {
```
   Azione correttiva minima: nessuna.

Stato complessivo E (Control Plane): PARTIAL

### Riepilogo Paradigma

```text
A Batch: PARTIAL
B Online IMS/DC: PARTIAL
C COBOL-in-WASM: PARTIAL
D DDNAME + PSB/PCB gating: OK
E Control plane: PARTIAL
```

## 3) Pulizia Repo (deterministica e minima)

### 3.1 Lint / Format / Build / Test

```text
Comandi eseguiti:
- node -v; npm -v
  Output: v24.14.0 / 11.9.0
- Ricerca config toolchain (package/eslint/prettier/tsconfig/vite/webpack/jest/vitest/babel)
  Output: nessun file trovato in GN370
- Sintassi JS: node --check su tutti i file *.mjs
  Output: NODE_CHECK_OK
```

Esito: `lint/format/test/build` non eseguibili in modo standard per assenza `package.json` e script npm.
Azione minima: MISSING creare `C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/package.json` con script `lint`, `format`, `test`, `build` (anche placeholder iniziali).

### 3.2 Dead Files / Duplicati

```text
Evidenza file vuoti:
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gncat.mjs (0 byte)
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnpak.mjs (0 byte)
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnreidx.mjs (0 byte)
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/TX/TXGN02.mjs (0 byte)
Evidenza doppio runtime:
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnrun.mjs importa ../APP/REGION/KRON.mjs
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs esiste ma non ha entrypoint script dedicato
```

Classificazione proposta:

```text
REMOVE (sicuro):
- Nessun file marcato REMOVE in questa verifica (mantenuta minimizzazione rischio).

ARCHIVE (consigliato):
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gncat.mjs -> archive/ (scaffold vuoto)
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnpak.mjs -> archive/ (scaffold vuoto)
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnreidx.mjs -> archive/ (scaffold vuoto)
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/TX/TXGN02.mjs -> archive/ (scaffold vuoto)

KEEP (necessario):
- Placeholder .keep in directory strutturali (es. C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/wasm/.keep)
- Doppio stack runtime temporaneamente, fino a consolidamento entrypoint
```

### 3.3 Coerenza Naming e Struttura

```text
Mismatch osservati:
- Stack duplicato: APP/REGION/* (legacy) e runtime/region/* (nuovo).
- TX duplicati: APP/TX/* e tx/*.
- Naming misto uppercase/lowercase (KRON.mjs vs kron.mjs).
```

Azione minima: non rinominare ora; prima consolidare il percorso runtime unico e solo dopo eventuale rename guidato.

## 4) Report Elementi Creati (Tracciamento)

Stato git: la cartella GN370 risulta non tracciata nel repo padre (`?? GN370/`), quindi commit di origine non determinabili per file singolo.
Proxy usato: timestamp file (`mtime`) locale.

```text
PATH	RIGHE	TIPOLOGIA	DESCRIZIONE	ORIGINE
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/jobs/GN370DEMO.job.mjs	52	JOB	Batch job definition with jobName, step list, DD cards and JS execute handlers.	mtime 2026-03-05T08:07:54.744Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/psb/GN37DEMO.psb.json	11	BUILD/CONFIG	Control/config definition; first line: "psbName": "GN37DEMO",	mtime 2026-03-05T08:07:44.592Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/src/.keep	0	COBOL-SRC	Placeholder file to preserve empty directory in repository.	mtime 2026-03-05T08:08:11.975Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/wasm/.keep	0	COBOL-WASM	Placeholder file to preserve empty directory in repository.	mtime 2026-03-05T08:08:11.974Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNCITAT.cpy	12	COBOL-SRC	COBOL source/copybook; first statement: GN370-CITATION.CPY	mtime 2026-03-05T08:02:39.494Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNDBREC.cpy	121	COBOL-SRC	COBOL source/copybook; first statement: GN370-DB-REC.CPY  (UNION RECORD)	mtime 2026-03-05T08:03:06.742Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNEVENT.cpy	14	COBOL-SRC	COBOL source/copybook; first statement: GN370-EVENT.CPY	mtime 2026-03-05T08:02:18.110Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNFAMIL.cpy	19	COBOL-SRC	COBOL source/copybook; first statement: GN370-FAMILY.CPY	mtime 2026-03-05T08:02:18.109Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNFAMLNK.cpy	9	COBOL-SRC	COBOL source/copybook; first statement: GN370-FAMILY-LINK.CPY	mtime 2026-03-05T08:02:39.492Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNHOUSE.cpy	11	COBOL-SRC	COBOL source/copybook; first statement: GN370-HOUSE.CPY	mtime 2026-03-05T08:02:39.495Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNJOURN.cpy	12	COBOL-SRC	COBOL source/copybook; first statement: GN370-JOURNAL.CPY	mtime 2026-03-05T08:02:18.113Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNMDLNK.cpy	10	COBOL-SRC	COBOL source/copybook; first statement: GN370-MEDIA-LINK.CPY	mtime 2026-03-05T08:02:39.498Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNMEDIA.cpy	11	COBOL-SRC	COBOL source/copybook; first statement: GN370-MEDIA.CPY	mtime 2026-03-05T08:02:39.497Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPEREVT.cpy	8	COBOL-SRC	COBOL source/copybook; first statement: GN370-PERSON-EVENT.CPY	mtime 2026-03-05T08:02:39.493Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPERSN.cpy	23	COBOL-SRC	COBOL source/copybook; first statement: GN370-PERSON.CPY	mtime 2026-03-05T08:02:18.108Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPLACE.cpy	14	COBOL-SRC	COBOL source/copybook; first statement: GN370-PLACE.CPY	mtime 2026-03-05T08:02:18.110Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPRHSE.cpy	10	COBOL-SRC	COBOL source/copybook; first statement: GN370-PERSON-HOUSE.CPY	mtime 2026-03-05T08:02:39.496Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNRELAT.cpy	13	COBOL-SRC	COBOL source/copybook; first statement: GN370-RELATION.CPY	mtime 2026-03-05T08:02:39.493Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNSOURC.cpy	15	COBOL-SRC	COBOL source/copybook; first statement: GN370-SOURCE.CPY	mtime 2026-03-05T08:02:18.111Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNTITAS.cpy	13	COBOL-SRC	COBOL source/copybook; first statement: GN370-TITLE-ASSIGNMENT.CPY	mtime 2026-03-05T08:02:18.112Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNTITLE.cpy	10	COBOL-SRC	COBOL source/copybook; first statement: GN370-TITLE.CPY	mtime 2026-03-05T08:02:18.111Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/datasets/.keep	0	DATASET	Placeholder file to preserve empty directory in repository.	mtime 2026-03-05T08:08:11.977Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_ARCHITECTURE_SPEC.md	187	DOC	Documentation: GN370 Paradigma Runtime Definitivo (Batch + Online)	mtime 2026-03-05T08:04:03.637Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_FOLDER_STRUCTURE.md	55	DOC	Documentation: GN370 Struttura Cartelle Proposta	mtime 2026-03-05T08:04:16.550Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_MIN_TESTS.md	73	DOC	Documentation: GN370 Test Minimi Obbligatori	mtime 2026-03-05T08:04:36.383Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_SCAFFOLD_PLAN.md	71	DOC	Documentation: GN370 Scaffold Plan (Forma + Interfacce)	mtime 2026-03-05T08:04:51.513Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/dataset-store.mjs	103	IO-ADAPTER	Exports class DatasetStore.	mtime 2026-03-05T08:07:07.115Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/flush-export.mjs	27	IO-ADAPTER	Exports functions buildDeterministicExport, stringifyDeterministicExport.	mtime 2026-03-05T08:07:28.135Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/io-adapter.mjs	104	IO-ADAPTER	Exports class IoAdapter.	mtime 2026-03-05T08:07:23.650Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/ksds-index.mjs	26	IO-ADAPTER	Exports class KsdsIndex.	mtime 2026-03-05T08:06:54.399Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/abend.mjs	53	RUNTIME-JS	Exports class AbendedError.	mtime 2026-03-05T08:05:21.033Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/dd-allocator.mjs	82	RUNTIME-JS	Exports class LockTable.	mtime 2026-03-05T08:05:50.261Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/journal.mjs	28	RUNTIME-JS	Exports class AppendOnlyJournal.	mtime 2026-03-05T08:06:00.543Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs	180	RUNTIME-JS	Exports class Kron.	mtime 2026-03-05T08:06:41.629Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/psb-loader.mjs	57	RUNTIME-JS	Exports functions normalizePsbDocument, loadPsbDocument, buildAuthorizationMap, isDdAuthorized.	mtime 2026-03-05T08:05:35.993Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/rc-policy.mjs	27	RUNTIME-JS	Exports functions classifyRc, aggregateRc, shouldStopOnRc.	mtime 2026-03-05T08:05:25.433Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/region-context.mjs	17	RUNTIME-JS	Exports class RegionContext.	mtime 2026-03-05T08:06:16.519Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/spool.mjs	33	RUNTIME-JS	Exports class SpoolBuffer.	mtime 2026-03-05T08:06:05.311Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/terminal-24x80.mjs	36	UI	Exports class Terminal24x80.	mtime 2026-03-05T08:06:12.315Z
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/tx/GN370DEMO.tx.mjs	36	TX	Exports functions buildGn370DemoRegion.	mtime 2026-03-05T08:08:02.793Z
```

## 5) MISSING Espliciti (con posizione attesa)

```text
- MISSING: modulo/i COBOL WASM eseguibili in C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/wasm (es. <PGM>.wasm)
- MISSING: aggancio esplicito online program (API attach) in C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs
- MISSING: checkpoint runtime in C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/checkpoint.mjs + hook in kron
- MISSING: package.json/scripts standard in C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/package.json
```

## 6) Esito Finale

```text
Verifica completata in modo ripetibile e tracciabile su stato reale del repo.
Documenti prodotti:
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/INVENTARIO_REPO.md
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/VERIFICA_REPO.md
- C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/CHANGES_PROPOSTI.md (opzionale)
```
