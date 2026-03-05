# INVENTARIO_REPO

```text
Timestamp verifica: 2026-03-05T08:24:14.543Z
Root analizzata: C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370
Totale file inventariati: 79
File non binari (<=1MB): 79
File binary/asset o >1MB: 0
Distribuzione tipologie:
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
```

## 1) Albero cartelle (profondita massima 6)

```text
.
|-- APP/
|   |-- REGION/
|   |   |-- CALL.mjs
|   |   |-- DDALOC.mjs
|   |   |-- DLIGW.mjs
|   |   |-- KRON.mjs
|   |   |-- PSBPCB.mjs
|   |   |-- SPOOL.mjs
|   |   \-- VFS.mjs
|   |-- TX/
|   |   |-- TXGN01.mjs
|   |   \-- TXGN02.mjs
|   \-- UI/
|       \-- .keep
|-- assets/
|   |-- jobs/
|   |   \-- GN370DEMO.job.mjs
|   \-- psb/
|       \-- GN37DEMO.psb.json
|-- CNTL/
|   |-- JCL/
|   |   \-- GNVALJOB.jcl
|   |-- MFS/
|   |   \-- .keep
|   |-- PCB/
|   |   \-- GN37PCB.pcb
|   |-- PROC/
|   |   \-- .keep
|   |-- PSB/
|   |   \-- GN37PSB.psb
|   \-- SYSIN/
|       \-- GNVALIN.ctl
|-- cobol/
|   |-- src/
|   |   \-- .keep
|   \-- wasm/
|       \-- .keep
|-- CPY/
|   |-- GNCITAT.cpy
|   |-- GNCOMMH.cpy
|   |-- GNDBREC.cpy
|   |-- GNDLIIF.cpy
|   |-- GNEVENT.cpy
|   |-- GNFAMIL.cpy
|   |-- GNFAMLNK.cpy
|   |-- GNHOUSE.cpy
|   |-- GNJOURN.cpy
|   |-- GNMDLNK.cpy
|   |-- GNMEDIA.cpy
|   |-- GNPEREVT.cpy
|   |-- GNPERSN.cpy
|   |-- GNPLACE.cpy
|   |-- GNPRHSE.cpy
|   |-- GNRELAT.cpy
|   |-- GNSOURC.cpy
|   |-- GNSTATC.cpy
|   |-- GNTITAS.cpy
|   \-- GNTITLE.cpy
|-- datasets/
|   \-- .keep
|-- docs/
|   |-- GN370_ARCHITECTURE_SPEC.md
|   |-- GN370_FOLDER_STRUCTURE.md
|   |-- GN370_MIN_TESTS.md
|   \-- GN370_SCAFFOLD_PLAN.md
|-- DSN/
|   |-- CTL/
|   |   \-- .keep
|   |-- LINK/
|   |   |-- CITATN.lnk
|   |   |-- FAMCHD.lnk
|   |   \-- PEREVT.lnk
|   |-- MASTER/
|   |   |-- FAMILY.dat
|   |   \-- PERSON.dat
|   \-- WORK/
|       \-- .keep
|-- LOAD/
|   |-- CBL/
|   |   \-- .keep
|   \-- IMS/
|       \-- .keep
|-- OBJ/
|   |-- CBL/
|   |   \-- .keep
|   \-- IMS/
|       \-- .keep
|-- runtime/
|   |-- io/
|   |   |-- dataset-store.mjs
|   |   |-- flush-export.mjs
|   |   |-- io-adapter.mjs
|   |   \-- ksds-index.mjs
|   \-- region/
|       |-- abend.mjs
|       |-- dd-allocator.mjs
|       |-- journal.mjs
|       |-- kron.mjs
|       |-- psb-loader.mjs
|       |-- rc-policy.mjs
|       |-- region-context.mjs
|       |-- spool.mjs
|       \-- terminal-24x80.mjs
|-- scripts/
|   |-- gncat.mjs
|   |-- gnpak.mjs
|   |-- gnreidx.mjs
|   \-- gnrun.mjs
|-- SPOOL/
|   \-- .keep
|-- SRC/
|   |-- ASM/
|   |   \-- .keep
|   |-- CBL/
|   |   \-- GNUTIL01.cbl
|   \-- IMS/
|       |-- IGBAT01.cbl
|       \-- IGONL01.cbl
\-- tx/
    \-- GN370DEMO.tx.mjs
```

