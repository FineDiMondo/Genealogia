# GEDCOM MAPPING

- INDI -> PERSON
- FAM -> FAMILY + FAMILY_LINK
- SOUR -> SOURCE
- INDI.SOUR -> CITATION
- BIRT/DEAT.DATE -> date + qualifier
- ABT -> qual=A
- FROM x TO y -> qual=N + date_end
- @#DJULIAN@ -> cal=J
