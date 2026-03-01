# Struttura dei Dati Genealogici

## 📊 Introduzione

Questo documento descrive come i dati genealogici sono organizzati nel progetto, inclusi formati, convenzioni di nomenclatura e specifiche di ogni file.

## 📁 Architettura del Database

I dati sono memorizzati in formato CSV (Comma-Separated Values) per:
- ✅ Compatibilità universale
- ✅ Facilità di importazione in Excel/SQL
- ✅ Versioning facile con Git
- ✅ Leggibilità umana
- ✅ Interoperabilità con strumenti genealogici

## 🗂️ File Dati Principali

### 1. individuals.csv - Informazioni Personali

**Scopo:** Registra tutti gli individui con i loro dati demografici principali.

**Posizione:** `/data/individuals.csv`

**Struttura:**

```csv
ID_Persona,Cognome,Nome,Data_Nascita,Luogo_Nascita,Data_Morte,Luogo_Morte,Sesso,Professione,Note,Data_Inserimento,Fonte_Primaria
```

**Descrizione Campi:**

| Campo | Tipo | Formato | Obbligatorio | Note |
|-------|------|---------|-------------|------|
| ID_Persona | Testo | PER-AAAA-NNNN | Si | Es: PER-1850-0001 |
| Cognome | Testo | Maiuscolo | Si | Cognome principale |
| Nome | Testo | Maiuscolo (primo carattere) | Si | Nome proprio |
| Data_Nascita | Data | AAAA-MM-DD | Si | Se giorno ignoto: AAAA-MM-00 |
| Luogo_Nascita | Testo | Comune, Provincia | Si | Es: "Milano, MI" |
| Data_Morte | Data | AAAA-MM-DD | No | Vuoto se vivo |
| Luogo_Morte | Testo | Comune, Provincia | No | Vuoto se vivo |
| Sesso | Testo | M / F | Si | Essenziale per relazioni |
| Professione | Testo | Descrizione | No | Es: "Contadino", "Sarto" |
| Note | Testo | Descrizione | No | Informazioni aggiuntive |
| Data_Inserimento | Data | AAAA-MM-DD | Si | Data inserimento nel DB |
| Fonte_Primaria | Testo | ID Fonte | Si | Riferimento a FONTI.md |

**Esempio:**
```csv
ID_Persona,Cognome,Nome,Data_Nascita,Luogo_Nascita,Data_Morte,Luogo_Morte,Sesso,Professione,Note,Data_Inserimento,Fonte_Primaria
PER-1850-0001,GIARDINA,Giuseppe,1850-05-15,Milano MI,1920-03-22,Milano MI,M,Sarto,Testimonianza di Luigi,2026-03-01,FONTE-AS-001
PER-1855-0002,NEGRINI,Rosa,1855-08-20,Monza MB,1925-07-10,Milano MI,F,Casalinga,,2026-03-01,FONTE-CERT-001
```

---

### 2. family_tree.csv - Relazioni Familiari

**Scopo:** Registra i legami di parentela (genitore-figlio, coniugi).

**Posizione:** `/data/family_tree.csv`

**Struttura:**

```csv
ID_Relazione,ID_Persona1,ID_Persona2,Tipo_Relazione,Data_Evento,Luogo_Evento,Nota,Fonte_Primaria
```

**Descrizione Campi:**

| Campo | Tipo | Formato | Obbligatorio | Note |
|-------|------|---------|-------------|------|
| ID_Relazione | Testo | REL-AAAA-NNNN | Si | Es: REL-1850-0001 |
| ID_Persona1 | Testo | PER-AAAA-NNNN | Si | Prima persona nella relazione |
| ID_Persona2 | Testo | PER-AAAA-NNNN | Si | Seconda persona nella relazione |
| Tipo_Relazione | Testo | Categoria | Si | Vedere elenco sotto |
| Data_Evento | Data | AAAA-MM-DD | Dipende | Obbligatoria per matrimoni |
| Luogo_Evento | Testo | Comune, Provincia | Dipende | Obbligatorio per matrimoni |
| Nota | Testo | Descrizione | No | Informazioni aggiuntive |
| Fonte_Primaria | Testo | ID Fonte | Si | Riferimento a FONTI.md |

**Tipi di Relazione Validi:**

```
- GENITORE_FIGLIO
- GENITORE_FIGLIA
- CONIUGI
- FRATELLI
- SORELLE
- FRATELLO_SORELLA
- NONNO_NIPOTE
- NONNA_NIPOTE
```

