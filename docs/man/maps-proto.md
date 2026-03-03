# man maps / mappa / proto (V0)

## maps

- `maps`

Mostra elenco mappe ASCII legacy disponibili (`MAPPA 1..9`, varianti `A/B/C/D`).

## mappa

- `mappa <n>`
- `mappa <n><variante>` (es. `mappa 1a`, `mappa 9d`)

Renderizza blocchi ASCII legacy.

## map (alias rapido)

- `map <n|n[a-d]>` usa renderer legacy mappe
- `map --period <era>` usa renderer geografico SVG

## proto

- `proto help`
- `proto home [80|120|all]`
- `proto world <1..9> [seq|80|120|all]`
- `proto legend`
- `proto nav`
- `proto css`
- `proto all`
- `proto lint [all|home|world 1]`

### Guard automatico

L'output `proto` e `mappa` puo emettere warning `MAP-GUARD` su:

- verbosita eccessiva
- duplicazioni eccessive
- token obbligatori mancanti
