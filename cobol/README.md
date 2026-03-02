# COBOL CLI - Genealogia

Questa cartella contiene una versione CLI del progetto, implementata in COBOL
(GnuCOBOL), pensata per esecuzione batch da riga di comando.

## Struttura

- `src/GENCLI.cbl`: front controller CLI
- `src/GENCNT00.cbl`: conteggi record su DAT
- `src/GENSRH00.cbl`: ricerca testuale su PERSONE.DAT
- `src/GENRPT00.cbl`: report sintetico
- `copy/CLIARGS.CPY`: area parametri condivisa via `COPY`
- `build.ps1`: compilazione su Windows
- `test.ps1`: smoke test CLI

## Comandi CLI

Eseguibile: `cobol/bin/GENCLI.exe`

- `HELP`
- `COUNT PERSONE`
- `COUNT FAMIGLIE`
- `COUNT EVENTI`
- `FIND Rossi`
- `REPORT`

Interfaccia testuale menu:

- `cobol/bin/GENUI00.exe`
  - menu interattivo in stile terminale (no GUI finestrata)

## Build (Windows PowerShell)

```powershell
.\cobol\build.ps1
```

## Test (Windows PowerShell)

```powershell
.\cobol\test.ps1
```

## Sequenza .bat consigliata

Da `cmd` o PowerShell:

```bat
cobol\bat\00_env_init.bat
cobol\bat\01_verify_toolchain.bat
cobol\bat\02a_check_data.bat
cobol\bat\02_build.bat
cobol\bat\03_test.bat
```

Oppure pipeline unica:

```bat
cobol\bat\90_full_pipeline.bat
```

Menu interattivo:

```bat
cobol\bat\99_menu.bat
```

Esecuzione:

```bat
cobol\bat\04_run_ui.bat
cobol\bat\05_run_cli.bat REPORT
```

## Note

- I file dati letti sono:
  - `data/PERSONE.DAT`
  - `data/FAMIGLIE.DAT`
  - `data/EVENTI.DAT`
- I record commento (`# ...`) vengono ignorati.
