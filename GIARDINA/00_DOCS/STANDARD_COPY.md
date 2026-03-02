# Standard COPY COBOL

## Sintassi

- Livello 01: dichiarazione contratto
- Livello 05: definizione campo
- Commenti con `*`
- Nomi campo: uppercase con trattini

Esempio:

```text
01  COPY-EVENT-RECORD.
05  FIELD EVT-ID REQUIRED TYPE=STRING PATTERN=....
```

## Attributi supportati

- `REQUIRED|OPTIONAL`
- `TYPE=STRING|INTEGER|LIST`
- `MAX=<n>`
- `PATTERN=<regex>`
- `ENUM=A,B,C`
- `ITEM=STRING` per liste

## Compilazione

`03_PROG/copy_compiler.py` converte `.CPY` in JSON Schema sotto `05_OUT/index/schemas`.

