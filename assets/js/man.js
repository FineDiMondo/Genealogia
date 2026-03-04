(function (global) {
  "use strict";
  var GN370 = global.GN370 = global.GN370 || {};

  var pages = {
    help: "help: elenco comandi | man <cmd>: dettaglio comando",
    start: "start: apre il frontespizio operativo GNHM0001 (home gateway)",
    home: "home: alias di start, riporta al frontespizio operativo",
    risorgimento: "risorgimento: forza tema risorgimentale e apre il frontespizio operativo",
    lista: "lista: mostra gli archivi .zip presenti in /salvataggi",
    carica: "carica <nomefile.zip>: importa lo ZIP da /salvataggi senza file picker",
    status: "status: mostra stato DB, ambiente e conteggi",
    "db import": "db import: apre il gateway in modalita import ZIP (PF3)",
    "db export": "db export: esporta DB in AAAAGGMMHHMM.zip",
    maps: "maps: elenco mappe ASCII disponibili (MAPPA 1..9, varianti A/B/C/D)",
    mappa: "mappa <n|n[a-d]>: mostra una mappa ASCII completa o una sua variante",
    proto: "proto home|world <1..9> [seq|80|120|all]|legend|nav|css|all|lint: prototipo 9 mondi funzionali con guard automatico",
    map: "map --period <era>: mappa SVG | map <n|n[a-d]>: alias rapido per mappe ASCII",
    player: "player: apre la pagina /player/ con videata FLAC stile 370",
    pls: "pls: playlist status del modulo PLAYER FLAC",
    load: "load <path|url|uri>: carica solo tracce FLAC (.flac o audio/flac)",
    play: "play [index]: avvia/riprende la traccia corrente o indice (1-based)",
    pause: "pause: pausa la riproduzione corrente",
    stop: "stop: arresta e resetta TIME=0",
    seek: "seek <sec>: sposta il cursore in secondi nella traccia corrente",
    next: "next: traccia successiva nella playlist",
    prev: "prev: traccia precedente nella playlist",
    stat: "stat: record stato PLAYER con RC/RSN/STATE/TIME/DUR/SR/BIT/CH",
    validate: "validate: esegue IC/W check read-only",
    "add tx statico": "add tx statico <testo>: registra testo statico su JOURNAL (op_type=TX_STATIC_ADD)",
    theme: "theme <nome>: normanno/svevo/aragonese/castigliano/risorgimentale/terminal"
  };

  GN370.MAN = {
    list: function () { return Object.keys(pages).sort(); },
    get: function (cmd) { return pages[cmd] || "manpage non trovata"; }
  };
}(window));
