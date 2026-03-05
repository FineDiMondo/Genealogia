# GN370 Scaffold Plan (Forma + Interfacce)

## Obiettivo fase scaffold
Realizzare una base estendibile senza logica business GN370:
- scheduler REGION (`kron`)
- IO adapter con gating PSB/PCB
- job demo batch
- tx demo online

## File scaffold previsti

### runtime/region
- `abend.mjs`: codici ABEND e factory errori runtime.
- `rc-policy.mjs`: classifica RC (`OK/WARN/SEVERE`) e regole stop.
- `psb-loader.mjs`: parsing/normalizzazione PSB/PCB in formato canonico.
- `dd-allocator.mjs`: allocation DD, DISP e lock logici.
- `region-context.mjs`: stato regione/sessione (utente, terminale, journal, spool).
- `terminal-24x80.mjs`: buffer input/output e gestione PF/ENTER.
- `journal.mjs`: append-only event log.
- `spool.mjs`: writer SYSOUT/SYSPRINT in memoria/export.
- `kron.mjs`: orchestrazione lifecycle batch e online.

### runtime/io
- `dataset-store.mjs`: dataset RAM (SEQ/RRDS/KSDS metadata).
- `ksds-index.mjs`: indice chiave per KSDS-like.
- `io-adapter.mjs`: API COBOL (`OPEN/READ/WRITE/REWRITE/DELETE/CLOSE`) + gating.
- `flush-export.mjs`: flush deterministico dataset/spool/journal verso output.

### assets e tx
- `assets/psb/GN37DEMO.psb.json`: PSB/PCB demo.
- `assets/jobs/GN370DEMO.job.mjs`: job demo con 2 step (PASS concettuale).
- `tx/GN370DEMO.tx.mjs`: tx demo message-driven (ENTER/PF).

## Interfacce chiave (target)

```js
// runtime/region/kron.mjs
startBatch(jobDef, options) -> Promise<JobReport>
startRegion(regionDef) -> Promise<RegionHandle>
dispatchMessage(regionId, message) -> Promise<DispatchResult>
stopRegion(regionId) -> Promise<StopReport>
```

```js
// runtime/io/io-adapter.mjs
OPEN(ddname, mode)
READ(ddname, opts)
WRITE(ddname, record)
REWRITE(ddname, record)
DELETE(ddname, key)
CLOSE(ddname)
```

```js
// runtime/region/psb-loader.mjs
loadPsbDocument(input) -> PsbRuntimeModel
isDdAuthorized(psbModel, ddname, op) -> boolean
```

```js
// runtime/region/dd-allocator.mjs
allocateDdSet(ddCards, datasetStore, lockTable) -> DdRuntimeMap
releaseDdSet(regionId, ddMap, lockTable)
```

## Criteri scaffold
- Nessuna logica business COBOL nel JS scaffold.
- Contratti API stabili e commentati.
- Errori non implementati espressi con ABEND coerente.
- Pronto per integrazione moduli COBOL/WASM reali.
