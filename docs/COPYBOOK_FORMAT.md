# COPYBOOK Format (MVP)

Questo progetto usa un sottoinsieme stabile di COPY COBOL per descrivere record fixed-length.

## Regole supportate

- Livelli: `01` e `05`
- PIC:
  - `PIC X(n)` alfanumerico
  - `PIC 9(n)` numerico
- `OCCURS n` supportato come array lineare
- `REDEFINES` ignorato in MVP

## Parsing runtime

- Il parser legge i campi `05` in ordine.
- Offset calcolati in byte logici (MVP ASCII-safe).
- Lunghezza record = somma lunghezze campi.

## Record `.rec`

- Un file = un record.
- Formato: fixed-length, concatenazione campi nel medesimo ordine della copybook.
- Padding: spazi per `X(n)`, zeri left-pad per `9(n)`.
- Newline finale ammessa, ignorata dal parser.

## Validazioni

- File più corto di `totalLength`: `(ERR) record truncated`
- File più lungo di `totalLength`: `(WRN) extra bytes ignored`
- `PIC 9(n)` con caratteri non numerici/spazio: `(ERR) numeric field invalid chars`

## Open Points

1. Persistenza output su GitHub Pages: solo preview; write reale disponibile in launcher/batch.
2. Alternativa key=value: non adottata nel MVP (coerenza COBOL).
3. Estensione PIC: COMP/COMP-3 non inclusi in questa versione.
4. REDEFINES: al momento ignorato, da modellare con regole esplicite.
5. UTF-8: parser byte-safe solo per set ASCII; caratteri multi-byte da trattare in fase futura.
