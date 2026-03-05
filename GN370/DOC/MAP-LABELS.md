# GN370 MFS Map Labels and Symbols

This document specifies the official definition of logical labels and symbols used in GN370 MFS maps.

## 1. World Labels

World labels represent logical concepts within the GN370 user interface. They are designed to be configurable and can be overridden at runtime.

### 1.1. Token Definitions

| Token     | Default Value | Max Length |
|-----------|---------------|------------|
| `WORLD-1` | "ORIGINI"     | 16         |
| `WORLD-2` | "CICLI"       | 16         |
| `WORLD-3` | "DONI"        | 16         |
| `WORLD-4` | "CONTESTO"    | 16         |
| `WORLD-5` | "OMBRE"       | 16         |
| `WORLD-6` | "STRUTTURA"   | 16         |
| `WORLD-7` | "EREDITÀ"     | 16         |
| `WORLD-8` | "NEBBIA"      | 16         |
| `WORLD-9` | "RADICI"      | 16         |

### 1.2. Implementation

- **COBOL Copybook:** Label definitions are available to COBOL programs via the `COPY/GNLABEL.cpy` copybook.
- **MFS Map:** The labels are displayed on the main map (`GN1MAPS`) as 16-character, protected, output-only fields (`W1LBL` to `W9LBL`).
- **Initialization:** A COBOL program is responsible for loading the default values or overriding them from a configuration source.

### 1.3. Label Overrides

The default label values can be overridden via a configuration dataset or an internal table to allow for localization or thematic changes.

**Example Overrides:**

| Token     | Example 1   | Example 2    | Example 3    |
|-----------|-------------|--------------|--------------|
| `WORLD-1` | "ÁSGARÐR"   | "KETER"      | "BRAHMALOKA" |
| `WORLD-4` | "MIÐGARÐR"  | "MUNDUS"     |              |
| `WORLD-5` | "SHADOW"    |              |              |
| `WORLD-7` | "LEGACY"    |              |              |
| `WORLD-8` | "VOID"      |              |              |
| `WORLD-9` | "#ROOT#"    |              |              |

The system will always fall back to the default value if no override is present.

## 2. System Symbols

System symbols are single-character logical markers used throughout MFS maps to provide visual cues. They are defined as constants in COBOL.

### 2.1. Symbol Definitions

| Symbol        | Default Value | Meaning                                 |
|---------------|---------------|-----------------------------------------|
| `SYMBOL SELF` | `@`           | Represents the current user or node.    |
| `SYMBOL ROOT` | `#`           | Represents the genealogical root segment. |
| `SYMBOL GAP`  | `~`           | Indicates missing genealogical data.    |
| `SYMBOL LINK` | `─`           | Represents a genealogical relationship. |
| `SYMBOL ACTIVE`| `>`           | Indicates the currently selected node.  |

### 2.2. Implementation

- **COBOL Copybook:** Symbol constants are available to COBOL programs via the `COPY/GNSYMB.cpy` copybook.
- **Values:** Symbols are defined with a `PIC X` and a `VALUE` clause (e.g., `SYM-SELF PIC X VALUE "@"`).
