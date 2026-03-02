# GnuCOBOL Toolchain (Repo-local)

Questa cartella contiene le risorse per installare/ripristinare il compilatore COBOL
su Windows in modo ripetibile.

## Contenuto

- `install-gnucobol.ps1`: installazione automatica (MSYS2 + GnuCOBOL)
- `verify-gnucobol.ps1`: verifica toolchain e compilazione test
- `packages.txt`: pacchetti MSYS2 richiesti
- `resources/`: cache installer e file di supporto

## Installazione

Da root repo:

```powershell
.\tools\gnucobol\install-gnucobol.ps1
```

## Verifica

```powershell
.\tools\gnucobol\verify-gnucobol.ps1
```

## Build COBOL del progetto

```powershell
.\cobol\build.ps1
.\cobol\test.ps1
```
