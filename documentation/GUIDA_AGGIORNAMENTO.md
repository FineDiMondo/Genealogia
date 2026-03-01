# Guida all'Aggiornamento del Progetto Genealogico

## 📋 Introduzione

Questo documento fornisce istruzioni passo-passo per aggiungere nuove informazioni al progetto genealogico, mantenendo la coerenza dei dati e seguendo la metodologia scientifica.

## 🚀 Quick Start - Aggiungere una Nuova Persona

### Passaggio 1: Preparare le Informazioni

Raccogli i seguenti dati (usando i template in `/templates/`):
- Nome e cognome completi
- Data di nascita (giorno, mese, anno)
- Luogo di nascita (comune, provincia)
- Data di morte (se applicabile)
- Luogo di morte (se applicabile)
- Sesso (M/F)
- Professione
- Fonte primaria verificata

### Passaggio 2: Generare Identificativo Univoco

Segui il formato: **PER-AAAA-NNNN**

```
Esempio:
- Nome: Giuseppe Giardina
- Data Nascita: 15 maggio 1850
- ID: PER-1850-0001
       ↑     ↑     ↑
      Tipo Anno Numero sequenziale
```

Assicurati che il numero sequenziale non sia già utilizzato!

### Passaggio 3: Aprire il File CSV

```bash
# Opzione 1: Con LibreOffice Calc
libreoffice /path/to/individuals.csv

# Opzione 2: Con editor di testo (VS Code)
code /path/to/individuals.csv

# Opzione 3: Con Excel online/locale
# Apri e configura separatore: Virgola
```

### Passaggio 4: Aggiungere la Riga

Aggiungi una nuova riga al file `data/individuals.csv`:

```csv
PER-1850-0001,GIARDINA,Giuseppe,1850-05-15,Milano MI,1920-03-22,Milano MI,M,Sarto,Testimonianza Luigi Rossi,2026-03-01,FONTE-AS-001
```

Assicurati di:
- ✅ Utilizzo delle virgolette se il testo contiene virgole
- ✅ Data in formato AAAA-MM-DD
- ✅ Cognome in MAIUSCOLI
- ✅ Nome con maiuscolo iniziale
- ✅ Fonte referenziata esiste

### Passaggio 5: Salvare il File

- **In LibreOffice:** File → Salva (mantiene formato CSV)
- **In VS Code:** Ctrl+S
- **In Excel:** Salva come → Formato CSV (MS-DOS) o CSV (delimitato da virgole)

---

## 👨‍👩‍👧 Aggiungere Relazioni Familiari

### Relazione Genitore-Figlio

**File:** `/data/family_tree.csv`

```
REL-1875-0001,PER-1850-0001,PER-1880-0001,GENITORE_FIGLIO,,,,FONTE-AS-001
```

**Campi:**
- `ID_Relazione`: REL-1875-0001 (anno evento, numero sequenziale)
- `ID_Persona1`: Genitore (PER-1850-0001)
- `ID_Persona2`: Figlio (PER-1880-0001)
- `Tipo_Relazione`: GENITORE_FIGLIO (o GENITORE_FIGLIA)
- Data/Luogo: Lasciar vuoti per relazione parentale
- `Fonte_Primaria`: Fonte certificante (es: certificato di nascita)

### Relazione Coniugale

**File:** `/data/family_tree.csv`

```
REL-1875-0001,PER-1850-0001,PER-1855-0002,CONIUGI,1875-06-15,Milano MI,,FONTE-CERT-MATR-001
```

**Campi specifici per matrimonio:**
- `Tipo_Relazione`: CONIUGI
- `Data_Evento`: Data matrimonio (AAAA-MM-DD)
- `Luogo_Evento`: Comune, Provincia
- `Fonte_Primaria`: Certificato matrimoniale

---

## 💒 Aggiungere un Matrimonio

**File:** `/data/marriages.csv`

### Template

```csv
MATR-1875-0001,PER-1850-0001,PER-1855-0002,1875-06-15,Milano MI,Cattolico,Giovanni Rossi;Antonio Bianchi,Testimonianza di Luigi,FONTE-CERT-MATR-001
```

### Campi Dettagliati

