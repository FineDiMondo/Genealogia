# TX2 - Sottosistema CICS/COBOL Statico

Sottosistema isolato in `tx2/` con mappe terminali compilate, DDL canoniche, DCLGEN/ER auto-generati e job JCL-like.

## Avvio

Entry consigliato:

- `/tx2/pages/avvio-boot.html`

Flusso:

1. boot animato testuale
2. mappa scelta transazione
3. scelta `1` -> TX2 console
4. scelta `2` -> AS-IS (`../../index.html`, fallback `../index.html`)

## Regole UI

- unico template: `tx2/mappe/template_mappa.html`
- no-scroll: `100vh` + `overflow:hidden`
- PF keys: `PF3`, `PF4`, `PF5`, `PF6`, `PF12`
- fallback conferma browser: `ALT+6`
- ogni pagina mostra sempre:
  - MAPPA VUOTA 24x80 (`area_mappa_vuota`)
  - DIZIONARIO CAMPI (`area_dizionario_campi`)

## Pipeline tecnica

```sh
sh tx2/strumenti/tx2_verifica_coerenza.sh
sh tx2/strumenti/tx2_dclgen.sh
sh tx2/strumenti/tx2_er_gen.sh
sh tx2/strumenti/tx2_compila_mappe.sh
```

## Job JCL-like

```sh
sh tx2/jobs/TX2-ALL.jcl.sh
```

Job disponibili:

- `TX2-DB.jcl.sh`
- `TX2-GEDCOM.jcl.sh`
- `TX2-LLM.jcl.sh`
- `TX2-FAM.jcl.sh`
- `TX2-PER.jcl.sh`

## Sorgenti di verita

- DDL: `tx2/schema/ddl/*.sql`
- DCLGEN generati: `tx2/schema/dclgen/*-DCLGEN.cpy`
- ER model generato: `tx2/schema/er/er_modello.json`
- MAPOBJ compilate: `tx2/pages/*.html`