**Esempio:**
```csv
ID_Relazione,ID_Persona1,ID_Persona2,Tipo_Relazione,Data_Evento,Luogo_Evento,Nota,Fonte_Primaria
REL-1850-0001,PER-1850-0001,PER-1855-0002,CONIUGI,1875-06-15,Milano MI,Matrimonio in chiesa,FONTE-CERT-MATR-001
REL-1875-0001,PER-1850-0001,PER-1880-0001,GENITORE_FIGLIO,,,,FONTE-AS-001
```

---

### 3. marriages.csv - Dettagli Matrimoniali

**Scopo:** Registra informazioni specifiche sui matrimoni.

**Posizione:** `/data/marriages.csv`

**Struttura:**

```csv
ID_Matrimonio,ID_Sposo,ID_Sposa,Data_Matrimonio,Luogo_Matrimonio,Tipo_Rito,Testimoni,Note,Fonte_Primaria
```

**Descrizione Campi:**

| Campo | Tipo | Formato | Obbligatorio | Note |
|-------|------|---------|-------------|------|
| ID_Matrimonio | Testo | MATR-AAAA-NNNN | Si | Es: MATR-1875-0001 |
| ID_Sposo | Testo | PER-AAAA-NNNN | Si | Persona di sesso M |
| ID_Sposa | Testo | PER-AAAA-NNNN | Si | Persona di sesso F |
| Data_Matrimonio | Data | AAAA-MM-DD | Si | Data evento |
| Luogo_Matrimonio | Testo | Comune, Provincia | Si | Luogo celebrazione |
| Tipo_Rito | Testo | Categoria | Si | Cattolico / Civile / Altro |
| Testimoni | Testo | Nomi | No | Nomi dei testimoni separati da ; |
| Note | Testo | Descrizione | No | Informazioni aggiuntive |
| Fonte_Primaria | Testo | ID Fonte | Si | Certificato matrimoniale |

**Esempio:**
```csv
ID_Matrimonio,ID_Sposo,ID_Sposa,Data_Matrimonio,Luogo_Matrimonio,Tipo_Rito,Testimoni,Note,Fonte_Primaria
MATR-1875-0001,PER-1850-0001,PER-1855-0002,1875-06-15,Milano MI,Cattolico,Giovanni Rossi;Antonio Bianchi,Matrimonio celebrato in chiesa,FONTE-CERT-MATR-001
```

---

### 4. residences.csv - Luogo di Residenza

**Scopo:** Registra i trasferimenti e i cambi di residenza.

**Posizione:** `/data/residences.csv`

**Struttura:**

```csv
ID_Residenza,ID_Persona,Data_Inizio,Data_Fine,Comune,Provincia,Indirizzo,Tipo_Documento,Nota
```

**Descrizione Campi:**

| Campo | Tipo | Formato | Obbligatorio | Note |
|-------|------|---------|-------------|------|
| ID_Residenza | Testo | RES-AAAA-NNNN | Si | Es: RES-1875-0001 |
| ID_Persona | Testo | PER-AAAA-NNNN | Si | Persona |
| Data_Inizio | Data | AAAA-MM-DD | Si | Inizio residenza |
| Data_Fine | Data | AAAA-MM-DD | No | Fine residenza (vuoto se attuale) |
| Comune | Testo | Nome comune | Si | Es: "Milano" |
| Provincia | Testo | Sigla provincia | Si | Es: "MI" |
| Indirizzo | Testo | Indirizzo completo | No | Via, numero civico |
| Tipo_Documento | Testo | Categoria | Si | Censimento / Anagrafe / Certificato / Testimonianza |
| Nota | Testo | Descrizione | No | Motivo trasferimento, ecc. |

**Esempio:**
```csv
ID_Residenza,ID_Persona,Data_Inizio,Data_Fine,Comune,Provincia,Indirizzo,Tipo_Documento,Nota
RES-1850-0001,PER-1850-0001,1850-05-15,1875-06-15,Milano,MI,Via Roma 5,Certificato Nascita,Residenza natale
RES-1875-0001,PER-1850-0001,1875-06-15,,Milano,MI,Via Milano 12,Anagrafe,Dopo matrimonio
```

---

## 🔑 Convenzioni di Nomenclatura

### Identificatori Univoci

Tutti gli ID seguono il formato: **TIPO-AAAA-NNNN**

```
TIPO = Abbreviazione tipo documento (PER, REL, MATR, RES, etc.)
AAAA = Anno di creazione/evento
NNNN = Numero sequenziale (0001, 0002, etc.)
```

Esempi:
- `PER-1850-0001` = Persona, anno 1850, numero 1
- `MATR-1875-0032` = Matrimonio, anno 1875, numero 32
- `RES-1880-0015` = Residenza, anno 1880, numero 15

### Nomi Persone

