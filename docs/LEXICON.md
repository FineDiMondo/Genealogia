# LEXICON GN370-NEXT v0.1

Versione: 0.1.0
Data: 2026-03-02

## RELIABILITY
| Code | Label IT | Label EN | Definizione |
|---|---|---|---|
| V | Verificato | Verified | Dato confermato da fonte primaria verificabile. |
| D | Derivato | Derived | Dato calcolato da regole deterministiche su dati tracciati. |
| I | Inferito | Inferred | Dato inferito da evidenze indirette non definitive. |
| E | Stimato | Estimated | Dato stimato (intervallo o approssimazione). |
| C | Conflitto | Conflicted | Dato con fonti incompatibili non ancora risolte. |
| IA | Inferito-AI | Inferred-AI | Ipotesi prodotta da modello AI, separata dal flusso verified. |

## AGENT_ID
| Code | Nome |
|---|---|
| PARSE_AGT | Parser Agent |
| NORM_AGT | Normalizer Agent |
| VALID_AGT | Validator Agent |
| STORY_AGT | Storyteller Agent |
| SYNC_AGT | Synchronizer Agent |
| EXPL_AGT | Explainer Agent |
| INFER_AGT | Inference Agent (AI) |

## AGENT_STATUS
| Code | Significato |
|---|---|
| IDLE | Inattivo, nessun job in coda |
| ACTIVE | In esecuzione |
| DEGRADED | Operativo con limitazioni |
| BLOCKED | Bloccato da errore o dipendenza |

## EVENT_TYPE (core)
| Code | Scope | Definizione |
|---|---|---|
| BIRTH | P | Nascita persona |
| DEATH | P | Morte persona |
| MARRIAGE | F | Unione/matrimonio famiglia |
| CENSUS | P | Evento censuario |
| BAPTISM | P | Battesimo |
| BURIAL | P | Sepoltura |
| DIVORCE | F | Scioglimento unione |
| RESIDENCE | P | Residenza documentata |

Scope: `P` persona, `F` famiglia, `B` entrambi.

## UNION_TYPE
| Code |
|---|
| MARRIAGE |
| COHABITATION |
| CONCUBINAGE |
| UNKNOWN |

## FAMILY_MEMBER_ROLE
| Code |
|---|
| PARTNER_A |
| PARTNER_B |
| CHILD |
| ADOPTEE |
| FOSTER |

## SUBJECT_TYPE
| Code | Significato |
|---|---|
| P | Persona |
| F | Famiglia |

## SOURCE_TYPE
| Code |
|---|
| GEDCOM |
| CIVIL_REG |
| CHURCH |
| CENSUS |
| ORAL |
| API_EXTERNAL |

## PANEL_ALG_CODE
| Code |
|---|
| LL(1) PARSER |
| JARO-WINKLER |
| 3NF QUERY |
| SHA256 VERIFY |
| DIFF ENGINE |
| TEMPLATE RENDER |
| DFS CYCLE-CHECK |
| NETWORK-FIRST |

## PANEL_DATA_STATE
| Code |
|---|
| VERIFIED |
| DERIVED |
| INFERRED |
| ESTIMATED |
| CONFLICTED |
| IMPORT |
| LIVE |
| AUDIT |

## CONFLICT_STATUS
| Code |
|---|
| OPEN |
| RESOLVED |
| DEFERRED |

## COMMAND_VERB (grammar v0.1)
| Verb |
|---|
| FIND |
| SHOW |
| COMPARE |
| IMPORT |
| EXPORT |
| STORY |
| EXPLAIN |
| SYNC |
| RESOLVE |
| VALIDATE |
| HISTORY |
| DB |
| HELP |
| HOME |
| GO |
| END |
| REFRESH |

## NOTE DI GOVERNANCE
- Nessun codice nuovo entra in produzione senza voce nel Lexicon.
- Ogni seed DB deve essere coerente con questo documento.
- `IA` (Inferred-AI) e' escluso dalle query default salvo `INCLUDE=AI`.