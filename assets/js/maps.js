(function (global) {
  "use strict";

  var GN370 = global.GN370 = global.GN370 || {};
  var MAPS_FILE = "assets/maps/gn370_mappe_ascii.txt";
  var legacyCache = null;

  var LEGACY_MAP_NAMES = {
    "1": "ALBERO GENEALOGICO",
    "2": "RETE DELLE FAMIGLIE",
    "3": "CRONOLOGIA DEGLI EVENTI",
    "4": "MAPPA DEI LUOGHI",
    "5": "GERARCHIA DEI TITOLI",
    "6": "DISTRIBUZIONE DELLE PROPRIETA",
    "7": "ANALISI DELLE RELAZIONI",
    "8": "SUGGERIMENTI IA",
    "9": "9 MONDI - YGGDRASIL"
  };

  var WORLD_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  var WORLDS = {
    "1": {
      label: "ORIGINI",
      slug: "origini",
      home: "Titoli·Linea",
      summary: "Linea regia · Titoli · Destino",
      journey: "chi sei per diritto di sangue",
      steps: [
        ["ENTRA", "Accedi al Mondo ORIGINI", "Scegli [WORLD:1] o [PF:1]"],
        ["SURVEY", "Panoramica casati documentati", "[WORLD:1] mostra 4 casati attivi"],
        ["SELECT", "Seleziona casato {NODE:GIARDINA}", "Click / CMD 'casato giardina'"],
        ["EXPAND", "Espandi albero titoli ^TITLE^", "Visualizza gerarchia nobiliare"],
        ["FOCUS", "Focalizzi su Principi di Ficarazzi", "XVII sec · fonte PROTONOTARO"],
        ["TRACE", "Traccia discendenza da #ROOT# Pietro 1500", "|PATH| generazioni I→XIV"],
        ["ARRIVE", "Arrivi a @SELF@ nodo utente", "Connessione confermata"],
        ["REFLECT", "Sistema mostra CHI SEI PER SANGUE", ".gn-insight panel aperto"],
        ["EXPORT", "Esporta linea regia", "PDF / JSON / GEDCOM"]
      ]
    },
    "2": {
      label: "CICLI",
      slug: "cicli",
      home: "Nascite·Morti",
      summary: "Demografia · Nascite · Morti · Matrimoni",
      journey: "i ritmi biologici del tuo lignaggio",
      steps: [
        ["ENTRA", "Accedi al Mondo CICLI", "Scegli [WORLD:2] o [PF:2]"],
        ["OVERVIEW", "Visualizza timeline demografica", "=ERA= Normanno→Risorgimento"],
        ["FILTER", "Filtra per tipo evento *MARK*", "B=nascita M=matrimonio D=morte"],
        ["PATTERN", "Sistema evidenzia pattern ciclici", "?HINT? cluster nascite 1650-1720"],
        ["INSPECT", "Ispeziona {NODE:MATR-1775}", "Girolamo × Concetta"],
        ["EXPAND", "Espandi ramificazioni post-1775", "Carlo 1776 → ramo principale"],
        ["GAP", "~GAP~ mogli non documentate", "6 matrimoni senza nome moglie"],
        ["SUGGEST", "?HINT? archivi ecclesiastici PA", "AI suggerisce fonti 1650-1810"],
        ["SAVE", "Salva annotazione lacuna", "Agenda ricerca aggiornata"]
      ]
    },
    "3": {
      label: "DONI",
      slug: "doni",
      home: "Arti·Talenti",
      summary: "Arti · Mestieri · Talenti trasmessi",
      journey: "i doni che scorrono nel sangue",
      steps: [
        ["ENTRA", "Accedi al Mondo DONI", "Scegli [WORLD:3] o [PF:3]"],
        ["SCAN", "Scansione professioni nel lignaggio", "Analizza campi title"],
        ["LIST", "Lista mestieri per generazione", "Notaio·Commissario·Nobile"],
        ["CLUSTER", "?HINT? cluster professionale", "Funzioni giuridico-amm. IV→XI"],
        ["FOCUS", "Focus su {NODE:CALOGERO-1850}", "Notaio · atto completo Regno"],
        ["COMPARE", "Confronto generazioni", "Ignazio 1695 vs Calogero 1850"],
        ["INSIGHT", "Pattern: gestione documentale", ".gn-insight attivo"],
        ["MAP", "Mappa dono→utente", "Connessione psicogenealogia"],
        ["REFLECT", "Riflessione personale", "Campo libero annotazione"]
      ]
    },
    "4": {
      label: "OMBRE",
      slug: "ombre",
      home: "Traumi·Esili",
      summary: "Traumi · Conflitti · Esili · Ferite",
      journey: "integrare le ombre per liberarsi",
      steps: [
        ["ENTRA", "Accedi al Mondo OMBRE", "Scegli [WORLD:4] o [PF:4]"],
        ["WARN", "Avviso contenuto sensibile", ".gn-warning panel · [CONTINUA]"],
        ["SCAN", "Scansione eventi traumatici", "esilio·povertà·perdita"],
        ["FIND", "~GAP~ lacuna 1560-1640", "80 anni senza record"],
        ["FIND2", "Evento {NODE:GIUSEPPE-1810}", "testimone moti 1848"],
        ["DEPTH", "Approfondisci contesto storico", "=ERA= Castigliano · Viceregno"],
        ["NAME", "Nomina l'ombra", "rottura della continuita"],
        ["RITUAL", "Gesto di riconoscimento", ".gn-psycho-ritual facoltativo"],
        ["CLOSE", "Chiudi ciclo", ".gn-shadow-closed badge"]
      ]
    },
    "5": {
      label: "CONTESTO",
      slug: "contesto",
      home: "Storia·Ere",
      summary: "Storia · Ere storiche · Mondo umano",
      journey: "dove erano quando il mondo cambiava",
      steps: [
        ["ENTRA", "Accedi al Mondo CONTESTO", "Scegli [WORLD:5] o [PF:5]"],
        ["SELECT", "Seleziona antenato da timeline", "1500→oggi"],
        ["ERA", "Mostra =ERA= appartenenza", "Normanno / Aragonese / ..."],
        ["EVENT", "Sovrapponi evento storico globale", "1492 · 1848"],
        ["CROSS", "Incrocio nodo/evento", "dove si trovava {NODE}?"],
        ["MAP", "Mappa geografica", "Palermo nel 1651"],
        ["SOURCE", "Fonte primaria", "Catasto feudale 1651"],
        ["ANNOTATE", "Annota il contesto", "Campo note aggiornato"],
        ["NEXT", "Prossimo antenato", "[PF:5→next] o [CMD: next]"]
      ]
    },
    "6": {
      label: "STRUTTURA",
      slug: "struttura",
      home: "DNA·Scienza",
      summary: "DNA · Scienza · Firma biologica",
      journey: "la struttura nascosta del sangue",
      steps: [
        ["ENTRA", "Accedi al Mondo STRUTTURA", "Scegli [WORLD:6] o [PF:6]"],
        ["PROFILE", "Profilo DNA disponibile?", ".gn-dna-check SI/NO"],
        ["IF-YES", "Carica haplogroup", "R1b-L21 · subclade R-DF13"],
        ["IF-NO", "?HINT? suggerisci test", "Jardine DNA Project"],
        ["MATCH", "Confronta database", "match markers"],
        ["TRACE", "|PATH| biologico", "R1b → Normandia → PA"],
        ["ORIGIN", "#ROOT# genetico", "Yamnaya ~3000 a.C."],
        ["CONNECT", "Bridge genetica+archivi", "DNA + #ROOT# documentale"],
        ["REPORT", "Genera report genetico", "PDF · .gn-export-dna"]
      ]
    },
    "7": {
      label: "EREDITA",
      slug: "eredita",
      home: "Beni·Patrim.",
      summary: "Patrimonio · Beni · Costruzioni materiali",
      journey: "cosa hanno costruito per te",
      steps: [
        ["ENTRA", "Accedi al Mondo EREDITA", "Scegli [WORLD:7] o [PF:7]"],
        ["MAP", "Mappa $ASSET$ per casato", "$Ficarazzi · $Gela · $S.Caterina"],
        ["SELECT", "Seleziona $ASSET$", "Feudo Ficarazzi XVII sec"],
        ["SOURCE", "Fonte archivistica", "Protonotaro del Regno"],
        ["CHAIN", "|PATH| patrimoniale", "catena trasmissione"],
        ["GAP", "~GAP~ beni parziali", "Rivele 1651"],
        ["CONFLUENCE", "$CONFLUENZA 1775", "tre patrimoni uniti"],
        ["TODAY", "Patrimonio oggi?", "[RICERCA IN CORSO]"],
        ["CLOSE", "Chiudi ciclo eredita", ".gn-legacy-badge"]
      ]
    },
    "8": {
      label: "NEBBIA",
      slug: "nebbia",
      home: "Lacune·Ignoto",
      summary: "Lacune · Misteri · Ciò che non si sa ancora",
      journey: "navigare l'ignoto con metodo",
      steps: [
        ["ENTRA", "Accedi al Mondo NEBBIA", "Scegli [WORLD:8] o [PF:8]"],
        ["SCAN", "Scansiona tutte le ~GAP~", "lista lacune"],
        ["RANK", "Ranking AI", "ALTA·MEDIA·BASSA"],
        ["TOP", "Lacuna priorita #1", "mogli 1650-1810"],
        ["STRATEGY", "Strategia ricerca", "?HINT? registri ecclesiastici"],
        ["ARCHIVE", "Link risorsa", "FamilySearch · Portale Antenati"],
        ["NOTE", "Annota strategia", ".gn-research-note"],
        ["TRACK", "Stato lacuna", "[IN RICERCA]/[CHIUSA]"],
        ["NEXT", "Prossima lacuna", "[PF:8→next]"]
      ]
    },
    "9": {
      label: "RADICI",
      slug: "radici",
      home: "#ROOT# Pietro",
      summary: "Origine primordiale · #ROOT# · *GARD 900 d.C.",
      journey: "scendere fino al fondo del tempo",
      steps: [
        ["ENTRA", "Accedi al Mondo RADICI", "Scegli [WORLD:9] o [PF:9]"],
        ["ANCHOR", "Primo antenato documentato", "Pietro 1500 · Palermo"],
        ["DESCEND", "Scendi oltre il documentato", "?HINT? Normandia ~1000"],
        ["ETYMOLOGY", "Etimologia *GARD", "proto-germanico → GIARDINA"],
        ["DNA", "Radice genetica", "R1b-L21"],
        ["DEEPER", "Scendi ancora", "Yamnaya ~3000 a.C."],
        ["AXIS", "|PATH| verticale", "3000 a.C. → 1000 → 1500 → oggi"],
        ["ARRIVE", "Arrivo a @SELF@", "nodo recente di 5000 anni"],
        ["TRANSFORM", "Insight finale", "Sei parte di una continuita"]
      ]
    }
  };

  var MYTHIC_MARKERS = ["ASGARD", "VANAHEIM", "ALFHEIM", "JOTUNHEIM", "MIDGARD", "SVARTALFA", "NIDAVELLIR", "NIFLHEIM", "YGGDRASIL"];

  function padRight(text, len) {
    var t = String(text || "");
    return t.length >= len ? t : t + Array(len - t.length + 1).join(" ");
  }

  function lines(text) {
    return String(text || "").split(/\r?\n/);
  }

  function joinBlocks(blocks) {
    return blocks.filter(Boolean).join("\n\n");
  }

  function tokenize(raw) {
    if (Array.isArray(raw)) {
      return raw.map(function (x) { return String(x); }).filter(Boolean);
    }
    return String(raw || "").trim().split(/\s+/).filter(Boolean);
  }

  function normalizeLegacyToken(token) {
    var t = String(token || "").trim().toUpperCase().replace(/\s+/g, "");
    if (/^[1-9][ABCD]$/.test(t)) {
      return { mapId: t.charAt(0), variant: t.charAt(1) };
    }
    if (/^[1-9]$/.test(t)) {
      return { mapId: t, variant: "" };
    }
    return null;
  }

  function listLegacyMaps() {
    return Object.keys(LEGACY_MAP_NAMES).map(function (id) {
      return id + ": " + LEGACY_MAP_NAMES[id] + " (varianti A/B/C/D)";
    });
  }

  async function loadLegacyText() {
    if (legacyCache != null) {
      return legacyCache;
    }
    var resp = await fetch(MAPS_FILE, { cache: "no-store" });
    if (!resp.ok) {
      throw new Error("MAPS_FILE_NOT_FOUND");
    }
    legacyCache = await resp.text();
    return legacyCache;
  }

  function sectionRange(text, startMarker, endMarkerPrefix) {
    var start = text.indexOf(startMarker);
    if (start < 0) {
      return "";
    }
    var end = text.length;
    if (endMarkerPrefix) {
      var next = text.indexOf(endMarkerPrefix, start + startMarker.length);
      if (next >= 0) {
        end = next;
      }
    }
    return text.slice(start, end).trim();
  }

  function guardContent(text, opts) {
    var o = opts || {};
    var ls = lines(text);
    var warns = [];
    var maxLines = Number(o.maxLines || 300);
    var maxLen = Number(o.maxLen || 150);
    var long = ls.filter(function (l) { return l.length > maxLen; }).length;
    if (ls.length > maxLines) {
      warns.push("VERBOSE: blocco lungo (" + ls.length + " righe, soglia " + maxLines + ")");
    }
    if (long) {
      warns.push("VERBOSE: " + long + " righe oltre " + maxLen + " caratteri");
    }

    var freq = {};
    ls.forEach(function (l) {
      var t = l.trim().replace(/\s+/g, " ").toLowerCase();
      if (!t || t.length < 8 || /^[-=+#|*:·()[\]{}<>╔╗╚╝╠╣╦╩╬┌┐└┘├┤┬┴┼─│]+$/.test(t)) {
        return;
      }
      freq[t] = (freq[t] || 0) + 1;
    });
    var dup = Object.keys(freq).filter(function (k) { return freq[k] >= 4; });
    if (dup.length) {
      warns.push("DUPLICATO: righe ripetute >=4 (" + dup.length + ")");
    }

    (o.required || []).forEach(function (tok) {
      if (text.indexOf(tok) < 0) {
        warns.push("LINEE_GUIDA: token mancante " + tok);
      }
    });

    if (o.flagMythicHardcode) {
      var found = {};
      ls.forEach(function (l) {
        var up = l.toUpperCase();
        if (/OVERRIDE|CUSTOM|--LABEL-WORLD/.test(up)) {
          return;
        }
        MYTHIC_MARKERS.forEach(function (m) {
          if (new RegExp("\\b" + m + "\\b").test(up)) {
            found[m] = true;
          }
        });
      });
      var f = Object.keys(found);
      if (f.length) {
        warns.push("LINEE_GUIDA: label culturali hardcoded (" + f.join(", ") + ")");
      }
    }

    return warns;
  }
  async function renderLegacy(token) {
    var parsed = normalizeLegacyToken(token);
    if (!parsed) {
      throw new Error("MAP_TOKEN_INVALID");
    }
    var full = await loadLegacyText();
    var mapBlock = sectionRange(full, "### MAPPA " + parsed.mapId, "### MAPPA " + String(Number(parsed.mapId) + 1));
    if (!mapBlock) {
      throw new Error("MAP_NOT_FOUND");
    }
    if (!parsed.variant) {
      return mapBlock.replace(/^### MAPPA [1-9]\s*\n?/i, "").trim();
    }
    var variant = sectionRange(mapBlock, "#### " + parsed.mapId + parsed.variant, null);
    if (!variant) {
      throw new Error("MAP_VARIANT_NOT_FOUND");
    }
    var trimmed = variant.replace(/^#### [1-9][A-D]\s*\n?/i, "").trim();
    var nextMarker = trimmed.search(/^#### [1-9][A-D]/m);
    return nextMarker >= 0 ? trimmed.slice(0, nextMarker).trim() : trimmed;
  }

  function legendBlock() {
    return [
      "╔══════════════════════════════════════════════════════════════════════════════╗",
      "║  GN370 · LEGENDA GLOBALE SIMBOLI & ARCHITETTURA CSS-LABEL                  ║",
      "╚══════════════════════════════════════════════════════════════════════════════╝",
      "[WORLD:n] .gn-world-card   @SELF@ .gn-node.gn-self   #ROOT# .gn-node.gn-root",
      "~GAP~ .gn-gap   ?HINT? .gn-hint   $ASSET$ .gn-asset   (SEQ:n) .gn-seq-step",
      "--label-world-1..9 default: ORIGINI CICLI DONI OMBRE CONTESTO STRUTTURA EREDITA NEBBIA RADICI",
      "--sym-self @  --sym-root #  --sym-gap ~  --sym-link ─  --sym-active >"
    ].join("\n");
  }

  function home80(activeId) {
    var a = activeId || "5";
    return [
      "╔══════════════════════════════════════════════════════════════════════════════╗",
      "║  PROTOTIPO HOME PAGE — ORIZZONTALE 80×24                                   ║",
      "╚══════════════════════════════════════════════════════════════════════════════╝",
      ".gn-world-grid · .gn-world-card · .gn-active",
      "[WORLD:1] " + WORLDS["1"].label + "   [WORLD:2] " + WORLDS["2"].label + "   [WORLD:3] " + WORLDS["3"].label,
      "[WORLD:4] " + WORLDS["4"].label + "   [WORLD:5] " + (a === "5" ? ">" + WORLDS["5"].label + "<" : WORLDS["5"].label) + "   [WORLD:6] " + WORLDS["6"].label,
      "[WORLD:7] " + WORLDS["7"].label + "   [WORLD:8] " + WORLDS["8"].label + "   [WORLD:9] " + WORLDS["9"].label,
      "CMD: GN370$_   @SELF@ oggi   #ROOT# Pietro 1500   PF1..PF9"
    ].join("\n");
  }

  function home120(activeId) {
    var a = activeId || "5";
    return [
      "┌── HOME · WIREFRAME ESTESO 120×40 ───────────────────────────────────────────┐",
      "+──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────+",
      "│ .gn-nav-sidebar | .gn-world-grid | .gn-info-panel                                                                    │",
      "│ PF1 ORIGINI PF2 CICLI PF3 DONI PF4 OMBRE PF5 CONTESTO PF6 STRUTTURA PF7 EREDITA PF8 NEBBIA PF9 RADICI           │",
      "│ .gn-world-card [WORLD:1..9]  attivo: [WORLD:" + a + "]                                                               │",
      "│ classi: .gn-world-card .gn-active .gn-world-grid .gn-statusbar                                                      │",
      "+──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────+"
    ].join("\n");
  }

  function worldSeq(id) {
    var w = WORLDS[id];
    var out = [
      "┌── SEQUENZA TRANSAZIONALE VERTICALE · MONDO " + id + ":" + w.label + " ───────────────────────┐",
      "  .gn-world-sequence.gn-world--" + w.slug,
      "  SEQUENZA: " + w.journey
    ];
    w.steps.forEach(function (s, i) {
      out.push("  (SEQ:" + (i + 1) + ") .gn-seq-step");
      out.push("  │  STEP: " + padRight(s[0], 12) + s[1]);
      out.push("  │  CMD/UX: " + s[2]);
    });
    out.push("  ESITO: .gn-transaction-complete → badge + insight panel + EXPORT");
    out.push("└───────────────────────────────────────────────────────────────────────────────");
    return out.join("\n");
  }

  function world80(id) {
    var w = WORLDS[id], s = w.steps;
    return [
      "┌── MONDO " + id + ":" + w.label + " · VISTA 80×24 (ASCII-370) ───────────────────────────────┐",
      "################################################################################",
      "# MONDO " + id + " " + padRight(w.label, 20) + " [PF:" + id + "] [PF9:TEMA]                          #",
      "# (1)" + padRight(s[0][0], 10) + " (2)" + padRight(s[1][0], 10) + " (3)" + padRight(s[2][0], 10) + "                 #",
      "# (4)" + padRight(s[3][0], 10) + ">(5)" + padRight(s[4][0], 10) + " (6)" + padRight(s[5][0], 10) + "                 #",
      "# (7)" + padRight(s[6][0], 10) + " (8)" + padRight(s[7][0], 10) + " (9)" + padRight(s[8][0], 10) + "                 #",
      "# STEP ATTIVO: " + s[4][0] + " | " + s[4][1],
      "# CMD: GN370$_  @SELF@ gen:XIV  #ROOT#  ~GAP~  ?HINT?  $ASSET$              #",
      "################################################################################"
    ].join("\n");
  }

  function world120(id) {
    var w = WORLDS[id], s = w.steps;
    return [
      "┌── MONDO " + id + ":" + w.label + " · WIREFRAME 120×40 ───────────────────────────────────────┐",
      "+──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────+",
      "│ .gn-seq-sidebar | .gn-seq-canvas | .gn-seq-detail                                                                      │",
      "│ (SEQ:1) " + s[0][0] + " | (SEQ:2) " + s[1][0] + " | (SEQ:3) " + s[2][0] + " | ... | (SEQ:9) " + s[8][0] + "                                 │",
      "│ .gn-progress [■■■□□□□□□] | .gn-transaction-complete | [EXPORT] [INDIETRO]                                            │",
      "│ .gn-statusbar MONDO:" + id + " STEP:1/9 @SELF@ JOB:IDLE                                                                │",
      "+──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────+"
    ].join("\n");
  }

  function worldAll(id, format) {
    if (!WORLDS[id]) {
      throw new Error("PROTO_WORLD_NOT_FOUND");
    }
    var f = String(format || "all").toLowerCase();
    var blocks = [
      "╔══════════════════════════════════════════════════════════════════════════════╗\n║  MONDO " + id + " · " + WORLDS[id].label + "  [gn-world--" + WORLDS[id].slug + "]\n╚══════════════════════════════════════════════════════════════════════════════╝"
    ];
    if (f === "all" || f === "seq") { blocks.push(worldSeq(id)); }
    if (f === "all" || f === "80") { blocks.push(world80(id)); }
    if (f === "all" || f === "120") { blocks.push(world120(id)); }
    if (["all", "seq", "80", "120"].indexOf(f) < 0) {
      throw new Error("PROTO_FORMAT_INVALID");
    }
    return joinBlocks(blocks);
  }

  function navBlock() {
    return [
      "SCHEMA NAVIGAZIONE INTER-MONDI",
      "[PF:1] ORIGINI  <-> [PF:5] CONTESTO",
      "[PF:2] CICLI    <-> [PF:4] OMBRE",
      "[PF:3] DONI     <-> [PF:6] STRUTTURA",
      "[PF:7] EREDITA  <-> [PF:8] NEBBIA",
      "[PF:9] RADICI converge su #ROOT#",
      "RISONANZA: ogni mondo riflette dati degli altri"
    ].join("\n");
  }

  function cssBlock() {
    return [
      "CSS OVERRIDE REFERENCE",
      ".gn-world-card .gn-world-grid .gn-active .gn-seq-step .gn-node .gn-gap .gn-hint .gn-asset .gn-title .gn-era .gn-path",
      ".gn-transaction-complete .gn-progress .gn-statusbar",
      "--label-world-1..9 --sym-self --sym-root --sym-gap --sym-link --sym-active"
    ].join("\n");
  }

  function parseProtoSpec(args) {
    var t = tokenize(args);
    if (!t.length || t[0].toLowerCase() === "help") { return { type: "help" }; }
    var a0 = t[0].toLowerCase();
    if (a0 === "legend") { return { type: "legend" }; }
    if (a0 === "home") { return { type: "home", format: (t[1] || "all").toLowerCase() }; }
    if (a0 === "nav") { return { type: "nav" }; }
    if (a0 === "css") { return { type: "css" }; }
    if (a0 === "all") { return { type: "all" }; }
    if (a0 === "world") { return { type: "world", id: t[1], format: (t[2] || "all").toLowerCase() }; }
    if (a0 === "lint") { return { type: "lint", target: t.slice(1) }; }
    if (/^[1-9]$/.test(a0)) { return { type: "world", id: a0, format: (t[1] || "all").toLowerCase() }; }
    throw new Error("PROTO_CMD_INVALID");
  }

  function renderPrototype(args) {
    var spec = parseProtoSpec(args);
    var text = "";

    if (spec.type === "help") {
      text = prototypeHelp();
    } else if (spec.type === "legend") {
      text = legendBlock();
    } else if (spec.type === "home") {
      if (spec.format === "80") { text = home80("5"); }
      else if (spec.format === "120") { text = home120("5"); }
      else if (spec.format === "all") { text = joinBlocks([home80("5"), home120("5")]); }
      else { throw new Error("PROTO_HOME_FORMAT_INVALID"); }
    } else if (spec.type === "nav") {
      text = navBlock();
    } else if (spec.type === "css") {
      text = cssBlock();
    } else if (spec.type === "world") {
      text = worldAll(String(spec.id || ""), spec.format);
    } else if (spec.type === "all") {
      var blocks = [legendBlock(), home80("5"), home120("5")];
      WORLD_IDS.forEach(function (id) { blocks.push(worldAll(id, "all")); });
      blocks.push(navBlock());
      blocks.push(cssBlock());
      text = joinBlocks(blocks);
    } else if (spec.type === "lint") {
      var lt = spec.target || [];
      if (!lt.length || (lt[0] && lt[0].toLowerCase() === "all")) {
        text = [
          "[LINT] legend: " + (guardContent(legendBlock(), { required: [".gn-world-card"] }).join(" | ") || "OK"),
          "[LINT] home: " + (guardContent(joinBlocks([home80("5"), home120("5")]), { required: [".gn-world-card", "WORLD", "PF"], flagMythicHardcode: true }).join(" | ") || "OK"),
          "[LINT] nav: " + (guardContent(navBlock(), { required: ["#ROOT#"] }).join(" | ") || "OK"),
          "[LINT] css: " + (guardContent(cssBlock(), { required: ["--label-world-1..9"] }).join(" | ") || "OK")
        ].join("\n");
      } else {
        var tt = renderPrototype(lt);
        text = "[LINT] target: " + (tt.warnings.join(" | ") || "OK");
      }
    }

    var req = [];
    var flagMythic = true;
    if (spec.type === "world") {
      req = ["(SEQ:1)", "@SELF@", "#ROOT#", ".gn-seq-step"];
    } else if (spec.type === "home") {
      req = [".gn-world-card", "WORLD", "PF"];
    } else if (spec.type === "legend") {
      req = [".gn-world-card", "@SELF@", "#ROOT#"];
    } else if (spec.type === "nav") {
      req = ["#ROOT#", "[PF:1]"];
    } else if (spec.type === "css") {
      req = [".gn-world-card", "--label-world-1..9"];
    } else if (spec.type === "all") {
      req = [".gn-world-card", "@SELF@", "#ROOT#", "(SEQ:1)"];
    } else if (spec.type === "help" || spec.type === "lint") {
      req = [];
      flagMythic = false;
    }

    return {
      content: text,
      warnings: guardContent(text, {
        required: req,
        flagMythicHardcode: flagMythic
      })
    };
  }

  function legacyHelp() {
    return [
      "MAPPE ASCII GN370",
      "",
      "Comandi legacy:",
      "  maps                     -> elenco mappe legacy",
      "  mappa <n>                -> mostra MAPPA n (A+B+C+D)",
      "  mappa <n><variante>      -> es: mappa 1a, mappa 4d",
      "  map <n><variante>        -> alias rapido",
      "",
      "Prototipo funzionale:",
      "  proto help               -> guida",
      "  proto home [80|120|all]",
      "  proto world <1..9> [seq|80|120|all]",
      "  proto legend|nav|css|all",
      "  proto lint [all|home|world 1]",
      "",
      "Disponibili legacy:",
      listLegacyMaps().join("\n")
    ].join("\n");
  }

  function prototypeHelp() {
    return [
      "PROTOTIPO GN370 · 9 MONDI FUNZIONALI",
      "  1 ORIGINI · 2 CICLI · 3 DONI · 4 OMBRE · 5 CONTESTO",
      "  6 STRUTTURA · 7 EREDITA · 8 NEBBIA · 9 RADICI",
      "",
      "Comandi:",
      "  proto home [80|120|all]",
      "  proto world <1..9> [seq|80|120|all]",
      "  proto legend",
      "  proto nav",
      "  proto css",
      "  proto all",
      "  proto lint [all|home|world 1]"
    ].join("\n");
  }

  GN370.MAPS = {
    help: legacyHelp,
    list: listLegacyMaps,
    render: renderLegacy,
    guard: guardContent,
    prototypeHelp: prototypeHelp,
    renderPrototype: renderPrototype
  };
}(window));
