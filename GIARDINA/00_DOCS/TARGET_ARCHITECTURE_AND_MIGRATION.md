# Target Architecture and Migration Roadmap

## Target Architecture (COBOL-like su UNIX)

- `00_DOCS`: metodo, standard, assessment, changelog.
- `01_COPY`: contratti dati stile COPY COBOL.
- `02_DATA`: raw/curated/records come sorgente unica.
- `03_PROG`: validator, builder, ingest, compiler copy->schema.
- `04_JCL`: orchestrazione batch idempotente.
- `05_OUT`: output statico, indici, report.
- `06_TEST`: dati e test automatici.

## Scelte tecniche

- Record sequenziali YAML, un file = un record.
- Schemi definiti in COPY e compilati in JSON Schema per automazione.
- Nessun database runtime obbligatorio.
- Output sito statico + search index JSON.

## Roadmap incrementale

1. Baseline:
   - Creare struttura `GIARDINA/`.
   - Definire COPY per EVENT/PERSON/FAMILY/SOURCE/ARMS/PLACE/MEDIA.
2. Contratti:
   - Implementare compiler COPY -> JSON Schema.
   - Versionare codici errore e return codes.
3. Data quality:
   - Implementare validator con controlli schema + integrità referenziale + media.
4. Build:
   - Generare timeline, pagine entità, indici, report qualità.
5. Ingest:
   - Rinominare media da RAW a CURATED e creare record MEDIA preliminare.
6. CI:
   - Workflow validate + build.
7. Migrazione controllata:
   - Allineare gradualmente contenuti legacy verso `GIARDINA/02_DATA/RECORDS`.

## Criteri di completamento

- `make validate` ritorna `0` con dataset valido.
- `make build` genera sito in `05_OUT/site`.
- `05_OUT/reports` contiene report validazione e qualità.
- CI esegue validate+build+test.

