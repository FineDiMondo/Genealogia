PYTHON ?= python

.PHONY: compile-copy validate build ingest all lint format test

compile-copy:
	$(PYTHON) GIARDINA/03_PROG/batch.py compile-copy

validate:
	$(PYTHON) GIARDINA/03_PROG/batch.py validate

build:
	$(PYTHON) GIARDINA/03_PROG/batch.py build

ingest:
	@echo "Use: make ingest RECORD_ID=YYYY-MM-DD__tipo__soggetti__luogo__slug [WITH_HASH=1]"
	$(PYTHON) GIARDINA/03_PROG/batch.py ingest --record-id "$(RECORD_ID)" $(if $(WITH_HASH),--with-hash,)

all:
	$(PYTHON) GIARDINA/03_PROG/batch.py all

lint:
	$(PYTHON) -m ruff check GIARDINA/03_PROG GIARDINA/06_TEST

format:
	$(PYTHON) -m black GIARDINA/03_PROG GIARDINA/06_TEST

test:
	$(PYTHON) -m unittest discover -s GIARDINA/06_TEST/unit -p "test_*.py"
