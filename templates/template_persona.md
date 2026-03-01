# Template Scheda Persona

Utilizza questo template per documentare in modo sistematico ogni persona aggiunta al progetto genealogico. Compila tutti i campi disponibili e conserva questo file nel folder archivio dopo l'inserimento in database.

---

## 📋 Informazioni Personali

| Campo | Valore |
|-------|--------|
| **Nome Completo** | |
| **Cognome** | |
| **Nome/i proprio/i** | |
| **Sesso** | ☐ Maschio ☐ Femmina ☐ Sconosciuto |
| **ID_Persona (auto-generato)** | PER-AAAA-NNNN |

## 👶 Nascita

| Campo | Valore |
|-------|--------|
| **Data Nascita** | __ / __ / ____ (GG/MM/AAAA) |
| **Luogo Nascita (Comune)** | |
| **Provincia** | |
| **Note sulla Nascita** | |
| **Fonte Primaria** | |

## 💒 Matrimonio

| Campo | Valore |
|-------|--------|
| **Data Matrimonio** | __ / __ / ____ (GG/MM/AAAA) |
| **Luogo Matrimonio** | |
| **Nome Coniuge** | |
| **Tipo di Rito** | ☐ Cattolico ☐ Civile ☐ Misto ☐ Altro |
| **Testimoni** | 1. ___________ 2. ___________ |
| **Fonte Primaria** | |

## ☠️ Morte

- **Deceduto:** ☐ Si ☐ No ☐ Sconosciuto

Se deceduto:

| Campo | Valore |
|-------|--------|
| **Data Morte** | __ / __ / ____ (GG/MM/AAAA) |
| **Luogo Morte** | |
| **Provincia** | |
| **Causa Morte (se nota)** | |
| **Fonte Primaria** | |

## 👨‍💼 Professione e Occupazione

| Campo | Valore |
|-------|--------|
| **Professione Principale** | |
| **Periodo di Attività** | Da ____ a ____ |
| **Note Professionali** | |

## 🏠 Residenze Principali

| Periodo | Da | A | Comune | Provincia | Indirizzo | Nota |
|---------|----|----|--------|-----------|-----------|------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

## 👨‍👩‍👧‍👦 Relazioni Familiari

### Genitori

| Ruolo | Nome | Cognome | ID_Persona | Fonte Primaria |
|-------|------|---------|-----------|-----------------|
| Padre | | | | |
| Madre | | | | |

### Coniuge

| Nome | Cognome | ID_Persona | Data Matrimonio | Fonte Primaria |
|------|---------|-----------|-----------------|-----------------|
| | | | | |

### Figli

| # | Nome | Cognome | Data Nascita | ID_Persona | Fonte Primaria |
|---|------|---------|--------------|-----------|-----------------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

### Fratelli/Sorelle

| Nome | Cognome | Data Nascita | Sesso | ID_Persona | Fonte Primaria |
|------|---------|--------------|-------|-----------|-----------------|
| | | | | | |

## 📚 Fonti Consultate

### Fonte Primaria 1
- **Tipo Documento:** ☐ Certificato ☐ Registro ☐ Documento Notarile ☐ Altro: ______
- **Ente Emittente:**
- **Data Consultazione:** __ / __ / ____
- **ID Fonte:** FONTE-____
- **Dettagli:**
- **Scansione/Copia:** ☐ Archiviata in `/sources/`

### Fonte Primaria 2
- **Tipo Documento:** ☐ Certificato ☐ Registro ☐ Documento Notarile ☐ Altro: ______
- **Ente Emittente:**
- **Data Consultazione:** __ / __ / ____
- **ID Fonte:** FONTE-____
- **Dettagli:**
- **Scansione/Copia:** ☐ Archiviata in `/sources/`

### Testimonianza Orale (se applicabile)
- **Persona Intervistata:**
- **Relazione con il Soggetto:**
- **Data Intervista:** __ / __ / ____
- **Grado di Affidabilità:** ☐ Alta ☐ Media ☐ Bassa
- **Contenuto Principale:**

## 🔍 Note Importanti

### Lacune Informative
- Data di nascita incompleta? ☐ Si ☐ No - Dettagli: _______
- Data di morte incerta? ☐ Si ☐ No - Dettagli: _______
- Parentela da verificare? ☐ Si ☐ No - Dettagli: _______

### Informazioni Speciali
- Cognome cambiato durante la vita? ☐ Si ☐ No - Dettagli: _______
- Noto con nomignoli? ☐ Si ☐ No - Nomignolo: _______
- Titoli nobiliari? ☐ Si ☐ No - Titolo: _______
- Note sulla vita personale:

### Coerenza Dati
- Coerenza cronologica verificata? ☐ Si ☐ No
- Dati concordano con altre fonti? ☐ Si ☐ No ☐ Discrepanze
- Dettagli discrepanze:

## 📝 Note Generali

```
[Spazio libero per note aggiuntive, osservazioni, ricerche future]




```

## ✅ Controllo Finale

- ☐ Tutte le fonti sono state documentate in FONTI.md
- ☐ ID univoco generato e non duplicato
- ☐ Date in formato coerente (AAAA-MM-DD)
- ☐ Coerenza cronologica verificata
- ☐ Dati pronti per inserimento in CSV
- ☐ Documenti scansionati e archiviati

## 📊 Inserimento nel Database

**Data di Inserimento:** __ / __ / ____

**Campi CSV Compilati:**
```
ID_Persona: PER-AAAA-NNNN
Cognome:
Nome:
Data_Nascita: AAAA-MM-DD
Luogo_Nascita: Comune, Provincia
Data_Morte: AAAA-MM-DD
Luogo_Morte: Comune, Provincia
Sesso: M/F
Professione:
Note:
Data_Inserimento: AAAA-MM-DD
Fonte_Primaria: FONTE-____
```

**Note per Inserimento:**


---

**Compilato da:** ________________________
**Data Compilazione:** __________________
**Verificato da:** _______________________
**Data Verifica:** _______________________

---

*Conservare una copia di questo template nel folder `/archive/` con naming: `Scheda_[COGNOME]_[NOME]_[DATA_NASCITA].md`*
