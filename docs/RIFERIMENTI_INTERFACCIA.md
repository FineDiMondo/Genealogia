# Riferimenti all'interfaccia

Questo documento raccoglie i riferimenti principali all'interfaccia utente (portali, gestionale, PWA, shell ISPF-like) presenti nel repository.

## 1) Architettura e perimetro interfaccia

- `README.md`
  - `app/` definita come Astro static + PWA senza backend applicativo.
  - distinzione tra portale storico `PORTALE_GN/` e nuova interfaccia Astro/PWA.

## 2) Entry point e navigazione principale

- `app/src/pages/index.astro`
  - menu funzioni con voci: Dashboard 370, Ricerca, Report, Jobs, PWA Search, Portale HTML, Help.
  - descrizione esplicita della "Interfaccia pubblica Astro su dataset corrente".

- `app/src/components/Navigation.astro`
  - menu trasversale gestionale (`/`, `/gestionale/*`) con indicatori ambiente.

## 3) Layout interfaccia terminale/ISPF

- `app/src/layouts/GestionalLayout.astro`
  - layout terminale stile System/370 (header, command line, status line, PF bar).
  - aggancio script tasti funzione (`/ispf-keys.js`).

- `app/public/ispf-keys.js`
  - routing command-line (`HOME`, `GO`, `FIND`, `SORT`).
  - binding PF1–PF12 e navigazione sezioni.

- `app/src/pages/gestionale/help.astro`
  - guida utente PF keys e comandi disponibili.

## 4) Pagine operative legate all'interfaccia

- `app/src/pages/gestionale/index.astro`
  - dashboard gestione con stato flusso dati e pipeline.

- `app/src/pages/search.astro`
  - redirect funzionale verso ricerca gestionale (`/gestionale/search`).

## 5) Nota su backend interfaccia

- `app/src/js/api.js`
  - accesso dati via fetch a JSON statici (`manifest`, `indexes`, `people/sample`).
  - non emergono endpoint backend applicativi da questo modulo.

## 6) Mappe transazionali (CICS/BMS)

- Nel repository **non risultano riferimenti** a mappe transazionali CICS/BMS (es. `DFHMSD`, `DFHMDI`, `DFHMDF`, `MAPSET`, terminali 3270).
- L'interfaccia attuale è web Astro/PWA con shell ISPF-like lato frontend (`GestionalLayout` + `ispf-keys.js`), quindi non emergono mappe transazionali COBOL/CICS in questo perimetro.
