# MVS/ — NUOVA ARCHITETTURA PARALLELA
## Sistema Genealogia Giardina Negrini — COBOL/CICS/File Sequenziali

```
mvs/
│
├── intro.html              ← ENTRYPOINT — animazione albero → menu MVS
│
├── assets/
│   ├── cics-370.css        ← Stile IBM 3270 (usato da tutte le schermate)
│   └── cics-runtime.js     ← COMMAREA + PF keys + dataset loader
│
├── GENMNU00.html           ← Main Menu CICS
├── GENIND01.html           ← Inquiry Individuo         [TODO]
├── GENFAM01.html           ← Inquiry Famiglia          [TODO]
├── GENTRE01.html           ← Albero Genealogico        [TODO]
├── GENTIT01.html           ← Titoli Nobiliari          [TODO]
├── GENEVE01.html           ← Eventi e Documenti        [TODO]
├── GENFON01.html           ← Fonti Documentali         [TODO]
├── GENGED01.html           ← Import/Export GEDCOM      [TODO]
│
├── copy/                   ← COPYLIB — definizioni struttura record (CPY)
│   ├── INDIVID.CPY         ← Record individuo  LRECL=200
│   ├── FAMIGLI.CPY         ← Record famiglia   LRECL=120
│   ├── EVENTI.CPY          ← Record evento     LRECL=150
│   ├── LUOGHI.CPY          ← Record luogo      LRECL=100
│   ├── FONTI.CPY           ← Record fonte      LRECL=250
│   ├── TITOLI.CPY          ← Record titolo     LRECL=80
│   └── WSCOMMON.CPY        ← Working Storage comune
│
├── data/                   ← DATASETS — file sequenziali a lunghezza fissa
│   ├── GENIND00.DAT        ← Individui  (vuoto, da popolare da GEDCOM)
│   ├── GENFAM00.DAT        ← Famiglie
│   ├── GENEVE00.DAT        ← Eventi
│   ├── GENLUO00.DAT        ← Luoghi
│   ├── GENFON00.DAT        ← Fonti
│   └── GENTIT00.DAT        ← Titoli nobiliari
│
├── proc/                   ← PROGRAMMI COBOL-style (Python, naming 8-char)
│   ├── GENVAL00.py         ← Parser CPY + validatore DAT
│   ├── GENIND01.py         ← Elabora GENIND00.DAT → individui.json
│   ├── GENFAM01.py         ← Elabora GENFAM00.DAT → famiglie.json
│   ├── GENTRE01.py         ← Calcola albero → albero.json
│   ├── GENGED01.py         ← Import GEDCOM → DAT
│   ├── GENRPT00.py         ← ORCHESTRATORE: chiama tutti i moduli
│   └── templates/          ← Jinja2 BMS Map templates (TODO)
│       ├── GENMNU00.j2
│       └── GENIND01.j2
│
├── out/
│   └── current/            ← JSON pre-calcolati da batch (letti dal portale)
│       ├── individui.json
│       ├── famiglie.json
│       ├── albero.json
│       ├── titoli.json
│       └── eventi.json
│
└── .github/workflows/
    ├── GENBLD00.yml        ← BUILD: valida DAT via schema CPY
    ├── GENRPT00.yml        ← REPORT: genera JSON da DAT
    └── GENPUB00.yml        ← PUBLISH: deploy GitHub Pages

```

## Regole architetturali

1. **CPY è legge** — nessun dataset senza la sua COPY
2. **DAT a lunghezza fissa** — niente CSV/JSON/YAML come sorgente
3. **Nessun backend dinamico** — portale legge solo JSON pre-generati
4. **HTML + JS vanilla** — zero framework nel frontend
5. **PF keys come unica navigazione**
6. **80×24 come vincolo di layout**
7. **Naming COBOL 8-char** — tutti i programmi in proc/
8. **Return codes IBM** — 0000/0004/0008/0012/0999
9. **Header H e Trailer T** — ogni DAT inizia con H, finisce con T
10. **3 JCL job massimo** — GENBLD, GENRPT, GENPUB

## Quick start

```bash
# Installa dipendenze Python
pip install jinja2

# Valida i DAT (quando popolati)
python mvs/proc/GENVAL00.py

# Genera tutti i JSON
python mvs/proc/GENRPT00.py

# Apri il portale
open mvs/intro.html
```
