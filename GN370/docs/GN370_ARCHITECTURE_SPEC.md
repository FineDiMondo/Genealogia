# GN370 Paradigma Runtime Definitivo (Batch + Online)

## 1) Scopo
Questa specifica definisce il paradigma target di GN370 con separazione rigida tra:
- Logica applicativa COBOL (unica fonte di verita business).
- Servizi di runtime JavaScript/WASM (region, scheduler, VFS, spool, terminale).

Vincoli di progetto:
- Esecuzione 100% client-side (browser o wrapper desktop).
- Dataset percepiti come file COBOL, implementati in RAM durante la run.
- Accesso DDNAME vincolato da PSB/PCB attiva.
- Violazioni gravi con ABEND12-DDNAUTH.
- Journal append-only, RC policy coerente batch/online.

## 2) Principi non negoziabili
1. COBOL contiene tutta la logica applicativa (I/O, validazioni, CALL chain).
2. JS non interpreta record business e non codifica regole funzionali.
3. Ogni run e deterministica: stessi input => stessi output.
4. Ogni REGION isola sessione, dataset allocati, spool e journal.
5. Ogni I/O COBOL passa da un unico IO Adapter controllato.

## 3) Modello operativo

### 3.1 Batch (JCL-like)
Un Job e composto da step sequenziali:
- `JOB`
- `STEP` (EXEC PGM)
- `DD` allocation per step

Ogni step riceve:
- Programma COBOL (WASM/module loader)
- PARM
- PSB/PCB attiva
- DD map allocata

Semantica:
- Stop on severe error.
- RC job = massimo RC step eseguiti.
- `DISP=PASS` concettuale: output di step N disponibile a step N+1 senza persistenza forzata intermedia.

Output batch:
- spool SYSOUT/SYSPRINT
- job RC finale
- flush/export dataset richiesti

### 3.2 Online (IMS/DC-like)
Una transazione online avvia una REGION con:
- Sessione utente
- Terminale 24x80
- PSB/PCB gating
- DD allocation
- Spool/Journal

Semantica message-driven:
1. input terminale (ENTER/PF)
2. enqueue message
3. dispatch al COBOL attachato
4. output map 24x80
5. commit/rollback logico + journal

## 4) Lifecycle runtime

### 4.1 Lifecycle Batch
1. `kron.startBatch(jobDef)`
2. per ogni step:
- load PSB/PCB
- allocate DD
- create spool + journal scope step
- invoke COBOL program
- RC classify + policy check
- flush dataset (in base a policy/disp)
3. chiusura job con RC aggregato

### 4.2 Lifecycle Online
1. `kron.startRegion(regionDef)`
2. attach programma COBOL online
3. loop eventi:
- receive terminal input
- dispatch message
- COBOL I/O via adapter
- produce buffer output 24x80
4. `kron.stopRegion()` con flush/checkpoint configurabile

## 5) RC Policy e ABEND taxonomy

### 5.1 RC classi
- `OK`: RC 0-4
- `WARN`: RC 8
- `SEVERE`: RC >= 12

Regola batch default:
- continua su `OK/WARN`
- interrompe su `SEVERE`

Regola online default:
- transazione corrente termina su `SEVERE`
- regione resta viva salvo ABEND di control plane

### 5.2 ABEND standard
- `ABEND12-DDNAUTH`: DD non autorizzata da PSB/PCB (OPEN o operazione)
- `ABEND14-PSB`: PSB/PCB assente, incoerente o non caricabile
- `ABEND16-DDALLOC`: conflitto allocation/DISP/lock
- `ABEND20-IOOPEN`: OPEN/CLOSE runtime non valido
- `ABEND22-IOREAD`: errore READ/GU/GN
- `ABEND24-IOWRITE`: errore WRITE/REWRITE/DELETE
- `ABEND30-RUNTIME`: errore control plane non classificato

Formato minimo evento ABEND (journal/spool):
- timestamp logico
- region/job-step id
- codice ABEND
- ddname/pgm correnti
- messaggio tecnico

## 6) Contratto PSB/PCB e DD gating

### 6.1 Formato canonico runtime (JSON)
```json
{
  "psbName": "GN37PSB",
  "pcbs": [
    {
      "pcbName": "GNMSTR",
      "ddnames": ["PERSON", "FAMILY", "EVENT"],
      "allow": ["OPEN", "READ", "WRITE", "REWRITE", "DELETE"]
    }
  ]
}
```

### 6.2 Regole di autorizzazione
- Un programma vede solo DDNAME presenti nei PCB della PSB attiva.
- Verifica obbligatoria su:
- `OPEN(dd, mode)`
- `READ/GU/GN`
- `WRITE/ISRT`
- `REWRITE/REPL`
- `DELETE/DLET`
- Violazione => `ABEND12-DDNAUTH` immediato.

### 6.3 Compatibilita deck testuale
Il loader puo supportare parsing deck PSB/PCB storici e normalizzazione al formato JSON canonico.

## 7) DD allocation e VFS in memoria

### 7.1 DD allocation
Tabella runtime per region/step:
- DDNAME
- dataset handle RAM
- DISP (`SHR|OLD|NEW`)
- lock logico
- attributi (`RECFM`, `LRECL`, tipo accesso, key spec)

### 7.2 Dataset store RAM
Tipi previsti:
- Sequential (cursor + record list)
- RRDS-like (record number offset)
- KSDS-like (key index -> offset)

Persistenza:
- flush a fine step/job
- checkpoint/commit online
- export deterministico (file/zip)

## 8) Spool, journal, checkpoint

### 8.1 Spool
- SYSOUT/SYSPRINT per step o transazione
- output testuale 24x80 compatibile
- sempre consultabile a fine run

### 8.2 Journal append-only
- traccia operativa e audit
- nessuna riscrittura eventi
- ordine totale per run (sequence id monotono)

### 8.3 Checkpoint (design-ready)
- snapshot metadata region
- flush dataset marcati
- resume point opzionale

## 9) Regole di evoluzione
1. Nuove funzioni devono estendere `runtime/*`, non spostare business in JS.
2. Nuovi programmi COBOL si integrano via loader/call chain senza modificare il paradigma.
3. Ogni estensione deve rispettare gating PSB/PCB e taxonomy ABEND.
4. Ogni modifica deve mantenere determinismo e tracciabilita.
