# CHANGES_PROPOSTI

```text
Patch minime proposte (PR-ready) senza refactor invasivo:

1) runtime/region/kron.mjs
   - Cosa: aggiungere attachOnlineProgram(regionId, fn) e usarlo nei flussi online.
   - Perche: chiude gap requisito Online IMS/DC (attach esplicito).
   - Rischio: basso (API additiva).

2) runtime/region/program-loader.mjs (nuovo) + integrazione in kron
   - Cosa: loader unico per JS/WASM (priorita LOAD/* o cobol/wasm).
   - Perche: chiude gap COBOL-in-WASM invocabile da step.
   - Rischio: medio (tocca path esecuzione programmi).

3) runtime/region/checkpoint.mjs (nuovo)
   - Cosa: checkpoint snapshot minimale (datasets/journal/spool) invocato in stopRegion/startBatch fine job.
   - Perche: allinea control plane con specifica.
   - Rischio: basso/medio (solo export serializzato).

4) package.json (nuovo, minimo)
   - Cosa: script lint/format/test/build placeholder + node --check.
   - Perche: rende pulizia e CI ripetibili.
   - Rischio: basso.

5) Archive scaffolding vuoto
   - Cosa: spostare scripts/gncat.mjs, scripts/gnpak.mjs, scripts/gnreidx.mjs, APP/TX/TXGN02.mjs in C:/Users/LENOVO/OneDrive/GENIMS/Genealogia IMS/GN370/docs/old o archive/.
   - Perche: riduce rumore senza perdita storica.
   - Rischio: basso (file senza implementazione).
```