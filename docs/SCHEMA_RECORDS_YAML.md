# Schema Records YAML

## Campi comuni (tutti i record)

- `id`: string, formato `YYYY-MM-DD__tipo__soggetti__luogo__slug`
- `type`: `evento|famiglia|persona|fonte|stemma`
- `date.sort`: `YYYY` o `YYYY-MM` o `YYYY-MM-DD`
- `date.display`: string leggibile
- `place`: luogo principale
- `links.families`: array ID famiglia
- `links.people`: array ID persona
- `links.sources`: array ID fonte
- `links.heraldry`: array ID stemma
- `reliability`: `DOCUMENTATO|STAMPA|ATTRIBUITO|RICOSTRUITO|TRADIZIONE`
- `media[]`: `{file, caption}`
- `tags[]`: etichette libere
- `notes`: testo libero

## Evento

Campi specifici:

- `title`
- `event_kind`: `matrimonio|investitura|atto|nascita|morte|pubblicazione-stampa|...`

## Famiglia

Campi specifici:

- `slug` (usato per URL stabili)
- `name`

## Persona

Campi specifici:

- `name`
- `birth_date` (opzionale, ISO)
- `death_date` (opzionale, ISO)

## Fonte

Campi specifici:

- `title`

## Stemma

Campi specifici:

- `title`
- `status`: `DOCUMENTATO|ATTRIBUITO|RICOSTRUITO`
- `family_id`: ID record famiglia
- `blazon`: blasonatura testuale

