# GN370 - Bozza workflow autorizzativi avanzati (v0.1)

## Scopo

Definire un workflow autorizzativo robusto, tracciabile e integrato alla pipeline GEDCOM, per garantire qualita dati e separazione effettiva delle responsabilita.

## Principi guida

- Separazione dei ruoli (SoD): chi propone non approva da solo.
- Tracciabilita end-to-end: ogni decisione lascia evidenza audit.
- Validazione preventiva: regole automatiche prima di coinvolgere revisori.
- Human-in-the-loop sui casi critici.
- Nessun bypass delle invarianti di import GN370.

## Invarianti di integrazione GN370

- `DB.status=EMPTY` al boot, nessun fetch automatico.
- Gate fetch inline invariato.
- Scrittura dati solo nella fase S6 (`db-writer.js`).
- Batch S7 (`batch-agt-ic.js`, `batch-agt-norm2.js`, `batch-agt-corr.js`) solo dopo S6.
- Ogni record deve produrre una entry in `IMPORT_LOG`.

## Ruoli coinvolti

| Ruolo | Responsabilita | Azioni tipiche |
|---|---|---|
| Proposer | propone import/correzione | avvia proposta, allega contesto |
| Validator Bot | applica regole automatiche | calcola score, segnala errori bloccanti |
| Assigner | assegna il caso a reviewer | bilancia coda per carico e competenza |
| Reviewer | analizza e decide | approva, rifiuta, richiede integrazioni |
| Approver | autorizza operazioni ad alto impatto | firma digitale/logica della decisione |
| Auditor | verifica conformita e storico | controlla trail e SLA |

## Ruoli di governance (allineamento PDF)

| Ruolo | Focus |
|---|---|
| Superutente | configura policy, ruoli e override di emergenza |
| Amministratore | gestisce utenti, impostazioni globali e approvazioni ad alto impatto |
| Editor | propone modifiche e avvia import |
| Revisore | valida richieste editor |
| Osservatore | accesso sola lettura |

- Permessi applicativi mantenuti in `roles_permissions`.
- Possibile estensione con policy granulari per `family_key`, ramo genealogico o era storica.

## Stati del workflow

- `DRAFT`: proposta in preparazione.
- `SUBMITTED`: proposta inviata.
- `AUTO_VALIDATED`: validazione automatica conclusa.
- `ASSIGNED`: reviewer assegnato.
- `IN_REVIEW`: revisione in corso.
- `CHANGES_REQUESTED`: richieste integrazioni.
- `APPROVED`: approvata per write.
- `REJECTED`: respinta.
- `EXECUTED`: operazione applicata.
- `AUDITED`: caso verificato in audit.
- `CLOSED`: pratica chiusa.

## Flusso operativo

1. Proposta:
- il proposer crea la richiesta (import, correzione, merge, split);
- sistema assegna `corr_id` e metadati minimi (owner, family_key, priorita).

2. Validazione automatica:
- esecuzione policy engine (schema, completezza, coerenza base);
- se errore bloccante: stato `REJECTED` con motivazione;
- se warning: stato `AUTO_VALIDATED` e passaggio a revisione.

3. Assegnazione:
- assigner manuale o regola automatica sceglie reviewer;
- applicazione SLA in base a priorita e impatto.

4. Revisione:
- reviewer esamina conflitti, log e proposte;
- puo richiedere modifiche (`CHANGES_REQUESTED`) o approvare.

5. Approvazione finale:
- per operazioni ad alto impatto serve `Approver`;
- all'approvazione, il sistema abilita write in S6.

6. Esecuzione e audit:
- write applicato;
- avvio batch S7 post-write;
- registrazione esito in audit trail e `IMPORT_LOG`.

## Integrazione puntuale con pipeline GEDCOM

1. S1-S3 (tokenizer, mapper, norm):
- generano materiale candidato ma non definitivo.

2. S4-S5 (conflict detect + UI):
- creano casi autorizzativi (`corr_id`);
- alimentano coda di review.
- generano richieste dedicate per ciascun conflitto GEDCOM.

3. S6 (db-writer):
- eseguito solo per casi `APPROVED`.

4. S7 (batch):
- avvio solo quando S6 ha completato con successo.
- IC/NORM2/CORR possono emettere verifiche aggiuntive e notifiche.

## Tracciabilita e audit

- Ogni transizione di stato produce un evento con:
  - `corr_id`;
  - stato da/a;
  - actor (utente o servizio);
  - timestamp UTC;
  - reason code.
- Catena decisionale sempre ricostruibile.
- Log append-only con retention e export per verifica esterna.
- Firma digitale opzionale per decisioni ad alto impatto.

## Credenziali e sicurezza

- MFA per reviewer/approver/admin.
- Identity provider consigliato: OAuth 2.0 / OpenID Connect.
- Alternativa compatta: autenticazione interna con password hashate + session management.
- Integrazione SSO aziendale opzionale.
- Credenziali tecniche distinte per servizio.
- Rotazione chiavi e segreti con scadenze definite.
- Revoca immediata accessi compromessi.
- Session hardening: timeout inattivita, invalidazione su cambio ruolo.

## Notifiche operative

- Eventi notificati:
  - nuova assegnazione;
  - prossima scadenza SLA;
  - richiesta integrazione;
  - approvazione/rifiuto;
  - errore bloccante in esecuzione.
- Canali suggeriti:
  - inbox applicativa;
  - email transazionale;
  - webhook per sistemi esterni.
- Escalation automatica a revisori alternativi o admin se supera soglia di inattivita.

## KPI consigliati

- Tempo medio da `SUBMITTED` a `APPROVED`.
- Percentuale richieste respinte per errore automatico.
- Tasso riapertura casi dopo approvazione.
- Backlog oltre SLA.
- Numero conflitti per `family_key`.

## Fasi di adozione

1. Baseline:
- stati base + audit trail + ruoli minimi.

2. Controllo avanzato:
- policy engine esteso;
- assegnazione automatica e SLA.

3. Maturita:
- dashboard governance;
- audit periodico;
- tuning regole su evidenza reale.

## Punti da validare

- Soglia che distingue caso standard da caso ad alto impatto.
- Numero minimo di approvatori per operazioni irreversibili.
- Policy di delega in ferie/assenza.
- Formato standard dei `reason code` per audit cross-team.