## 2) Inventario file non binari

```text
PATH	NOME FILE	ESTENSIONE	RIGHE	TIPOLOGIA	DESCRIZIONE
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/CALL.mjs	CALL.mjs	.mjs	40	RUNTIME-JS	Exports class CallResolver.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/DDALOC.mjs	DDALOC.mjs	.mjs	63	RUNTIME-JS	Exports functions parseParams, parseDdCard, allocateStepDds.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/DLIGW.mjs	DLIGW.mjs	.mjs	58	IO-ADAPTER	Exports class DLIGateway.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/KRON.mjs	KRON.mjs	.mjs	178	RUNTIME-JS	Exports class KronRegion.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/PSBPCB.mjs	PSBPCB.mjs	.mjs	102	RUNTIME-JS	Exports functions parsePsbDeck, parsePcbDeck, loadPsbPcb, buildAuthorizedDdSet.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/SPOOL.mjs	SPOOL.mjs	.mjs	50	RUNTIME-JS	Exports class StepSpool.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/REGION/VFS.mjs	VFS.mjs	.mjs	119	IO-ADAPTER	Exports class VFS.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/TX/TXGN01.mjs	TXGN01.mjs	.mjs	3	TX	Exports functions runTxGn01.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/TX/TXGN02.mjs	TXGN02.mjs	.mjs	0	TX	Empty scaffold module (no implementation).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/APP/UI/.keep	.keep	(none)	0	UI	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/jobs/GN370DEMO.job.mjs	GN370DEMO.job.mjs	.mjs	52	JOB	Batch job definition with jobName, step list, DD cards and JS execute handlers.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/assets/psb/GN37DEMO.psb.json	GN37DEMO.psb.json	.json	11	BUILD/CONFIG	Control/config definition; first line: "psbName": "GN37DEMO",
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CNTL/JCL/GNVALJOB.jcl	GNVALJOB.jcl	.jcl	11	JOB	GNVALJOB JOB CLASS=A,MSGCLASS=H
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CNTL/MFS/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CNTL/PCB/GN37PCB.pcb	GN37PCB.pcb	.pcb	5	BUILD/CONFIG	Control/config definition; first line: PCB  PCBERSN  TYPE=DB  DDNAMES=PERSON,PEREVT,CITATN
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CNTL/PROC/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CNTL/PSB/GN37PSB.psb	GN37PSB.psb	.psb	6	BUILD/CONFIG	Control/config definition; first line: PSB  GN37PSB
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CNTL/SYSIN/GNVALIN.ctl	GNVALIN.ctl	.ctl	3	BUILD/CONFIG	Control/config definition; first line: MODE=VALIDATE
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/src/.keep	.keep	(none)	0	COBOL-SRC	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/cobol/wasm/.keep	.keep	(none)	0	COBOL-WASM	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNCITAT.cpy	GNCITAT.cpy	.cpy	12	COBOL-SRC	COBOL source/copybook; first statement: GN370-CITATION.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNCOMMH.cpy	GNCOMMH.cpy	.cpy	3	COBOL-SRC	COBOL source/copybook; first statement: 01 GNCOMMH-REC.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNDBREC.cpy	GNDBREC.cpy	.cpy	121	COBOL-SRC	COBOL source/copybook; first statement: GN370-DB-REC.CPY  (UNION RECORD)
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNDLIIF.cpy	GNDLIIF.cpy	.cpy	6	COBOL-SRC	COBOL source/copybook; first statement: 01 GNDLIIF-AREA.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNEVENT.cpy	GNEVENT.cpy	.cpy	14	COBOL-SRC	COBOL source/copybook; first statement: GN370-EVENT.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNFAMIL.cpy	GNFAMIL.cpy	.cpy	19	COBOL-SRC	COBOL source/copybook; first statement: GN370-FAMILY.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNFAMLNK.cpy	GNFAMLNK.cpy	.cpy	9	COBOL-SRC	COBOL source/copybook; first statement: GN370-FAMILY-LINK.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNHOUSE.cpy	GNHOUSE.cpy	.cpy	11	COBOL-SRC	COBOL source/copybook; first statement: GN370-HOUSE.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNJOURN.cpy	GNJOURN.cpy	.cpy	12	COBOL-SRC	COBOL source/copybook; first statement: GN370-JOURNAL.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNMDLNK.cpy	GNMDLNK.cpy	.cpy	10	COBOL-SRC	COBOL source/copybook; first statement: GN370-MEDIA-LINK.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNMEDIA.cpy	GNMEDIA.cpy	.cpy	11	COBOL-SRC	COBOL source/copybook; first statement: GN370-MEDIA.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPEREVT.cpy	GNPEREVT.cpy	.cpy	8	COBOL-SRC	COBOL source/copybook; first statement: GN370-PERSON-EVENT.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPERSN.cpy	GNPERSN.cpy	.cpy	23	COBOL-SRC	COBOL source/copybook; first statement: GN370-PERSON.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPLACE.cpy	GNPLACE.cpy	.cpy	14	COBOL-SRC	COBOL source/copybook; first statement: GN370-PLACE.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNPRHSE.cpy	GNPRHSE.cpy	.cpy	10	COBOL-SRC	COBOL source/copybook; first statement: GN370-PERSON-HOUSE.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNRELAT.cpy	GNRELAT.cpy	.cpy	13	COBOL-SRC	COBOL source/copybook; first statement: GN370-RELATION.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNSOURC.cpy	GNSOURC.cpy	.cpy	15	COBOL-SRC	COBOL source/copybook; first statement: GN370-SOURCE.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNSTATC.cpy	GNSTATC.cpy	.cpy	7	COBOL-SRC	COBOL source/copybook; first statement: 01 GNSTATC-CODES.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNTITAS.cpy	GNTITAS.cpy	.cpy	13	COBOL-SRC	COBOL source/copybook; first statement: GN370-TITLE-ASSIGNMENT.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/CPY/GNTITLE.cpy	GNTITLE.cpy	.cpy	10	COBOL-SRC	COBOL source/copybook; first statement: GN370-TITLE.CPY
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/datasets/.keep	.keep	(none)	0	DATASET	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_ARCHITECTURE_SPEC.md	GN370_ARCHITECTURE_SPEC.md	.md	187	DOC	Documentation: GN370 Paradigma Runtime Definitivo (Batch + Online)
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_FOLDER_STRUCTURE.md	GN370_FOLDER_STRUCTURE.md	.md	55	DOC	Documentation: GN370 Struttura Cartelle Proposta
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_MIN_TESTS.md	GN370_MIN_TESTS.md	.md	73	DOC	Documentation: GN370 Test Minimi Obbligatori
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/GN370_SCAFFOLD_PLAN.md	GN370_SCAFFOLD_PLAN.md	.md	71	DOC	Documentation: GN370 Scaffold Plan (Forma + Interfacce)
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/CTL/.keep	.keep	(none)	0	DATASET	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/LINK/CITATN.lnk	CITATN.lnk	.lnk	0	DATASET	Empty dataset placeholder file (no records).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/LINK/FAMCHD.lnk	FAMCHD.lnk	.lnk	0	DATASET	Empty dataset placeholder file (no records).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/LINK/PEREVT.lnk	PEREVT.lnk	.lnk	0	DATASET	Empty dataset placeholder file (no records).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/MASTER/FAMILY.dat	FAMILY.dat	.dat	0	DATASET	Empty dataset placeholder file (no records).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/MASTER/PERSON.dat	PERSON.dat	.dat	0	DATASET	Empty dataset placeholder file (no records).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/DSN/WORK/.keep	.keep	(none)	0	DATASET	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/LOAD/CBL/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/LOAD/IMS/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/OBJ/CBL/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/OBJ/IMS/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/dataset-store.mjs	dataset-store.mjs	.mjs	103	IO-ADAPTER	Exports class DatasetStore.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/flush-export.mjs	flush-export.mjs	.mjs	27	IO-ADAPTER	Exports functions buildDeterministicExport, stringifyDeterministicExport.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/io-adapter.mjs	io-adapter.mjs	.mjs	104	IO-ADAPTER	Exports class IoAdapter.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/io/ksds-index.mjs	ksds-index.mjs	.mjs	26	IO-ADAPTER	Exports class KsdsIndex.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/abend.mjs	abend.mjs	.mjs	53	RUNTIME-JS	Exports class AbendedError.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/dd-allocator.mjs	dd-allocator.mjs	.mjs	82	RUNTIME-JS	Exports class LockTable.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/journal.mjs	journal.mjs	.mjs	28	RUNTIME-JS	Exports class AppendOnlyJournal.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/kron.mjs	kron.mjs	.mjs	180	RUNTIME-JS	Exports class Kron.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/psb-loader.mjs	psb-loader.mjs	.mjs	57	RUNTIME-JS	Exports functions normalizePsbDocument, loadPsbDocument, buildAuthorizationMap, isDdAuthorized.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/rc-policy.mjs	rc-policy.mjs	.mjs	27	RUNTIME-JS	Exports functions classifyRc, aggregateRc, shouldStopOnRc.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/region-context.mjs	region-context.mjs	.mjs	17	RUNTIME-JS	Exports class RegionContext.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/spool.mjs	spool.mjs	.mjs	33	RUNTIME-JS	Exports class SpoolBuffer.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/runtime/region/terminal-24x80.mjs	terminal-24x80.mjs	.mjs	36	UI	Exports class Terminal24x80.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gncat.mjs	gncat.mjs	.mjs	0	TOOLING	Empty scaffold module (no implementation).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnpak.mjs	gnpak.mjs	.mjs	0	TOOLING	Empty scaffold module (no implementation).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnreidx.mjs	gnreidx.mjs	.mjs	0	TOOLING	Empty scaffold module (no implementation).
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/scripts/gnrun.mjs	gnrun.mjs	.mjs	32	TOOLING	import path from "node:path";
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/SPOOL/.keep	.keep	(none)	0	DATASET	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/SRC/ASM/.keep	.keep	(none)	0	OTHER	Placeholder file to preserve empty directory in repository.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/SRC/CBL/GNUTIL01.cbl	GNUTIL01.cbl	.cbl	8	COBOL-SRC	COBOL source/copybook; first statement: IDENTIFICATION DIVISION.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/SRC/IMS/IGBAT01.cbl	IGBAT01.cbl	.cbl	9	COBOL-SRC	COBOL source/copybook; first statement: IDENTIFICATION DIVISION.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/SRC/IMS/IGONL01.cbl	IGONL01.cbl	.cbl	8	COBOL-SRC	COBOL source/copybook; first statement: IDENTIFICATION DIVISION.
C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/tx/GN370DEMO.tx.mjs	GN370DEMO.tx.mjs	.mjs	36	TX	Exports functions buildGn370DemoRegion.
```

## 3) File binary/asset o grandi

```text
Nessun file BINARY/ASSET o >1MB rilevato nello snapshot.
```

## 4) Note di classificazione

```text
Regole applicate in modo deterministico (path + estensione + contenuto):
- DOC: .md/.txt o cartella docs
- RUNTIME-JS: moduli scheduler/region in runtime/region o APP/REGION (esclusi adapter IO);
- IO-ADAPTER: runtime/io e adapter VFS/DLIGW;
- JOB: assets/jobs/*.job.* e JCL
- TX: tx/* e APP/TX/*;
- COBOL-SRC: .cbl/.cpy
- COBOL-WASM: cobol/wasm/* o .wasm
- DATASET: datasets/, DSN/, SPOOL/, .dat, .lnk;
- BUILD/CONFIG: PSB/PCB/CTL/JSON di controllo e file di configurazione toolchain;
- UI: terminal-24x80 e APP/UI;
- TEST: pattern *test*/*spec* (nessun file trovato);
- TOOLING: scripts/*.mjs;
- OTHER: placeholder strutturali non riconducibili alle classi richieste.
```