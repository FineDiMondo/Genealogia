# Assessment Report - Portale Giardina

Data assessment: 2026-03-02

## 1. Inventario sintetico

- Pipeline storica COBOL-like presente: `copy/`, `data/`, `proc/`, `PORTALE_GN/`.
- Pipeline YAML introdotta: `01_raw/`, `02_curated/`, `03_records/`, `04_site/`, `src/portale_giardina/`.
- Workflow CI presenti: deploy Pages + nuova validate/build.
- Stato Git non pulito con molte modifiche eterogenee e cancellazioni/non tracciati.

## 2. Problemi rilevati

### Naming e struttura

- Coesistono naming diversi (`PORTALE_GN/*`, `04_site/*`, `data/*.DAT`, `03_records/*.yml`).
- Doppio modello cartelle senza root unificata di governance.
- Alcuni artefatti runtime/versioning mescolati a contenuti sorgente.

### Dati e qualità

- Multi-source of truth: dati sequenziali DAT e record YAML convivono senza contratto unico.
- Controlli qualità non centralizzati in un unico job batch con return code standard.
- Possibili link mancanti/orfani dipendono da quale pipeline viene usata.

### DevOps e rilascio

- Build e deploy dipendono da pipeline diverse (Pages su `PORTALE_GN`, nuova pipeline su `04_site`).
- Mancano codici errore/warning uniformi (`0/4/8`) su tutti i job.
- Mancano report consolidati in cartella unica output.

### Debito tecnico

- Script duplicati tra shell e PowerShell su più percorsi.
- Documentazione distribuita e parzialmente ridondante.
- Ambiente locale senza Python nel PATH (rischio esecuzione locale).

### Rischi funzionali

- Rischio mixing araldico se stato stemma non gestito con regola univoca.
- Rischio attendibilità implicita: record senza fonte forte devono essere marcati.
- Rischio regressioni se si modifica direttamente `PORTALE_GN` senza batch unico.

## 3. Quick wins

1. Introdurre root governata `GIARDINA/` con separazione COPY/DATA/PROG/JCL/OUT/TEST.
2. Definire contratti COPY canonicali e compilazione automatica in JSON Schema.
3. Unificare orchestration batch (`make ingest|validate|build|all`) con return code standard.
4. Produrre report centrali in `05_OUT/reports`.
5. Eseguire migrazione incrementale senza toccare pipeline legacy.

