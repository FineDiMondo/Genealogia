# GN370 Test Minimi Obbligatori

## 1) DDNAME Gating (ABEND12)
Obiettivo: provare che il COBOL non puo accedere a DD non autorizzate.

- Setup:
  - PSB con DD autorizzate: `PERSON`, `FAMILY`.
  - Step/region con DD allocate: `PERSON`, `FAMILY`, `SECRET`.
- Azione:
  - Il programma prova `OPEN SECRET` o `READ SECRET`.
- Atteso:
  - ABEND `ABEND12-DDNAUTH`.
  - RC classificato `SEVERE`.
  - evento in journal e spool con ddname incriminata.

## 2) DISP e lock logici (`SHR|OLD|NEW`)
Obiettivo: garantire semantica allocation coerente.

- Setup:
  - Sessione A apre DD `PERSON` con `OLD`.
  - Sessione B tenta `OLD` su stessa DD.
- Atteso:
  - conflitto lock => ABEND `ABEND16-DDALLOC` per sessione B.

- Setup 2:
  - Sessione A apre `SHR`; sessione B apre `SHR`.
- Atteso:
  - apertura consentita in lettura condivisa secondo policy.

- Setup 3:
  - DD con `NEW` gia esistente.
- Atteso:
  - ricreazione/inizializzazione secondo policy dichiarata e tracciata.

## 3) Batch step chaining (PASS concettuale)
Obiettivo: output step N usato da step N+1 senza perdita semantica.

- Setup:
  - Job con 2 step.
  - Step1 scrive su DD work `GEDTOK`.
  - Step2 legge `GEDTOK` con `DISP=PASS` concettuale.
- Atteso:
  - Step2 vede i record prodotti da Step1.
  - RC job = max(RC step1, RC step2).
  - stop on severe rispettato.

## 4) Online PF/ENTER message-driven
Obiettivo: pipeline terminale stabile 24x80.

- Setup:
  - REGION attiva, programma online attachato.
  - input: `ENTER`, poi `PF3`.
- Atteso:
  - ogni input genera un message dispatchato.
  - output map 24x80 coerente e deterministica.
  - stato sessione aggiornato (cursor/pf/stack pannelli).

## 5) Flush/export deterministico
Obiettivo: stessa run produce stesso export.

- Setup:
  - stessi dataset iniziali + stesso input utente.
  - esecuzione ripetuta due volte.
- Atteso:
  - hash identico di dataset export e spool/journal.
  - ordine eventi journal invariato.

## 6) Criteri di accettazione globali
- Determinismo: pass/fail su confronto hash output.
- Isolamento: nessun side effect cross-region non tracciato.
- Tracciabilita: ogni errore severo produce entry spool + journal.
- Fedelta IMS/JCL-like: gating DD e lifecycle rispettati.