- **Cognomi:** MAIUSCOLI (es: GIARDINA, NEGRINI)
- **Nomi:** Maiuscolo primo carattere (es: Giuseppe, Rosa)
- **Nomi composti:** Uniti con trattino (es: Maria-Benedetta)
- **Nomignoli:** In parentesi (es: Giuseppe "Peppino")

### Date

- **Formato:** AAAA-MM-DD (ISO 8601)
- **Giorno sconosciuto:** AAAA-MM-00
- **Mese e giorno sconosciuti:** AAAA-00-00
- **Data approssimativa:** ~AAAA-MM-DD (con tilde)

Esempi:
```
1850-05-15    = 15 maggio 1850 (data completa)
1850-05-00    = Maggio 1850 (giorno ignoto)
1850-00-00    = 1850 (mese e giorno ignoti)
~1850-05-15   = Circa 15 maggio 1850 (approssimativa)
```

### Luoghi

- **Formato:** Comune, Sigla Provincia
- **Esempi:** Milano MI / Roma RM / Napoli NA
- **Per località estere:** Comune, Provincia/Stato, Nazione

### Professioni

Utilizzo terminologia storica coerente:
- Contadino (non "agricoltore")
- Sarto (non "sartore")
- Muratore
- Negoziante
- Cuoco
- Domestica

## 💾 Formati di Salvataggio

### Codifica dei File
- **Encoding:** UTF-8 con BOM
- **Separatore:** Virgola (,)
- **Delimitatore testo:** Virgolette doppie (")
- **Interruzione riga:** CRLF (Windows) o LF (Unix)

### Apertura in Excel
1. File → Apri → Seleziona `individuals.csv`
2. Creazione guidata testo → Separatore: Virgola
3. Formato colonna Data: Personalizzato → AAAA-MM-DD

## 🔗 Integrità Referenziale

### Regole di Coerenza

1. **Coerenza ID Persona:**
   - Se `ID_Persona` appare in `family_tree.csv`, deve esistere in `individuals.csv`
   - Ogni persona deve avere un unico ID

2. **Coerenza Matrimoni:**
   - Data matrimonio non deve essere anterior alla data di nascita di entrambi gli sposi
   - Gli sposi in `marriages.csv` devono essere in relazione CONIUGI in `family_tree.csv`

3. **Coerenza Residenze:**
   - Date: Data_Fine deve essere >= Data_Inizio
   - Se la persona è deceduta, Data_Fine non deve superare Data_Morte

4. **Riferimenti Fonti:**
   - Tutti i Fonte_Primaria devono corrispondere a fonti enumerate in `FONTI.md`

## 📈 Script di Validazione

Python script per verificare l'integrità:

```python
import pandas as pd
import os

# Carica i dati
individuals = pd.read_csv('data/individuals.csv')
family_tree = pd.read_csv('data/family_tree.csv')
marriages = pd.read_csv('data/marriages.csv')
residences = pd.read_csv('data/residences.csv')

# Validazione ID unici
print("Verificando ID univoci...")
assert individuals['ID_Persona'].nunique() == len(individuals), "ID_Persona non unici"

# Validazione riferimenti
print("Verificando integrità referenziale...")
all_ids = set(individuals['ID_Persona'])
family_tree_ids = set(family_tree['ID_Persona1']) | set(family_tree['ID_Persona2'])
assert family_tree_ids.issubset(all_ids), "ID orfani in family_tree"

print("✓ Validazione completata con successo")
```

## 📊 Statistiche del Dataset

Modello di rapporto statistico (da aggiornare regolarmente):

```
Persone registrate:        XXX
Relazioni familiari:       XXX
Matrimoni documentati:     XXX
Residenze tracciate:       XXX

Periodo coperto:           1700-2026
Generazioni:               ~10
Copertura storica:         XX%
```

## 🔄 Backups e Versionamento

### Naming Convention per Versioni
- `individuals_2026-03-01.csv` (backup giornaliero)
- `individuals_2026-Q1.csv` (backup trimestrale)
- `individuals_archive.csv` (backup completo)

### Frequenza Backup
- Giornaliero: Copia manuale in `/archive/`
- Settimanale: Commit in Git
- Mensile: Backup esterno su cloud storage

## 🛠️ Strumenti Consigliati per Gestione Dati

- **LibreOffice Calc:** Apertura/modifica file CSV
- **VS Code:** Editing testo con validazione
- **Google Sheets:** Collaborazione online
- **SQL:** Per query complesse su sottoset dati
- **GEDCOM Export:** Per interoperabilità con software genealogico

---

**Ultimo aggiornamento:** 2026-03-01
**Curatore:** Daniel Giardina
**Versione Schema:** 1.0
