# Contributing

## Branch Strategy

1. Crea feature branch da `develop`:
   - `git checkout develop`
   - `git pull origin develop`
   - `git checkout -b feature/<nome-feature>`
2. Commit atomici con prefissi:
   - `feat:`
   - `fix:`
   - `refactor:`
   - `chore:`
   - `docs:`
3. Push branch e apri PR verso `develop`.
4. Quando `develop` e' stabile, PR `develop -> main`.

## Local Checks

```bash
bash jobs/run_job.sh
cd app
npm ci || npm install
npm run build
```

Controlli Python:

```bash
python3 -m py_compile GIARDINA/03_PROG/batch.py
```