| Campo | Valore | Note |
|-------|--------|------|
| ID_Matrimonio | MATR-1875-0001 | Anno matrimonio, numero sequenziale |
| ID_Sposo | PER-1850-0001 | ID del coniuge di sesso M |
| ID_Sposa | PER-1855-0002 | ID del coniuge di sesso F |
| Data_Matrimonio | 1875-06-15 | Formato AAAA-MM-DD obbligatorio |
| Luogo_Matrimonio | Milano MI | Comune, Sigla Provincia |
| Tipo_Rito | Cattolico | Cattolico / Civile / Misto |
| Testimoni | Giovanni Rossi;Antonio Bianchi | Separati da punto e virgola |
| Note | Testimonianza di Luigi | Informazioni aggiuntive |
| Fonte_Primaria | FONTE-CERT-MATR-001 | Certificato matrimoniale |

---

## 🏠 Aggiungere Informazioni di Residenza

**File:** `/data/residences.csv`

### Esempio: Cambio Residenza

```csv
RES-1875-0001,PER-1850-0001,1875-06-15,,Milano,MI,Via Milano 12,Anagrafe,Dopo matrimonio
```

**Istruzioni:**
1. Se la residenza è ancora attuale: lasciare `Data_Fine` vuota
2. Se la persona si è trasferita: compilare `Data_Fine`
3. `Tipo_Documento`: Censimento / Anagrafe / Certificato / Testimonianza

---

## 📝 Utilizzo dei Template

### Template Persona (`/templates/template_persona.md`)

Copia e compila il template per raccogliere le informazioni:

```markdown
# Scheda Persona

**Nome:**
**Cognome:**
**Data Nascita:** (AAAA-MM-DD)
**Luogo Nascita:** (Comune, Provincia)
**Sesso:** (M/F)

## Matrimonio
**Data:**
**Luogo:**
**Coniuge:**

## Morte
**Data:**
**Luogo:**

## Note Generali


## Fonti Consultate
- [ ] Fonte 1:
- [ ] Fonte 2:

## Verifiche Completate
- [ ] Coerenza date
- [ ] Concordanza altre fonti
- [ ] Dati inseriti nel CSV
```

### Template Evento (`/templates/template_evento.md`)

Per documentare matrimoni, battesimi, eventi significativi:

```markdown
# Evento Genealogico

**Tipo Evento:** (Matrimonio/Battesimo/Sepoltura/Altro)
**Data:** (AAAA-MM-DD)
**Luogo:** (Comune, Provincia)

## Persone Coinvolte
- [ ] Persona 1:
- [ ] Persona 2:

## Documenti
**Fonte Primaria:**
**Data Consultazione:**
**Note sulla Fonte:**

## Trascrizione
[Copia integrale del documento]

## Elaborazione
- [ ] Dati inseriti in family_tree.csv
- [ ] Dati inseriti in marriages.csv (se matrimonio)
- [ ] Fonte documentata in FONTI.md
```

---

## 🔍 Checklist di Verifica

Prima di salvare i dati, verifica:

### Verifica Dati Persona
- ✅ ID univoco (non esiste già)
- ✅ Cognome in MAIUSCOLI
- ✅ Nome con maiuscolo iniziale
- ✅ Date in formato AAAA-MM-DD
- ✅ Luogo nel formato "Comune, Sigla Provincia"
- ✅ Sesso: M o F
- ✅ Fonte primaria referenziata esiste in FONTI.md

### Verifica Relazioni
- ✅ Entrambi gli ID persone esistono in individuals.csv
- ✅ Tipo relazione è valido (vedi lista in STRUTTURA_DATI.md)
- ✅ Date coerenti (matrimonio dopo 18° compleanno, figli dopo matrimonio)
- ✅ Fonte documentata

### Verifica Matrimoni
- ✅ Sposo e sposa hanno sesso coerente
- ✅ Data matrimonio >= 18 anni dopo nascita di entrambi
- ✅ La relazione CONIUGI esiste in family_tree.csv
- ✅ Testimoni (se noti) registrati

---

## 📊 Aggiornamento Statistiche

Dopo aggiungere nuovi dati, aggiorna il file di riepilogo statistiche:

**File:** `/documentation/STATISTICHE.md` (da creare)

