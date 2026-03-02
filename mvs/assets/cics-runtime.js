/* ================================================================
 * CICS-RUNTIME.JS — COMMAREA + PF Key Engine + Dataset Loader
 * PROGRAM-ID.  CICSSYS0
 * SISTEMA GENEALOGIA — FINE DI MONDO APS
 * Ver: 1.0.0  Date: 2026-03-02
 * ================================================================ */

/* ── COMMAREA (equivalente DFHCOMMAREA COBOL) ─────────────────── */
const COMMAREA = {
  screenId:    'GENMNU00',
  userId:      'GIARDINA/D',
  searchKey:   '',
  currentPage: 1,
  totalPages:  1,
  selectedId:  '',
  returnCode:  '0000',
  msgCode:     '',
  msgText:     ''
};

/* ── BASE PATH per GitHub Pages ────────────────────────────────── */
const BASE_URL = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return '/';
  // GitHub Pages: https://finedimondo.github.io/Genealogia/
  return '/Genealogia/';
})();

/* ── DATASET LOADER ────────────────────────────────────────────── */
// Legge JSON pre-generati da proc/GENRPT00.py (output batch)
async function loadDataset(name) {
  try {
    const url = `${BASE_URL}mvs/out/current/${name}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`RC=${res.status}`);
    return await res.json();
  } catch (e) {
    setMsg(`DATASET ${name.toUpperCase()} NON DISPONIBILE — ${e.message}`, 'err');
    return null;
  }
}

/* ── DATETIME UTILITIES ────────────────────────────────────────── */
function pad2(n) { return String(n).padStart(2, '0'); }
function sysDate() {
  const d = new Date();
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
}
function sysTime() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function fmtData8(d) {
  // AAAAMMGG → GG/MM/AAAA
  if (!d || d === '00000000' || d === '????????') return '????????';
  return `${d.slice(6,8)}/${d.slice(4,6)}/${d.slice(0,4)}`;
}

/* ── MESSAGGIO AREA (riga 23) ──────────────────────────────────── */
let _msgTimer = null;
function setMsg(text, type='warn', autoClearMs=0) {
  const el = document.getElementById('msg-area');
  if (!el) return;
  el.textContent = text ? '  ' + text : '\u00a0';
  el.className = type === 'err' ? 't-err' : (type === 'ok' ? 't-normal' : 't-warn');
  if (_msgTimer) clearTimeout(_msgTimer);
  if (autoClearMs) _msgTimer = setTimeout(() => {
    el.textContent = '\u00a0'; el.className = 't-msg';
  }, autoClearMs);
}
function clearMsg() { setMsg('', 'warn', 0); }

/* ── DATETIME HEADER ───────────────────────────────────────────── */
function updateHeader() {
  const de = document.getElementById('sys-date');
  const te = document.getElementById('sys-time');
  if (de) de.textContent = sysDate();
  if (te) te.textContent = sysTime();
}
setInterval(updateHeader, 1000);
updateHeader();

/* ── PF KEY GLOBAL HANDLER ─────────────────────────────────────── */
// Ogni schermata registra i propri handler via setPfHandler()
const _pfHandlers = {};
function setPfHandler(pf, fn) { _pfHandlers[pf] = fn; }

document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key.startsWith('F') && !isNaN(key.slice(1))) {
    const n = parseInt(key.slice(1));
    e.preventDefault();
    if (_pfHandlers[n]) { _pfHandlers[n](); return; }
    // Default handlers
    if (n === 3)  { window.location.href = `${BASE_URL}mvs/GENMNU00.html`; return; }
    if (n === 12) { const inp = document.querySelector('.t-input'); if (inp) inp.value = ''; clearMsg(); return; }
  }
  if (key === 'Enter') {
    e.preventDefault();
    if (_pfHandlers[0]) _pfHandlers[0]();
  }
});

/* ── NAVIGATION HELPERS ────────────────────────────────────────── */
function goScreen(screenId) {
  COMMAREA.screenId = screenId;
  window.location.href = `${BASE_URL}mvs/${screenId}.html`;
}

/* ── PAGINAZIONE ───────────────────────────────────────────────── */
function paginate(items, page, perPage=15) {
  const total = Math.max(1, Math.ceil(items.length / perPage));
  const p     = Math.min(Math.max(1, page), total);
  const start = (p-1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: p, total, start
  };
}

/* ── RETURN CODE FORMATTER ─────────────────────────────────────── */
const RC_LABELS = {
  '0000': 'NORMAL COMPLETION',
  '0004': 'RECORD NOT FOUND (WARNING)',
  '0008': 'DUPLICATE KEY (ERROR)',
  '0012': 'I/O ERROR (SEVERE)',
  '0016': 'SCHEMA MISMATCH (SEVERE)',
  '0999': 'ABEND — UNRECOVERABLE ERROR'
};
function rcLabel(rc) { return RC_LABELS[rc] || `RC=${rc} UNKNOWN`; }

/* ── EXPORT ────────────────────────────────────────────────────── */
window.GEN = {
  COMMAREA, BASE_URL,
  loadDataset, setMsg, clearMsg, updateHeader,
  setPfHandler, goScreen, paginate,
  fmtData8, sysDate, sysTime, pad2, rcLabel
};
