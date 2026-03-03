# man import (V0)

## GEDCOM

- `import gedcom [--dry-run] [--auto-skip-low] [--strict]`
- `import status`
- `import log [--n N]`
- `import log --record <id>`
- `import conflicts`
- `import review <corr_id>`
- `import accept <corr_id>`
- `import batch rerun`

## Altri import

- `import herald`
- `import notarial`
- `import nobility`

## Nota pipeline

L'import GEDCOM usa pipeline S1..S7 e produce entry su `IMPORT_LOG`.
