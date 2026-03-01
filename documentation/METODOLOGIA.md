# Metodologia di Ricerca Genealogica

## 📌 Introduzione

Questo documento descrive il metodo scientifico e sistematico utilizzato per la ricerca genealogica della famiglia Giardina Negrini. La metodologia garantisce l'accuratezza, la verificabilità e la tracciabilità di ogni dato inserito nel database genealogico.

## 🎯 Principi Fondamentali

### 1. Verifica delle Fonti Primarie
Ogni persona, data e fatto genealogico deve essere supportato da almeno una fonte primaria verificata:
- Certificati di stato civile ufficiali
- Registri parrocchiali autentici
- Documenti notarili
- Registri di censimento
- Testimonianze scritte documentate

### 2. Tracciabilità Completa
Ogni informazione contiene:
- Identificativo univoco della persona
- Data e luogo dell'evento
- Fonte primaria consultata
- Data della consultazione
- Note e osservazioni

### 3. Concordanza Cronologica
Le date relative a una stessa persona devono risultare coerenti:
- Matrimonio dopo il 18° compleanno
- Figli nati dopo il matrimonio dei genitori
- Morte dopo la nascita

### 4. Validazione Incrociata
I dati sono sottoposti a validazione con:
- Altre fonti contemporanee
- Testimonianze familiari
- Registri correlati
- Logica genealogica

## 📋 Processo di Ricerca

### Fase 1: Raccolta Iniziale
1. Intervistare familiari diretti per raccogliere informazioni orali
2. Documentare nomi, date, luoghi di nascita/matrimonio/morte
3. Identificare lacune informative
4. Stabilire priorità di ricerca

### Fase 2: Ricerca Primaria
1. Consultare archivi parrocchiali per registri battesimali/matrimoniali
2. Consultare registri civili (nascite, matrimoni, morti)
3. Ottenere certificati originali quando necessario
4. Fotografare/scannerizzare documenti
5. Trascrivere dati con attenzione ai dettagli

### Fase 3: Validazione
1. Verificare coerenza cronologica
2. Confrontare dati da fonti diverse
3. Registrare discrepanze
4. Consultare ulteriori fonti se necessario
5. Documentare conclusioni

### Fase 4: Organizzazione e Archiviazione
1. Inserire dati in format standardizzato (CSV)
2. Collegare fonti di supporto
3. Applicare metadati appropriati
4. Creare backups
5. Registrare nel sistema di versionamento

## 🗂️ Gestione delle Fonti

### Identificazione delle Fonti
Ogni fonte deve avere:
- **ID univoco**: FONTE-AAAA-NNN (es. FONTE-1850-001)
- **Tipo**: Archivio / Certificato / Registro / Altro
- **Istituzione**: Nome dell'archivio o ente
- **Data di consultazione**: AAAA-MM-DD
- **Luogo**: Città/Provincia
- **Note**: Descrizione dettagliata

### Archiviazione dei Documenti
- Scansioni digitali in formato PDF
- Organizzate per periodo storico e tipo
- Nomi descrittivi (es. "Matrimonio_Giuseppe_Rosa_1890-03-15.pdf")
- Backup multipli

## 📊 Struttura dei Dati Genealogici

### Campi Standard per Persona
```
ID_Persona | Nome | Cognome | Data_Nascita | Luogo_Nascita |
Data_Matrimonio | Coniuge | Data_Morte | Luogo_Morte |
Professione | Note | Data_Inserimento | Fonte_Primaria
```

### Relazioni Familiari
- Genitore-Figlio: Validare tramite date coerenti
- Coniugi: Registrare data e luogo matrimonio
- Fratelli: Documentare genitori comuni

## ✅ Criteri di Accettazione dei Dati

Un dato viene accettato nel database solo se:
1. ☑ Supportato da almeno una fonte primaria
2. ☑ Non contraddice altri dati verificati
3. ☑ Cronologicamente plausibile
4. ☑ Completamente tracciato alla sua fonte
5. ☑ Inserito nel formato standardizzato

## ⚠️ Gestione dell'Incertezza

### Dati Incerti
Quando l'informazione è incerta:
- Utilizzo di "?" nel campo specifico
- Creazione di nota descrittiva nel campo "Note"
- Registrazione di tutte le fonti consultate
- Indicazione di ulteriori ricerche necessarie

Esempio:
```
Nome: Giuseppe
Cognome: Giardina
Data_Nascita: 1850-05-?  // Giorno incerto
Note: "Fonte parrocchiale non disponibile. Stima basata su certificato matrimoniale"
```

### Conflitti tra Fonti
Quando le fonti divergono:
1. Documentare tutte le versioni
2. Indicare la fonte più affidabile (priorità a documenti ufficiali)
3. Registrare nota spiegativa
4. Segnalare per ricerca ulteriore

## 🔐 Privacy e Sensibilità

- Dati personali trattati secondo GDPR dove applicabile
- Non divulgare informazioni mediche sensibili
- Ottenere consenso prima di includere informazioni personali
- Proteggere identità di persone viventi
- Considerare impatto familiare nella condivisione

## 📈 Completezza del Record

Ogni persona dovrebbe avere idealmente:
- Nome e cognome completi
- Data di nascita (giorno, mese, anno)
- Luogo di nascita
- Data e luogo di matrimonio
- Nome coniuge
- Data di morte (se deceduta)
- Luogo di morte
- Professione/Occupazione
- Riferimenti a fonti primarie

## 🔄 Revisione Periodica

- Revisione dei dati incerti: Annualmente
- Validazione incrociata: Quando nuove fonti diventano disponibili
- Aggiornamento della documentazione: Dopo ogni ricerca significativa
- Backup: Mensile

## 📚 Risorse Utilizzate

- Archivio di Stato (varie provincie)
- Curia vescovile per registri parrocchiali
- Anagrafi comunali
- Enti statistici (ISTAT per dati storici)
- Testimonianze familiari documentate

## 🎓 Standard Genealogici di Riferimento

- **FAN Principle** (Family, Associates, Neighbors): Ricerca allargata per contesto
- **Genealogical Proof Standard (GPS)**: Standard per la valutazione probatoria
- **NAGRA Guidelines**: Linee guida per numeri identificativi
- **GEDCOM**: Formato per interscambio dati genealogici

---

**Ultima revisione:** 2026-03-01
**Curatore:** Daniel Giardina
