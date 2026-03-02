(function () {
  'use strict';

  const PF = { HELP: 'F1', BACK: 'F3', REFRESH: 'F5', UP: 'F7', DOWN: 'F8', MENU: 'F9', FIND: 'F10', QUIT: 'F12' };
  const ALIAS = { h: 'help', b: 'back', m: 'menu', r: 'refresh', q: 'quit' };
  const SESSION_KEY = 'gn370_session_state_v1';
  const nowStr = () => new Date().toISOString();
  const upper = (v) => String(v || '').trim().toUpperCase();
  const lower = (v) => String(v || '').toLowerCase();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getBasePath(pathname) {
    const _p = pathname || window.location.pathname || '/';
    return '';
  }

  function buildUrl(path) {
    return new URL(path, window.location.href).toString();
  }

  function withBase(basePath, path) {
    const _basePath = basePath;
    const clean = String(path || '').replace(/^\/+/, '');
    return clean;
  }

  function tokenize(input) {
    const s = String(input || '').trim();
    const out = [];
    let cur = '';
    let quote = null;
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      if (quote) {
        if (ch === quote) quote = null;
        else cur += ch;
      } else if (ch === '"' || ch === '\'') {
        quote = ch;
      } else if (/\s/.test(ch)) {
        if (cur) {
          out.push(cur);
          cur = '';
        }
      } else {
        cur += ch;
      }
    }
    if (cur) out.push(cur);
    return out;
  }

  function parseOptions(tokens) {
    const args = [];
    const opts = {};
    for (let i = 0; i < tokens.length; i += 1) {
      const t = tokens[i];
      const isSlash = t.startsWith('/') && t.length > 1;
      const isDash = t.startsWith('--') && t.length > 2;
      if (!isSlash && !isDash) {
        args.push(t);
        continue;
      }
      const key = (isDash ? t.slice(2) : t.slice(1)).toLowerCase();
      const next = tokens[i + 1];
      if (next && !next.startsWith('/') && !next.startsWith('--')) {
        opts[key] = next;
        i += 1;
      } else {
        opts[key] = true;
      }
    }
    return { args, opts };
  }

  function parseCommand(raw) {
    const tks = tokenize(raw);
    if (!tks.length) return { raw: '', cmd: '', args: [], opts: {} };
    const po = parseOptions(tks.slice(1));
    return { raw: String(raw || ''), cmd: tks[0].toLowerCase(), args: po.args, opts: po.opts };
  }

  function filterFeed(events, params) {
    const last = Number(params.last || 20);
    const type = params.type || null;
    const since = params.since || null;
    const entity = params.entity || null;
    const id = params.id || null;
    let out = events.slice();
    if (type) out = out.filter((e) => String(e.type || '').toLowerCase() === String(type).toLowerCase());
    if (entity) out = out.filter((e) => String(e.entity || '').toLowerCase() === String(entity).toLowerCase());
    if (id) out = out.filter((e) => String(e.id || '').toLowerCase() === String(id).toLowerCase());
    if (since) out = out.filter((e) => String(e.ts || '') >= since);
    out.sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')));
    if (last > 0 && out.length > last) out = out.slice(out.length - last);
    return out;
  }

  function parseStoryScenes(text) {
    const src = String(text || '').replace(/\r\n/g, '\n');
    const scenes = [];
    let cur = { title: 'SCENE', lines: [] };
    src.split('\n').forEach((line) => {
      const m = line.match(/^#\s*(.+)$/);
      if (m) {
        if (cur.lines.length || cur.title !== 'SCENE') scenes.push(cur);
        cur = { title: m[1].trim(), lines: [] };
      } else {
        cur.lines.push(line);
      }
    });
    if (cur.lines.length || cur.title !== 'SCENE') scenes.push(cur);
    return scenes;
  }

  function requireModules() {
    if (!window.GNCopybook || !window.GNRecord || !window.GNRender370) {
      throw new Error('copybook modules not loaded: src/copybook/*.js');
    }
  }

  function pct(current, total) {
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((current * 100) / total)));
  }

  const state = {
    basePath: getBasePath(),
    version: { commit: 'dev', buildTimeUtc: '-', dataHash: 'dev', sha7: 'dev' },
    events: null,
    storiesIndex: null,
    persons: null,
    recordManifest: null,
    copybooks: {},
    current: null,
    outputLines: [],
    pageSize: 26,
    top: 0,
    history: JSON.parse(localStorage.getItem('gn370_history') || '[]'),
    historyPos: -1,
    lastCommand: '',
    suggestions: [],
    techBanner: {
      ontology: '3NF NORMALIZATION',
      algorithm: 'Referential Integrity',
      agent: 'VALID_AGT',
      source: 'JOURNAL NDJSON'
    },
    stack: [],
    job: {
      running: false,
      name: '',
      stepName: '',
      stepIndex: 0,
      stepCount: 0,
      done: 0,
      total: 0,
      pct: 0,
      startedAt: '',
      endedAt: '',
      log: [],
      report: null
    }
  };

  const dom = {
    hdr1: document.getElementById('hdr-line-1'),
    hdr2: document.getElementById('hdr-line-2'),
    tech: document.getElementById('tech-banner'),
    out: document.getElementById('output-panel'),
    ctx: document.getElementById('ctx-line'),
    last: document.getElementById('last-cmd'),
    suggest: document.getElementById('suggest-panel'),
    cmd: document.getElementById('cmd-input'),
    run: document.getElementById('run-btn'),
    jobLine: document.getElementById('job-status-line')
  };
  const hasUi = Boolean(dom.hdr1 && dom.hdr2 && dom.out && dom.ctx && dom.last && dom.cmd && dom.run);

  const appendLine = (line, cls) => state.outputLines.push(cls ? `<span class="${cls}">${String(line || '')}</span>` : String(line || ''));
  const writeOK = (msg) => appendLine(`(OK) ${msg}`, 'ok');
  const writeWRN = (msg) => appendLine(`(WRN) ${msg}`, 'wrn');
  const writeERR = (msg) => appendLine(`(ERR) ${msg}`, 'err');
  const writeSEP = (msg) => appendLine(msg || '----------------------------------------', 'sep');
  const scrollToBottom = () => { state.top = Math.max(0, state.outputLines.length - state.pageSize); };
  const renderOutput = () => {
    if (!dom.out) return;
    const end = Math.min(state.outputLines.length, state.top + state.pageSize);
    dom.out.innerHTML = state.outputLines.slice(state.top, end).join('\n');
  };

  function renderHeader() {
    if (!dom.hdr1 || !dom.hdr2) return;
    const ctx = state.current ? `${state.current.kind}:${state.current.id || '-'}` : 'NONE';
    dom.hdr1.textContent = `DATASET: GENEALOGIA.CURRENT  BRANCH: main  CONTEXT: ${ctx}`;
    dom.hdr2.textContent = `TS:${nowStr()} BUILD:${state.version.sha7} TIME:${state.version.buildTimeUtc} DATA:${String(state.version.dataHash || 'dev').slice(0, 7)}`;
  }

  function renderTechBanner() {
    if (!dom.tech) return;
    dom.tech.textContent = `TECH: ${state.techBanner.ontology} | ALGO: ${state.techBanner.algorithm} | AGENT: ${state.techBanner.agent} | SOURCE: ${state.techBanner.source}`;
  }

  function setTechBanner(ontology, algorithm, agent, source) {
    state.techBanner = {
      ontology: ontology || state.techBanner.ontology,
      algorithm: algorithm || state.techBanner.algorithm,
      agent: agent || state.techBanner.agent,
      source: source || state.techBanner.source
    };
    renderTechBanner();
  }

  function buildSuggestions(pc, lastErrorCode) {
    const out = [];
    const curId = state.current && state.current.id ? state.current.id : 'GN-...';
    if (lastErrorCode) {
      out.push(`help :: syntax guide (${lastErrorCode})`);
      ['feed', 'open', 'show', 'job', 'explain', 'menu'].forEach((v) => out.push(`${v} :: command suggestion`));
      return out.slice(0, 8);
    }
    if (!pc || !pc.cmd) {
      return ['help :: command list', 'menu :: quick menu', 'feed /last 10 :: latest journal events'];
    }
    if (pc.cmd === 'open' && lower(pc.args[0]) === 'person') {
      out.push('show card :: persona corrente');
      out.push('show timeline :: timeline eventi');
      out.push(`feed /entity person /id ${curId} :: feed filtrato`);
    }
    if (pc.cmd === 'feed') {
      out.push('feed /last 10 :: ultimi 10 eventi');
      out.push('feed /type person.updated :: filtro tipo');
    }
    if (pc.cmd === 'show') {
      out.push('show card :: dettagli contesto');
      out.push('explain :: traccia algoritmo');
    }
    if (pc.cmd === 'job') {
      out.push('feed /last 10 :: verifica output job');
      out.push('explain :: traccia ultimo step');
    }
    if (pc.cmd === 'help' || pc.cmd === 'menu') {
      out.push('job run IMPORT_RECORDS :: run pipeline web');
      out.push('feed /last 10 :: activity log');
    }
    if (out.length === 0) {
      ['help', 'feed /last 10', 'open person GN-I1', 'show card', 'explain'].forEach((s) => out.push(`${s} :: suggested`));
    }
    return out.slice(0, 8);
  }

  function renderSuggestions() {
    if (!dom.suggest) return;
    dom.suggest.textContent = state.suggestions.length ? state.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') : '1. help :: command list';
  }

  function exportSessionState() {
    return {
      context: {
        entityType: state.current ? state.current.kind : '',
        entityId: state.current ? state.current.id || '' : ''
      },
      lastCommand: state.lastCommand || '',
      outputLines: state.outputLines.slice(),
      suggestions: state.suggestions.slice(),
      techBanner: {
        ontology: state.techBanner.ontology,
        algorithm: state.techBanner.algorithm,
        tech: 'GN370 WEB SHELL',
        agent: state.techBanner.agent,
        source: state.techBanner.source
      }
    };
  }

  function persistSessionState() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(exportSessionState()));
    } catch (_e) {}
  }

  function applySessionState(s) {
    if (!s || typeof s !== 'object') return;
    if (Array.isArray(s.outputLines)) state.outputLines = s.outputLines.slice(-500);
    if (s.lastCommand) state.lastCommand = String(s.lastCommand);
    if (s.context && typeof s.context === 'object') {
      const k = String(s.context.entityType || '');
      const id = String(s.context.entityId || '');
      if (k || id) state.current = { kind: k, id: id, title: id, data: null };
    }
    if (Array.isArray(s.suggestions)) state.suggestions = s.suggestions.slice(0, 8).map(String);
    if (s.techBanner && typeof s.techBanner === 'object') {
      setTechBanner(s.techBanner.ontology, s.techBanner.algorithm, s.techBanner.agent, s.techBanner.source);
    }
    renderAll();
    renderSuggestions();
  }

  function updateJobLine() {
    if (!dom.jobLine) return;
    if (!state.job.running) {
      dom.jobLine.textContent = `JOB: ${state.job.endedAt ? `LAST:${state.job.name} @ ${state.job.endedAt}` : 'IDLE'}`;
      return;
    }
    const bar = window.GNRender370
      ? window.GNRender370.makeBar(state.job.done, state.job.total, state.job.stepName, `${state.job.stepIndex}/${state.job.stepCount}`)
      : '';
    dom.jobLine.textContent = `JOB: ${bar}`;
  }

  function renderContext() {
    if (!dom.ctx || !dom.last) return;
    dom.ctx.textContent = state.current ? `CTX: ${state.current.kind.toUpperCase()} ${state.current.id || '-'} ${state.current.title || ''}` : 'CTX: NONE';
    dom.last.textContent = `LAST: ${state.lastCommand || '-'}`;
    renderHeader();
    updateJobLine();
  }

  function renderAll() {
    renderContext();
    renderTechBanner();
    renderOutput();
    renderSuggestions();
  }

  function pushState() {
    state.stack.push({ current: state.current ? JSON.parse(JSON.stringify(state.current)) : null, outputLines: state.outputLines.slice(), top: state.top });
    if (state.stack.length > 25) state.stack.shift();
  }

  function popState() {
    const s = state.stack.pop();
    if (!s) {
      writeWRN('NO PREVIOUS STATE');
      return;
    }
    state.current = s.current;
    state.outputLines = s.outputLines;
    state.top = s.top;
    renderAll();
    writeOK('BACK RESTORED');
  }

  const setContext = (kind, id, title, data) => {
    state.current = { kind, id, title, data: data || null };
    renderContext();
  };

  function liveUrl(path) {
    const clean = String(path || '').replace(/^\/+/, '');
    const queryPath = `${clean}${String(clean).includes('?') ? '&' : '?'}v=${encodeURIComponent(state.version.sha7 || 'dev')}`;
    return buildUrl(queryPath);
  }

  async function fetchText(path, opts) {
    const noStore = opts && opts.noStore;
    const live = opts && opts.liveData;
    const clean = String(path || '').replace(/^\/+/, '');
    const url = live ? liveUrl(clean) : buildUrl(clean);
    const res = await fetch(url, noStore ? { cache: 'no-store' } : undefined);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  }

  const fetchJson = async (path, opts) => JSON.parse(await fetchText(path, opts));

  async function loadVersion() {
    const url = buildUrl(`version.json?t=${Date.now()}`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`version.json ${res.status}`);
    const v = await res.json();
    const commit = String(v.commit || 'dev');
    state.version = {
      commit: commit,
      buildTimeUtc: String(v.buildTimeUtc || '-'),
      dataHash: String(v.dataHash || 'dev'),
      sha7: commit.slice(0, 7) || 'dev'
    };
  }

  async function ensureEvents() {
    if (state.events) return state.events;
    const text = await fetchText('data/current/events.ndjson', { noStore: true, liveData: true });
    state.events = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
    return state.events;
  }

  async function ensureStoriesIndex() {
    if (state.storiesIndex) return state.storiesIndex;
    state.storiesIndex = await fetchJson('data/current/stories/index.json', { noStore: true, liveData: true });
    return state.storiesIndex;
  }

  async function ensurePersons() {
    if (state.persons) return state.persons;
    const text = await fetchText('data/current/entities/persons.ndjson', { noStore: true, liveData: true });
    state.persons = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
    return state.persons;
  }

  async function ensureRecordManifest() {
    if (state.recordManifest) return state.recordManifest;
    state.recordManifest = await fetchJson('data/current/records/manifest.json', { noStore: true, liveData: true });
    return state.recordManifest;
  }

  async function loadDbStatusMeta() {
    const out = { lastReset: null, lastImport: null, lastRebuild: null, dbStatus: null, latestBackup: null, counts: null };
    try { out.lastReset = await fetchJson('data/current/meta/last_reset.json', { noStore: true, liveData: true }); } catch (_e1) {}
    try { out.lastImport = await fetchJson('data/current/meta/last_import.json', { noStore: true, liveData: true }); } catch (_e2) {}
    try { out.lastRebuild = await fetchJson('data/current/meta/last_rebuild.json', { noStore: true, liveData: true }); } catch (_e3) {}
    try { out.dbStatus = await fetchJson('data/current/meta/db_status.json', { noStore: true, liveData: true }); } catch (_e5) {}
    try {
      const m = await ensureRecordManifest();
      out.counts = {
        persons: (m.persons || []).length,
        families: (m.families || []).length,
        events: (m.events || []).length
      };
    } catch (_e4) {}
    if (out.dbStatus && out.dbStatus.latestBackup) out.latestBackup = out.dbStatus.latestBackup;
    return out;
  }

  async function ensureCopybook(type) {
    requireModules();
    const t = upper(type);
    if (state.copybooks[t]) return state.copybooks[t];
    const copyText = await fetchText(`copybooks/${t}.CPY`, { noStore: true, liveData: true });
    const schema = window.GNCopybook.parseCopybook(copyText, { copyName: `${t}.CPY` });
    state.copybooks[t] = schema;
    return schema;
  }

  async function loadRecord(type, id) {
    return await fetchText(`data/current/records/${upper(type)}/${id}.rec`, { noStore: true, liveData: true });
  }

  function allRecordRefs(manifest) {
    return []
      .concat((manifest.persons || []).map((p) => ({ type: 'PERSON', path: p })))
      .concat((manifest.families || []).map((p) => ({ type: 'FAMILY', path: p })))
      .concat((manifest.events || []).map((p) => ({ type: 'EVENT', path: p })));
  }

  function setJobProgress(stepName, stepIndex, stepCount, done, total, detail) {
    state.job.stepName = stepName;
    state.job.stepIndex = stepIndex;
    state.job.stepCount = stepCount;
    state.job.done = done;
    state.job.total = total;
    state.job.pct = pct(done, total);
    updateJobLine();
    if (window.GNRender370) appendLine(window.GNRender370.makeBar(done, total, stepName, detail || ''), 'job');
    renderOutput();
  }

  function logEvery10(name, done, total, last) {
    const current = pct(done, total);
    if (current >= last + 10 || done === total) {
      writeOK(`${name} ${current}% (${done}/${total})`);
      return current;
    }
    return last;
  }

  async function runLoaderJob(name) {
    requireModules();
    if (state.job.running) return;

    state.job.running = true;
    state.job.name = name;
    state.job.startedAt = nowStr();
    state.job.endedAt = '';
    state.job.log = [];
    state.job.report = null;

    const report = { copybooks: 0, recordsTotal: 0, valid: 0, invalid: 0, byType: { PERSON: 0, FAMILY: 0, EVENT: 0 } };

    try {
      const steps = ['LOAD_COPYBOOKS', 'SCAN_RECORDS', 'PARSE_RECORDS', 'REPORT'];
      setJobProgress('LOAD_COPYBOOKS', 1, steps.length, 0, 3, '');
      for (let i = 0; i < 3; i += 1) {
        const type = ['PERSON', 'FAMILY', 'EVENT'][i];
        await ensureCopybook(type);
        report.copybooks += 1;
        setJobProgress('LOAD_COPYBOOKS', 1, steps.length, i + 1, 3, type);
        await sleep(10);
      }

      setJobProgress('SCAN_RECORDS', 2, steps.length, 0, 1, '');
      const manifest = await ensureRecordManifest();
      const refs = allRecordRefs(manifest);
      report.recordsTotal = refs.length;
      setJobProgress('SCAN_RECORDS', 2, steps.length, 1, 1, `${refs.length} FILES`);
      await sleep(10);

      let done = 0;
      let lastLogged = -10;
      setJobProgress('PARSE_RECORDS', 3, steps.length, done, Math.max(1, refs.length), '');
      for (let i = 0; i < refs.length; i += 1) {
        const ref = refs[i];
        const parts = String(ref.path).split('/');
        const id = parts[parts.length - 1].replace(/\.rec$/i, '');
        const raw = await fetchText(`data/current/records/${ref.path}`, { noStore: true, liveData: true });
        const parsed = window.GNRecord.parseRecord(await ensureCopybook(ref.type), raw);
        if (parsed.isValid) report.valid += 1;
        else report.invalid += 1;
        report.byType[ref.type] = (report.byType[ref.type] || 0) + 1;
        done += 1;
        setJobProgress('PARSE_RECORDS', 3, steps.length, done, Math.max(1, refs.length), ref.type);
        lastLogged = logEvery10('PARSE RECORDS', done, Math.max(1, refs.length), lastLogged);
        if (done % 5 === 0 || done === refs.length) state.job.log.push(`${nowStr()} | PARSED ${ref.type} ${id} valid=${parsed.isValid}`);
      }

      setJobProgress('REPORT', 4, steps.length, 1, 1, 'DONE');
      state.job.report = report;
      state.job.log.push(`${nowStr()} | REPORT copybooks=${report.copybooks} total=${report.recordsTotal} valid=${report.valid} invalid=${report.invalid}`);
      if (name !== 'BOOT_LOADER') {
        writeSEP('================ JOB REPORT =================');
        appendLine(`copybooks loaded : ${report.copybooks}`);
        appendLine(`records total    : ${report.recordsTotal}`);
        appendLine(`records valid    : ${report.valid}`);
        appendLine(`records invalid  : ${report.invalid}`);
        appendLine(`PERSON count     : ${report.byType.PERSON}`);
        appendLine(`FAMILY count     : ${report.byType.FAMILY}`);
        appendLine(`EVENT count      : ${report.byType.EVENT}`);
        writeSEP('============================================');
      }
      writeOK(`${name} COMPLETED`);
      scrollToBottom();
      renderOutput();
    } catch (err) {
      writeERR(`${name} FAILED: ${err.message || String(err)}`);
      renderOutput();
    } finally {
      state.job.running = false;
      state.job.endedAt = nowStr();
      updateJobLine();
    }
  }

  async function swRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      return await navigator.serviceWorker.getRegistration('./');
    } catch (_e) {
      return null;
    }
  }

  async function cmdCacheStatus() {
    const reg = await swRegistration();
    const keys = (window.caches && caches.keys) ? await caches.keys() : [];
    writeSEP('================ CACHE STATUS ================');
    appendLine(`sw supported : ${'serviceWorker' in navigator}`);
    appendLine(`sw active    : ${Boolean(reg)}`);
    appendLine(`cache count  : ${keys.length}`);
    appendLine(`build sha    : ${state.version.sha7}`);
    appendLine(`data hash    : ${String(state.version.dataHash || '').slice(0, 7)}`);
    writeSEP('=============================================');
    scrollToBottom();
    renderOutput();
  }

  async function cmdCacheUpdate() {
    if (!('serviceWorker' in navigator)) {
      writeWRN('SERVICE WORKER NOT SUPPORTED');
      renderOutput();
      return;
    }
    const reg = await swRegistration();
    if (!reg) {
      writeWRN('NO SERVICE WORKER REGISTRATION');
      renderOutput();
      return;
    }
    await reg.update();
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    writeOK('CACHE UPDATE REQUESTED, RELOADING');
    renderOutput();
    window.location.reload();
  }

  async function cmdCacheClear() {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    writeOK('CACHE CLEARED');
    renderOutput();
    const u = new URL(window.location.href);
    u.searchParams.set('hard', '1');
    u.searchParams.set('t', Date.now().toString());
    window.location.href = u.toString();
  }

  async function cmdDbStatus() {
    const meta = await loadDbStatusMeta();
    writeSEP('================ DB STATUS =================');
    appendLine(`build sha      : ${state.version.sha7}`);
    appendLine(`data hash      : ${String(state.version.dataHash || '').slice(0, 12)}`);
    if (meta.counts) {
      appendLine(`records person : ${meta.counts.persons}`);
      appendLine(`records family : ${meta.counts.families}`);
      appendLine(`records event  : ${meta.counts.events}`);
    } else {
      appendLine('(WRN) counts unavailable');
    }
    appendLine(`last reset     : ${meta.lastReset ? (meta.lastReset.timestamp || '-') : '-'}`);
    appendLine(`last import    : ${meta.lastImport ? (meta.lastImport.timestamp || meta.lastImport.imported_at || '-') : '-'}`);
    appendLine(`last rebuild   : ${meta.lastRebuild ? (meta.lastRebuild.timestamp || '-') : '-'}`);
    appendLine(`last backup    : ${meta.latestBackup || '-'}`);
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
  }

  async function cmdDbRunSim(opName, detail) {
    const steps = ['BACKUP', opName, 'VALIDATE', 'DONE'];
    for (let i = 0; i < steps.length; i += 1) {
      const s = steps[i];
      setJobProgress(s, i + 1, steps.length, i + 1, steps.length, detail || 'WEB MODE');
      await sleep(120);
      writeOK(`${s} ${(i + 1) * 25}%`);
    }
    writeWRN(`WEB MODE: execute offline script tools\\db\\${detail}`);
    scrollToBottom();
    renderOutput();
  }

  async function cmdDb(pc) {
    const sub = lower(pc.args[0]);
    if (sub === 'status') return await cmdDbStatus();
    if (sub === 'backup') return await cmdDbRunSim('BACKUP', 'db_backup.cmd [tag]');
    if (sub === 'reset') return await cmdDbRunSim('RESET', 'db_reset.cmd [--keep-backup]');
    if (sub === 'rebuild') return await cmdDbRunSim('REBUILD', 'db_rebuild.cmd');
    if (sub === 'restore') return await cmdDbRunSim('RESTORE', 'db_restore.cmd <backup_zip>');
    writeERR('DB command: STATUS|BACKUP|RESET|REBUILD|RESTORE');
    renderOutput();
  }

  function printHelp() {
    setTechBanner('COMMAND LEXICON', 'Verb Lookup', 'PARSE_AGT', 'INLINE HELP');
    writeSEP('================ GN370 HELP ================');
    [
      'help|h',
      'menu|m',
      'back|b',
      'refresh|r',
      'feed [last N] [/type T] [/since YYYY-MM-DD] [/entity person|family|story] [/id ID]',
      'story list',
      'story open <storyId>',
      'story play <storyId>',
      'open person <id>',
      'open xref <@I123@>',
      'open rec <TYPE> <ID>',
      'show copy <TYPE>',
      'validate rec <TYPE> <ID>',
      'job run IMPORT_RECORDS',
      'job run pipeline',
      'job status',
      'job log --tail 50',
      'explain [last|context]',
      'state show',
      'state load [runtime/session_state.json]',
      'db status',
      'db backup [tag]',
      'db reset [--keep-backup]',
      'db rebuild',
      'db restore <backup_file>',
      'cache status',
      'cache update',
      'cache clear',
      'show card',
      'clear'
    ].forEach((x) => appendLine(`  ${x}`));
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
  }

  function printMenu() {
    setTechBanner('MAIN NAVIGATION', 'Menu Projection', 'EXPL_AGT', 'STATIC SHELL');
    writeSEP('=============== MAIN MENU ==================');
    [
      '1) feed last 10',
      '2) story list',
      '3) open rec PERSON P#SAMPLE001',
      '4) show copy PERSON',
      '5) validate rec EVENT E#SAMPLE001',
      '6) job run IMPORT_RECORDS',
      '7) db status',
      '8) cache status'
    ].forEach((x) => appendLine(`  ${x}`));
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
  }

  async function cmdFeed(pc) {
    setTechBanner('JOURNAL EVENT STREAM', 'Filter + Window', 'EXPL_AGT', 'JOURNAL NDJSON');
    const p = { last: 20, type: pc.opts.type || null, since: pc.opts.since || null, entity: pc.opts.entity || null, id: pc.opts.id || null };
    if (pc.args[0] && lower(pc.args[0]) === 'last' && pc.args[1]) p.last = Number(pc.args[1]);
    if (pc.opts.last) p.last = Number(pc.opts.last);
    const rows = filterFeed(await ensureEvents(), p);
    writeSEP(`============= FEED (${rows.length}) =============`);
    rows.forEach((e) => appendLine(`${e.ts} | ${e.type} | ${e.entity}:${e.id} | ${e.title}`));
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
    writeOK(`FEED READY ${rows.length} ROWS`);
  }

  async function cmdStoryList() {
    setTechBanner('NARRATIVE INDEX', 'Index Scan', 'STORY_AGT', 'STORIES INDEX');
    const stories = (await ensureStoriesIndex()).stories || [];
    writeSEP('=============== STORY LIST ==================');
    stories.forEach((s) => appendLine(`${s.id} | ${s.title} | ${s.period} | tags:${(s.tags || []).join(',')}`));
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
    writeOK(`STORIES ${stories.length}`);
  }

  async function cmdStoryOpen(id) {
    setTechBanner('STORY CONTEXT', 'Entity Lookup', 'STORY_AGT', 'STORIES INDEX');
    if (!id) {
      writeERR('story open <storyId> MISSING');
      renderOutput();
      return;
    }
    const s = ((await ensureStoriesIndex()).stories || []).find((x) => upper(x.id) === upper(id));
    if (!s) {
      writeERR(`STORY NOT FOUND ${id}`);
      renderOutput();
      return;
    }
    pushState();
    setContext('story', s.id, s.title, s);
    writeOK(`STORY OPENED ${s.id}`);
    writeSEP(`${s.title} (${s.period})`);
    appendLine(`tags: ${(s.tags || []).join(', ')}`);
    scrollToBottom();
    renderOutput();
  }

  async function cmdStoryPlay(id) {
    setTechBanner('NARRATIVE RENDER', 'Scene Sequencing', 'STORY_AGT', 'STORY FILE');
    if (!id) {
      writeERR('story play <storyId> MISSING');
      renderOutput();
      return;
    }
    const scenes = parseStoryScenes(await fetchText(`data/current/stories/${id}.story`, { noStore: true, liveData: true }));
    pushState();
    setContext('story', id, id, { scenes: scenes.length });
    writeSEP(`========== STORY PLAY ${id} ==========`);
    scenes.forEach((sc, i) => {
      appendLine(`SCENE ${i + 1}: ${sc.title}`);
      appendLine('----------------------------------------');
      sc.lines.forEach((ln) => appendLine(ln));
      appendLine('----------------------------------------');
    });
    writeSEP('=====================================');
    scrollToBottom();
    renderOutput();
    writeOK(`STORY PLAY READY ${scenes.length} SCENES`);
  }

  async function cmdOpenPerson(id) {
    setTechBanner('ENTITY LOOKUP', 'ID Match + Fallback', 'NORM_AGT', 'PERSON NDJSON');
    if (!id) {
      writeERR('open person <id> MISSING');
      renderOutput();
      return;
    }
    const persons = await ensurePersons();
    const fb = await fetchJson('data/current/entities/sample_person.json', { noStore: true, liveData: true });
    const p = persons.find((x) => lower(x.id) === lower(id)) || fb;
    if (!persons.find((x) => lower(x.id) === lower(id))) writeWRN('PERSON NOT FOUND, USING SAMPLE');
    pushState();
    setContext('person', p.id || id, (p.name || `${p.family_name || ''} ${p.given_names || ''}`).trim(), p);
    writeOK(`PERSON OPENED ${p.id || id}`);
    scrollToBottom();
    renderOutput();
  }

  async function cmdOpenXref(xref) {
    setTechBanner('ENTITY LOOKUP', 'XREF Resolution', 'NORM_AGT', 'PERSON NDJSON');
    if (!xref) {
      writeERR('open xref <@I123@> MISSING');
      renderOutput();
      return;
    }
    const p = (await ensurePersons()).find((x) => upper(x.xref) === upper(xref));
    if (!p) {
      writeERR(`XREF NOT FOUND ${xref}`);
      renderOutput();
      return;
    }
    pushState();
    setContext('person', p.id || '-', p.name || '-', p);
    writeOK(`OPEN XREF ${xref} -> ${p.id}`);
    scrollToBottom();
    renderOutput();
  }

  async function cmdShowCopy(type) {
    setTechBanner('COPYBOOK SCHEMA', 'Copybook Parse', 'PARSE_AGT', 'CPY FILE');
    requireModules();
    const t = upper(type);
    if (!t) {
      writeERR('show copy <TYPE> MISSING');
      renderOutput();
      return;
    }
    const c = await ensureCopybook(t);
    pushState();
    setContext('copy', t, `${t}.CPY`, c);
    window.GNRender370.renderCopy(c, t, `copybooks/${t}.CPY`).forEach((ln) => appendLine(ln));
    scrollToBottom();
    renderOutput();
    writeOK(`COPY LOADED ${t} LEN=${c.totalLength}`);
  }

  async function cmdOpenRec(type, id) {
    setTechBanner('RECORD RENDER', 'Fixed-Length Parse', 'PARSE_AGT', 'RECORD FILE');
    requireModules();
    const t = upper(type);
    if (!t || !id) {
      writeERR('open rec <TYPE> <ID> MISSING');
      renderOutput();
      return;
    }
    const c = await ensureCopybook(t);
    const p = window.GNRecord.parseRecord(c, await loadRecord(t, id));
    pushState();
    setContext('rec', id, t, { type: t, id: id, parsed: p });
    window.GNRender370.renderRecord(t, id, c, p, `${t}.CPY`).forEach((ln) => appendLine(ln));
    scrollToBottom();
    renderOutput();
    if (p.isValid) writeOK(`RECORD VALID ${t} ${id}`);
    else writeWRN(`RECORD INVALID ${t} ${id} ERR=${p.errors.length}`);
  }

  async function cmdValidateRec(type, id) {
    setTechBanner('DATA VALIDATION', 'Constraint Check', 'VALID_AGT', 'RECORD FILE');
    requireModules();
    const t = upper(type);
    if (!t || !id) {
      writeERR('validate rec <TYPE> <ID> MISSING');
      renderOutput();
      return;
    }
    const p = window.GNRecord.parseRecord(await ensureCopybook(t), await loadRecord(t, id));
    if (p.isValid) writeOK(`VALIDATE OK ${t} ${id} LEN=${p.expectedLength}`);
    else {
      writeERR(`VALIDATE FAIL ${t} ${id}`);
      p.errors.forEach((e) => writeERR(e));
    }
    p.warnings.forEach((w) => writeWRN(w));
    scrollToBottom();
    renderOutput();
  }

  function cmdShowCard() {
    setTechBanner('ENTITY CARD', 'Field Projection', 'EXPL_AGT', 'CURRENT CONTEXT');
    if (!state.current) {
      writeWRN('NO CURRENT CONTEXT');
      renderOutput();
      return;
    }
    writeSEP(`=============== CARD ${state.current.kind.toUpperCase()} ===============`);
    Object.keys(state.current.data || {}).forEach((k) => appendLine(`${k}: ${JSON.stringify(state.current.data[k])}`));
    writeSEP('=======================================================');
    scrollToBottom();
    renderOutput();
  }

  function cmdClear() {
    state.outputLines = [];
    state.top = 0;
    renderOutput();
    writeOK('OUTPUT CLEARED');
    scrollToBottom();
    renderOutput();
  }

  async function cmdJob(pc) {
    const sub = lower(pc.args[0]);
    if (sub === 'run') {
      const name = upper(pc.args[1] || '');
      if (name !== 'IMPORT_RECORDS' && name !== 'PIPELINE' && name !== 'IMPORT_NORM_VALIDATE_JOURNAL') {
        writeERR('JOB RUN supports: IMPORT_RECORDS | PIPELINE | IMPORT_NORM_VALIDATE_JOURNAL');
        renderOutput();
        return;
      }
      setTechBanner('3NF NORMALIZATION', 'Pipeline Orchestration', 'PIPELINE_RUNNER', 'JOURNAL + RECORDS');
      await runLoaderJob('IMPORT_RECORDS');
      return;
    }
    if (sub === 'status') {
      if (!state.job.name) {
        writeWRN('NO JOB EXECUTED YET');
        renderOutput();
        return;
      }
      writeSEP('================ JOB STATUS =================');
      appendLine(`name     : ${state.job.name}`);
      appendLine(`status   : ${state.job.running ? 'RUNNING' : 'IDLE'}`);
      appendLine(`started  : ${state.job.startedAt}`);
      appendLine(`ended    : ${state.job.endedAt || '-'}`);
      appendLine(window.GNRender370 ? window.GNRender370.makeBar(state.job.done, state.job.total, state.job.stepName, `${state.job.stepIndex}/${state.job.stepCount}`) : '');
      if (state.job.report) appendLine(`last report valid=${state.job.report.valid} invalid=${state.job.report.invalid}`);
      writeSEP('=============================================');
      scrollToBottom();
      renderOutput();
      return;
    }
    if (sub === 'log') {
      const tail = Math.max(1, Number(pc.opts.tail || pc.args[1] || 50));
      writeSEP(`================ JOB LOG TAIL ${tail} ================`);
      const rows = state.job.log.slice(Math.max(0, state.job.log.length - tail));
      if (!rows.length) appendLine('(WRN) empty job log');
      rows.forEach((r) => appendLine(r, 'job-step'));
      writeSEP('================================================');
      scrollToBottom();
      renderOutput();
      return;
    }
    writeERR('JOB command: RUN|STATUS|LOG');
    renderOutput();
  }

  function cmdExplain(pc) {
    setTechBanner('TRANSPARENCY LAYER', 'Derivation Trace', 'EXPL_AGT', 'SESSION STATE');
    const target = lower(pc.args[0] || 'last');
    writeSEP('================ EXPLAIN =================');
    appendLine(`target        : ${target.toUpperCase()}`);
    appendLine(`last command  : ${state.lastCommand || '-'}`);
    appendLine(`context       : ${state.current ? `${state.current.kind}:${state.current.id || '-'}` : 'NONE'}`);
    appendLine(`tech ontology : ${state.techBanner.ontology}`);
    appendLine(`algorithm     : ${state.techBanner.algorithm}`);
    appendLine(`agent         : ${state.techBanner.agent}`);
    appendLine(`source        : ${state.techBanner.source}`);
    appendLine('note          : web shell uses read-only projection over static data');
    writeSEP('==========================================');
    scrollToBottom();
    renderOutput();
  }

  async function cmdState(pc) {
    const sub = lower(pc.args[0] || 'show');
    if (sub === 'show') {
      writeSEP('============== SESSION STATE =============');
      appendLine(JSON.stringify(exportSessionState(), null, 2));
      writeSEP('==========================================');
      scrollToBottom();
      renderOutput();
      return;
    }
    if (sub === 'load') {
      const path = pc.args[1] || 'runtime/session_state.json';
      const payload = await fetchJson(path, { noStore: true, liveData: true });
      applySessionState(payload);
      writeOK(`SESSION LOADED ${path}`);
      scrollToBottom();
      renderOutput();
      return;
    }
    writeERR('STATE command: SHOW|LOAD [path]');
    renderOutput();
  }

  async function cmdCache(pc) {
    const sub = lower(pc.args[0]);
    if (sub === 'status') return await cmdCacheStatus();
    if (sub === 'update') return await cmdCacheUpdate();
    if (sub === 'clear') return await cmdCacheClear();
    writeERR('CACHE command: STATUS|UPDATE|CLEAR');
    renderOutput();
  }

  async function execute(raw) {
    const pc = parseCommand(raw);
    if (!pc.cmd) return;
    const cmd = ALIAS[pc.cmd] || pc.cmd;
    let errCode = '';

    state.lastCommand = raw;
    if (dom.last) dom.last.textContent = `LAST: ${state.lastCommand}`;
    if (state.history[state.history.length - 1] !== raw) {
      state.history.push(raw);
      if (state.history.length > 80) state.history.shift();
      localStorage.setItem('gn370_history', JSON.stringify(state.history));
    }
    state.historyPos = state.history.length;

    try {
      if (cmd === 'help') printHelp();
      else if (cmd === 'menu') printMenu();
      else if (cmd === 'back') popState();
      else if (cmd === 'quit') {
        writeWRN('QUIT DISABLED IN BROWSER');
        renderOutput();
      }
      else if (cmd === 'refresh') {
        state.events = null;
        state.storiesIndex = null;
        state.persons = null;
        state.recordManifest = null;
        state.copybooks = {};
        writeOK('CACHE INVALIDATED');
        renderOutput();
      } else if (cmd === 'feed') await cmdFeed(pc);
      else if (cmd === 'story' && lower(pc.args[0]) === 'list') await cmdStoryList();
      else if (cmd === 'story' && lower(pc.args[0]) === 'open') await cmdStoryOpen(pc.args[1]);
      else if (cmd === 'story' && lower(pc.args[0]) === 'play') await cmdStoryPlay(pc.args[1]);
      else if (cmd === 'open' && lower(pc.args[0]) === 'person') await cmdOpenPerson(pc.args[1]);
      else if (cmd === 'open' && lower(pc.args[0]) === 'xref') await cmdOpenXref(pc.args[1]);
      else if (cmd === 'open' && lower(pc.args[0]) === 'rec') await cmdOpenRec(pc.args[1], pc.args[2]);
      else if (cmd === 'show' && lower(pc.args[0]) === 'card') cmdShowCard();
      else if (cmd === 'show' && lower(pc.args[0]) === 'copy') await cmdShowCopy(pc.args[1]);
      else if (cmd === 'validate' && lower(pc.args[0]) === 'rec') await cmdValidateRec(pc.args[1], pc.args[2]);
      else if (cmd === 'job') await cmdJob(pc);
      else if (cmd === 'db') await cmdDb(pc);
      else if (cmd === 'cache') await cmdCache(pc);
      else if (cmd === 'explain') cmdExplain(pc);
      else if (cmd === 'state') await cmdState(pc);
      else if (cmd === 'clear') cmdClear();
      else {
        errCode = 'ERR_UNKNOWN_COMMAND';
        writeERR(`UNKNOWN COMMAND: ${raw}`);
        renderOutput();
      }
    } catch (e) {
      errCode = 'ERR_RUNTIME';
      writeERR(e.message || String(e));
      renderOutput();
    } finally {
      state.suggestions = buildSuggestions({ cmd: cmd, args: pc.args, opts: pc.opts }, errCode);
      persistSessionState();
      renderAll();
    }
  }

  function movePage(delta) {
    const maxTop = Math.max(0, state.outputLines.length - state.pageSize);
    state.top = Math.max(0, Math.min(maxTop, state.top + delta));
    renderOutput();
  }

  function canUseSW() {
    return location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  }

  async function registerServiceWorkerSafe() {
    if (!canUseSW() || !('serviceWorker' in navigator)) return;
    const swPath = buildUrl('service-worker.js');
    await navigator.serviceWorker.register(swPath, { scope: './' });
  }

  function bindUi() {
    if (!hasUi) return;
    dom.run.addEventListener('click', async () => {
      const v = dom.cmd.value.trim();
      dom.cmd.value = '';
      if (v) await execute(v);
      dom.cmd.focus();
    });
    dom.cmd.addEventListener('keydown', async (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        dom.run.click();
      } else if (ev.key === 'Tab') {
        ev.preventDefault();
        const src = state.suggestions[0] || 'help';
        dom.cmd.value = String(src).split('::')[0].trim();
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!state.history.length) return;
        state.historyPos = Math.max(0, state.historyPos - 1);
        dom.cmd.value = state.history[state.historyPos] || '';
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (!state.history.length) return;
        state.historyPos = Math.min(state.history.length, state.historyPos + 1);
        dom.cmd.value = state.history[state.historyPos] || '';
      }
    });
    dom.out.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      movePage(ev.deltaY > 0 ? 3 : -3);
    }, { passive: false });
    document.addEventListener('keydown', async (ev) => {
      const k = ev.key;
      if (k === PF.HELP) { ev.preventDefault(); await execute('help'); }
      if (k === PF.BACK) { ev.preventDefault(); await execute('back'); }
      if (k === PF.REFRESH) { ev.preventDefault(); await execute('refresh'); }
      if (k === PF.UP) { ev.preventDefault(); movePage(-state.pageSize); }
      if (k === PF.DOWN) { ev.preventDefault(); movePage(state.pageSize); }
      if (k === PF.MENU) { ev.preventDefault(); await execute('menu'); }
      if (k === PF.FIND) { ev.preventDefault(); dom.cmd.focus(); dom.cmd.select(); writeOK('FIND: TYPE COMMAND'); renderOutput(); }
      if (k === PF.QUIT) { ev.preventDefault(); writeWRN('QUIT DISABLED IN BROWSER'); renderOutput(); }
    });
  }

  async function boot() {
    if (!hasUi) return;
    try {
      await loadVersion();
    } catch (err) {
      writeWRN(`version.json unavailable: ${err.message || String(err)}`);
    }
    try {
      const cached = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (cached) applySessionState(cached);
    } catch (_e) {}
    renderHeader();
    renderContext();
    state.suggestions = buildSuggestions(parseCommand(''), '');
    renderSuggestions();
    printMenu();
    writeOK('GN370 SHELL READY');
    scrollToBottom();
    renderOutput();
    bindUi();
    dom.cmd.focus();
    await runLoaderJob('BOOT_LOADER');
    await registerServiceWorkerSafe();
    setInterval(renderHeader, 1000);
  }

  window.GN370 = {
    getBasePath,
    buildUrl,
    withBase,
    tokenize,
    parseOptions,
    parseCommand,
    filterFeed,
    parseStoryScenes,
    exportSessionState,
    applySessionState,
    progressLine: (c, t, s, d) => (window.GNRender370 ? window.GNRender370.makeBar(c, t, s, d) : ''),
    _state: state,
    execute
  };

  boot();
})();
