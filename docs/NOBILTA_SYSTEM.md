# NOBILTA_SYSTEM

## Scopo

Sistema deterministico per la gestione dei titoli nobiliari:

- titoli di casata
- titoli personali
- trasmissione genealogica
- acquisizione per matrimonio
- validita temporale e conflitti

## File sequenziali

Cartella: `data/nobilta/`

- `TITOLI.DAT`
  - `ID_TITOLO|TIPO|DENOMINAZIONE|FEUDO_O_TERRITORIO|GRADO|NOTE`
- `CASATI_TITOLI.DAT`
  - `ID|CASATO|ID_TITOLO|DAL|AL|MODALITA|NOTE`
- `PERSONE_TITOLI.DAT`
  - `ID|PERSONA|ID_TITOLO|DAL|AL|MODALITA_ACQUISIZIONE|FONTE|NOTE`
- `MATRIMONI_TITOLI.DAT`
  - `ID|FAMIGLIA|CONIUGE1|CONIUGE2|DATA|EFFETTO|ID_TITOLO|NOTE`

Tutti i file:

- UTF-8 senza BOM
- 1 record = 1 riga
- delimitatore `|`

## Differenza tra titolo personale e di casato

- Titolo di casato:
  - associato al casato in `CASATI_TITOLI.DAT`
  - puo essere ereditario, da concessione o uso storico
- Titolo personale:
  - associato alla persona in `PERSONE_TITOLI.DAT`
  - con modalita esplicita (`NASCITA`, `SUCCESSIONE`, `MATRIMONIO`, `CONCESSIONE`, `ASSUNZIONE`, `USO_ONORIFICO`)

## Trasmissione maschile/femminile

Il modello registra i titoli in modo neutro rispetto al sesso: la trasmissione effettiva e dichiarata dai record.
Le regole storiche di linea maschile/femminile sono espresse nei dati (`MODALITA`, `NOTE`) e non hardcoded.

## Matrimonio e consorte

`MATRIMONI_TITOLI.DAT` registra effetti specifici:

- `ACQUISIZIONE_TITOLO`
- `CONSORTE_DI`
- `TRASMISSIONE_AI_FIGLI`
- `NESSUN_EFFETTO`

Durante la risoluzione:

- se il matrimonio e valido alla data di riferimento, il titolo puo essere aggiunto con modalita `MATRIMONIO`
- la validita pratica dipende anche da `ID_TITOLO` e periodi dei record

## Uso storico vs titolo legale

- `USO_STORICO`: titolo documentato in fonti storiche o genealogiche, non necessariamente legale attivo
- `CONCESSIONE` / `EREDITARIO`: titoli con natura formale (in base alle fonti registrate)

## Priorita di risoluzione

In pagina persona, i titoli sono ordinati per:

1. Modalita acquisizione:
   - `CONCESSIONE` > `SUCCESSIONE` > `NASCITA` > `MATRIMONIO` > `USO_ONORIFICO` > `ASSUNZIONE`
2. Grado:
   - `PRINCIPE` > `DUCA` > `MARCHESE` > `CONTE` > `BARONE`

## Data di riferimento persona

- se defunto: data morte
- se vivo: data odierna
- fallback: ultimo dato disponibile

## Validazione e log

Script:

- `proc/validate_data.sh`
- `proc/validate_data.ps1`

Controlli principali:

- denominazioni titolo duplicate
- riferimenti mancanti (persona/casato/titolo/fonte)
- titolo personale fuori range casato-titolo
- incongruenze matrimonio-titolo (coniugi non appartenenti alla famiglia)

Log:

- `logs/titles_conflicts.log`
- `logs/marriage_title_inconsistencies.log`
