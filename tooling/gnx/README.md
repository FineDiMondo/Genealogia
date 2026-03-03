# GNX pseudo-compiler CLI

`gnx` is a small C99 cross-platform CLI that implements the first executable slice of the migration plan.

## Build

```bash
make -C tooling/gnx
```

Binary output:

- `build/gnx/gnx`

## Commands

```bash
./build/gnx/gnx init
./build/gnx/gnx parse specs/individui.gnx
./build/gnx/gnx transpile specs/individui.gnx --out cobol/gen
./build/gnx/gnx build
./build/gnx/gnx run-smoke
./build/gnx/gnx package
```

## DSL quick syntax

- `record <PROGRAM-ID>`
- `field <FIELD-NAME> <PIC-CLAUSE>`

Example in `specs/individui.gnx`.
