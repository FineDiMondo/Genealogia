# ANALISI FUNZIONALE GNHM0001 - Home Gateway Risorgimentale

## 1. Contesto

La home attuale richiede conoscenza preventiva di comandi shell (`theme`, `proto`) per raggiungere la prima schermata utile del prototipo 9 mondi.
Questo crea attrito per utenti non tecnici e non e coerente con l'obiettivo di navigazione guidata dichiarato nella Bibbia del Prototipo.

Riferimenti Bibbia:
- SHEET 03: boot deterministico e render home 3x3.
- SHEET 06: navigazione 9 mondi via PF1..PF9.
- SHEET 07..09: sequenze transazionali a 9 step.

## 2. Obiettivo funzionale

Introdurre una pagina iniziale unificata (`GNHM0001`) che:
- renda raggiungibile la prima schermata risorgimentale in 1 click;
- preservi il canale esperto via shell;
- mantenga invarianti V0 (gate, boot, no auto-fetch dati).

## 3. Ambito

In scope:
- redesign completo della prima pagina;
- percorso guidato per accesso rapido a HOME 9 mondi e mondo selezionato;
- accesso esplicito a import e console esperta.

Out of scope:
- modifica pipeline GEDCOM S1..S7;
- cambiamenti schema DB;
- variazioni alle regole gate su fetch dati.

## 4. Attori

- Utente esplorativo: vuole "vedere subito" il prototipo risorgimentale.
- Utente operativo: deve importare ZIP/GEDCOM senza errore di flusso.
- Utente esperto: vuole shell piena e comandi diretti.

## 5. Casi d'uso principali

### UC-HM-001 - Avvio guidato
Precondizione: applicazione avviata, `DB: EMPTY`.
Flusso:
1. Utente apre `/`.
2. Sistema mostra `GNHM0001` con tema risorgimentale attivo.
3. Utente seleziona `PF1 Avvio Guidato 9 Mondi`.
4. Sistema mostra HOME prototipo (`proto home 80`) nel pannello output.
Postcondizione: utente in vista prototipo senza digitare comandi.

### UC-HM-002 - Apertura mondo diretto
Precondizione: `GNHM0001` visibile.
Flusso:
1. Utente clicca una card mondo (es. ORIGINI).
2. Sistema avvia rendering equivalente a `proto world 1 80`.
Postcondizione: utente nella vista transazionale del mondo selezionato.

### UC-HM-003 - Accesso import
Precondizione: `GNHM0001` visibile.
Flusso:
1. Utente seleziona `PF2 Import GEDCOM` o `PF3 Ripristino ZIP`.
2. Sistema attiva picker file su gesto esplicito.
Postcondizione: rispetto invarianti `VH-02` (nessun autoload).

### UC-HM-004 - Passaggio a console esperta
Precondizione: `GNHM0001` visibile.
Flusso:
1. Utente seleziona `PF4 Console Esperto`.
2. Sistema porta focus su input command-line.
Postcondizione: workflow tradizionale shell disponibile.

## 6. Requisiti funzionali

- FR-HM-001: la home deve presentare CTA primaria "Avvio Guidato 9 Mondi".
- FR-HM-002: la home deve mostrare griglia 3x3 dei mondi ORIGINI..RADICI.
- FR-HM-003: ogni card mondo deve essere cliccabile e associata a `WORLD:n`.
- FR-HM-004: deve essere presente barra PF con almeno PF1..PF4 e PF9 (tema).
- FR-HM-005: deve essere sempre visibile stato `DB` e `MEM`.
- FR-HM-006: il passaggio a vista guidata non richiede comando testuale.
- FR-HM-007: l'utente puo sempre tornare alla shell completa.
- FR-HM-008: tema risorgimentale attivo di default all'apertura home.
- FR-HM-009: nessun fetch dati automatico durante boot/home render.
- FR-HM-010: ogni azione PF/CTA genera entry `JOURNAL` append-only.
- FR-HM-011: in caso errore azione, messaggio chiaro in output (`line-warn`/`line-error`).
- FR-HM-012: deve restare disponibile il comando `theme` per override manuale.

## 7. Regole HMI applicate

- Recognition over recall: azioni principali sempre visibili.
- Progressive disclosure: principiante guidato, esperto con shell.
- Consistency: token visuali e semantici (`@SELF@`, `#ROOT#`, `~GAP~`, `PF:n`).
- Error prevention: azioni non valide bloccate o con hint contestuale.

## 8. Stati funzionali della pagina

- ST-HM-BOOT: rendering struttura pagina e statusbar.
- ST-HM-IDLE: attesa azione utente.
- ST-HM-NAV: esecuzione navigazione prototipo (home/world/nav).
- ST-HM-IMPORT-PICK: apertura file picker su gesto esplicito.
- ST-HM-CONSOLE: focus input shell.
- ST-HM-ERROR: errore operativo mostrato in area output.

## 9. KPI operativi

- KPI-HM-001: tempo apertura prima vista significativa < 8 secondi.
- KPI-HM-002: tasso successo "prima vista risorgimentale" > 95%.
- KPI-HM-003: riduzione errori comando iniziale (`comando non riconosciuto`) >= 60%.

## 10. Criteri di accettazione

- AC-HM-001: aprendo `/`, la CTA primaria e visibile senza scroll.
- AC-HM-002: click CTA primaria produce output equivalente a `proto home 80`.
- AC-HM-003: click card mondo produce output equivalente a `proto world <n> 80`.
- AC-HM-004: invarianti boot/gate esistenti restano verdi.
- AC-HM-005: percorso esperto shell resta invariato e funzionante.

## 11. Tracciabilita ai vincoli V0

- `DB.status=EMPTY` al boot: preservato.
- No data fetch automatico: preservato.
- User gesture per import: preservato.
- JOURNAL append-only: esteso con eventi home gateway, senza update/delete.
