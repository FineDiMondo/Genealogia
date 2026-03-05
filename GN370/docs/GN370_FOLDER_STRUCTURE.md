# GN370 Struttura Cartelle Proposta

```text
GN370/
  runtime/
    region/
      kron.mjs
      region-context.mjs
      psb-loader.mjs
      dd-allocator.mjs
      spool.mjs
      journal.mjs
      terminal-24x80.mjs
      rc-policy.mjs
      abend.mjs
    io/
      io-adapter.mjs
      dataset-store.mjs
      ksds-index.mjs
      flush-export.mjs
  assets/
    jobs/
      GN370DEMO.job.mjs
    psb/
      GN37DEMO.psb.json
  tx/
    GN370DEMO.tx.mjs
  cobol/
    wasm/
      .keep
    src/
      .keep
  datasets/
    .keep
  spool/
    .keep
  docs/
    GN370_ARCHITECTURE_SPEC.md
    GN370_FOLDER_STRUCTURE.md
    GN370_MIN_TESTS.md
    GN370_SCAFFOLD_PLAN.md
```

## Regole di posizionamento
- `runtime/region`: control plane (kron, PSB/DD gating, sessione, spool/journal, terminale).
- `runtime/io`: data plane I/O COBOL virtualizzato in RAM.
- `assets/jobs`: definizioni JCL-like modulari.
- `assets/psb`: definizioni PSB/PCB normalizzate per runtime.
- `tx`: bootstrap transazioni online (start region + attach pgm).
- `cobol/wasm`: moduli COBOL compilati WASM.
- `cobol/src`: sorgenti COBOL.
- `datasets`: persistenza dataset esportabile.
- `spool`: export spool run.
- `docs`: specifiche, test plan, piani di scaffolding.
