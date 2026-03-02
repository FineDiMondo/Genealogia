PYTHON ?= python

.PHONY: compile-copy validate build ingest all

compile-copy:
	$(PYTHON) GIARDINA/03_PROG/batch.py compile-copy

validate:
	$(PYTHON) GIARDINA/03_PROG/batch.py validate

build:
	$(PYTHON) GIARDINA/03_PROG/batch.py build

ingest:
	$(PYTHON) GIARDINA/03_PROG/batch.py ingest --record-id "$(RECORD_ID)"

all:
	$(PYTHON) GIARDINA/03_PROG/batch.py all
