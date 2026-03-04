# GN370 - Strategia packaging nativo definitivo (v0.1)

## Obiettivo

Distribuire GN370 come applicazione installabile su desktop e mobile mantenendo coerenza funzionale con la versione web e preservando le invarianti del progetto.

## Premessa

La V0 nasce come web app statica client-side. Il packaging nativo definitivo deve mantenere fruibilita offline, installazione semplice e aggiornamenti affidabili.

## Requisiti strategici

- Installazione semplice su Windows, macOS, Linux.
- Percorso mobile realistico (Android prima, iOS dopo).
- Aggiornamenti sicuri e controllati (canali stable/beta).
- Accesso locale ai dati con migrazione affidabile.
- Build ripetibili e firmate.

## Invarianti GN370 da rispettare

- Boot deterministico (`DB.status=EMPTY`).
- Nessun fetch automatico in avvio.
- Gate fetch inline invariato.
- Batch GEDCOM solo post-write.
- `IMPORT_LOG` completo per ogni record processato.

## Tecnologie candidate

| Opzione | Vantaggi | Svantaggi |
|---|---|---|
| Electron | ecosistema maturo, API native, multipiattaforma consolidata | footprint maggiore, consumo risorse piu alto |
| Tauri | binari leggeri, sicurezza shell migliore, prestazioni buone | ecosistema plugin piu giovane |
| PWA + Web Bundle | installazione rapida da browser, service worker offline, update veloce | API native limitate, dipendenza dal browser |
| React Native / Flutter | UX mobile nativa, accesso API dispositivo | riscrittura parziale UI, complessita aggiuntiva |

## Electron

Pro:
- ecosistema maturo;
- tooling e plugin ampi;
- integrazione desktop consolidata.

Contro:
- footprint RAM/CPU piu alto;
- bundle piu pesante.

## Tauri

Pro:
- binari piu leggeri;
- sicurezza forte lato shell;
- buone prestazioni.

Contro:
- integrazioni meno uniformi su alcuni plugin;
- curva di apprendimento Rust/tooling.

## PWA

Pro:
- zero install tradizionale;
- update immediato lato web;
- manutenzione semplificata.

Contro:
- limiti su accesso filesystem avanzato;
- comportamento offline e background non sempre uniforme.

## Framework mobile (Capacitor / React Native / Flutter)

Pro:
- UX mobile nativa o near-native;
- accesso API dispositivo esteso.

Contro:
- duplicazione parziale stack;
- aumento costo manutentivo.

## Direzione consigliata

1. Desktop primario: Tauri (target principale) con fallback Electron se emergono blocchi critici.
2. Web/PWA: mantenuta come canale rapido e dimostrativo.
3. Mobile: prima release con Capacitor su Android, iOS in fase successiva.
4. Combinazione iniziale suggerita da bozza: Tauri per desktop + PWA per scenario mobile/leggero.

## Architettura di packaging

## Core condiviso

- riuso modulo applicativo attuale (`assets/js/*`);
- separazione adapter I/O (filesystem, notifiche, aggiornamenti);
- API interne stabili per DB e import pipeline.

## Layer specifici per piattaforma

- `shell-desktop-tauri`;
- `shell-desktop-electron` (contingency);
- `shell-mobile-capacitor`;
- `shell-web-pwa`.

## Persistenza

- web: SQLite WASM/OPFS + fallback memoria.
- native desktop/mobile: SQLite locale nativo, con schema allineato.
- migrazioni versionate e rollback safe.

## Build e CI/CD

## Pipeline consigliata (GitHub Actions)

1. `lint + unit test + integration test`.
2. build matrix:
- Windows x64;
- macOS arm64/x64;
- Linux x64.
3. packaging artifact:
- installer/signing metadata;
- checksum e SBOM.
4. release:
- canale `beta` su tag prerelease;
- canale `stable` su tag firmati.
5. workflow dedicati:
- `build-tauri.yml` per desktop.
- `build-pwa.yml` per bundle PWA (`manifest.json` + `service-worker.js`).

## Quality gates

- parity test tra web e native su comandi shell principali.
- test import GEDCOM su fixture reali e edge case.
- smoke test aggiornamento in-place.
- verifica invarianti boot/fetch gate.

## Aggiornamenti applicazione

- Desktop:
  - auto-update differenziale dove disponibile;
  - controllo firma prima di applicare update;
  - canali separati stable/beta/nightly.
- Mobile:
  - distribuzione via store;
  - migrazioni DB atomiche al primo avvio post-update.
- PWA:
  - versionamento `service-worker.js`;
  - strategia cache con invalidazione esplicita.

## Distribuzione target

- Desktop:
  - `*.msi` (Windows), `*.dmg` (macOS), `*.AppImage` (Linux);
  - canale GitHub Releases;
  - valutazione store ufficiali (Microsoft Store, Mac App Store, Snapcraft).
- Mobile:
  - PWA su web;
  - opzionale wrapper Capacitor per output `APK`/`IPA`.

## Sicurezza

- Code signing obbligatorio per build distribuite.
- Scansione dipendenze con strumenti automatici (es. Dependabot, Snyk).
- Hardening runtime:
  - CSP rigorosa;
  - disabilitazione eval/remote code non necessario;
  - isolamento processi dove supportato.
- Secret management:
  - nessun segreto hardcoded;
  - vault/CI secret store con rotazione.
- Audit eventi di update/install:
  - versione sorgente;
  - versione target;
  - esito e reason code.
- Compliance privacy: includere informativa GDPR anche nel percorso installer/update.

## Piano di rollout

1. Fase alpha interna:
- desktop Tauri su Windows;
- raccolta telemetria minima anonima.

2. Fase beta allargata:
- aggiunta macOS/Linux;
- canale beta con update automatici.

3. Fase GA:
- rilascio stable desktop;
- documentazione installazione e recovery ufficiale.

4. Fase mobile:
- Android con Capacitor;
- validazione performance e UX offline.

## Rischi principali e mitigazioni

- Frammentazione stack:
  - mitigare con core condiviso e adapter minimi.
- Drift funzionale tra web e native:
  - mitigare con parity test in CI.
- Complessita signing/notarization:
  - mitigare con pipeline automatizzata e checklist release.
- Regressioni su import pipeline:
  - mitigare con test fixture GEDCOM e gate pre-release.

## Considerazioni future

- Supporto iOS pieno con policy dati e backup dedicati.
- Modalita enterprise con update controllati on-prem.
- Packaging air-gapped per enti archivistici.
- Telemetria opt-in orientata a qualita e non a profiling utente.