```markdown
# Statistiche Dataset

**Aggiornato:** 2026-03-15

## Totali
- Persone registrate: 127
- Matrimoni documentati: 45
- Generazioni coperte: 10
- Periodo: 1750-2026

## Per Famiglia
- Giardina: 78 persone
- Negrini: 49 persone

## Copertura Temporale
- Secolo XVIII: 5%
- Secolo XIX: 45%
- Secolo XX: 95%
- Secolo XXI: 85%
```

---

## 🔗 Versionamento Git

Dopo ogni aggiornamento significativo, esegui:

### Passo 1: Verificare Modifiche
```bash
cd /path/to/Genealogia
git status
```

### Passo 2: Aggiungere File
```bash
git add data/individuals.csv
git add data/family_tree.csv
# Oppure aggiungi tutto:
git add -A
```

### Passo 3: Creare Commit

```bash
git commit -m "Aggiunti: Giovanni Giardina (PER-1880-0001) e matrimonio con Maria Rossi"
```

**Formato messaggio commit:**
```
Tipo: Breve descrizione

Dettagli (opzionale):
- Persona/e aggiunte: Nome Cognome
- Relazioni aggiunte: Tipo
- Fonti verificate: ID Fonte
```

### Passo 4: Push a GitHub
```bash
git push origin main
```

---

## 🚨 Gestione Errori Comuni

### Errore 1: ID Persona Duplicato

**Problema:** `PER-1875-0001` esiste già

**Soluzione:**
```
1. Controllare /data/individuals.csv
2. Cercare l'ultimo ID anno 1875
3. Se PER-1875-0005 è l'ultimo, usare PER-1875-0006
```

### Errore 2: Data Incoerente

**Problema:** Persona coniugata a 12 anni (inverosimile)

**Soluzione:**
1. Ricontrollare la fonte primaria
2. Se data è corretta, aggiungere nota esplicativa
3. Segnalare per ricerca ulteriore

### Errore 3: File CSV Corrotto

**Problema:** Excel non apre il file

**Soluzione:**
```bash
# Verificare codifica
file -i individuals.csv

# Convertire se necessario
iconv -f ISO-8859-1 -t UTF-8 individuals.csv > individuals_utf8.csv

# O riprovare con editor di testo
```

### Errore 4: Fonte Primaria Non Trovata

**Problema:** La fonte referenziata non esiste in FONTI.md

**Soluzione:**
1. Aggiungere prima la fonte a `documentation/FONTI.md`
2. Assegnare ID univoco (FONTE-TIPO-NNNN)
3. Poi referenziare nella persona

---

## 📱 Flusso di Lavoro Consigliato

```
1. RACCOLTA INFORMAZIONI
   └→ Intervistare familiari
   └→ Consultare archivi
   └→ Scansionare documenti

2. DOCUMENTAZIONE
   └→ Compilare template_persona.md
   └→ Aggiungere fonte a FONTI.md
   └→ Scansionare/salvare documento sorgente

3. INSERIMENTO DATI
   └→ Aggiungere persona a individuals.csv
   └→ Aggiungere relazioni a family_tree.csv
   └→ Aggiungere matrimonio (se applicabile)
   └→ Aggiungere residenze (se noto)

4. VERIFICA
   └→ Verificare coerenza date
   └→ Controllare riferimenti fonte
   └→ Validare con Python script

5. VERSIONAMENTO
   └→ Commit in Git
   └→ Push a GitHub
   └→ Aggiornare STATISTICHE.md

6. COMUNICAZIONE
   └→ Informare altri curatori
   └→ Richiedere feedback
   └→ Documentare scoperte interessanti
```

---

## 📚 Risorse Utili

- **METODOLOGIA.md** - Metodo scientifico di ricerca
- **FONTI.md** - Elenco completo delle fonti
- **STRUTTURA_DATI.md** - Specifiche tecniche database
- **Template/** - Template pronti all'uso

---

## 🆘 Supporto e Domande

Se hai dubbi:

1. Consultare documentazione pertinente (vedi Risorse)
2. Controllare esempi in file CSV esistenti
3. Contattare curatore progetto: daniel.giardina@gmail.com
4. Aprire Issue in GitHub repository (se configurato)

---

**Ultimo aggiornamento:** 2026-03-01
**Curatore:** Daniel Giardina
**Versione:** 1.0
