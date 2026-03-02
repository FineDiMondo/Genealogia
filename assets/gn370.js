(function () {
  'use strict';

  const PF = {
    HELP: 'F1',
    BACK: 'F3',
    REFRESH: 'F5',
    UP: 'F7',
    DOWN: 'F8',
    MENU: 'F9',
    FIND: 'F10',
    QUIT: 'F12'
  };

  function getBasePath(pathname) {
    const p = pathname || window.location.pathname || '/';
    return p.includes('/Genealogia/') ? '/Genealogia' : '';
  }

  function withBase(basePath, path) {
    const clean = String(path || '').replace(/^\/+/, '');
    return basePath ? `${basePath}/${clean}` : `/${clean}`;
  }

  function tokenize(input) {
    const s = String(input || '').trim();
    const out = [];
    let cur = '';
    let quote = null;
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
        } else {
          cur += ch;
        }
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
      if (t.startsWith('/')) {
        const key = t.slice(1).toLowerCase();
        const next = tokens[i + 1];
        if (next && !next.startsWith('/')) {
          opts[key] = next;
          i += 1;
        } else {
          opts[key] = true;
        }
      } else {
        args.push(t);
      }
    }
    return { args, opts };
  }

  function parseCommand(raw) {
    const tks = tokenize(raw);
    if (!tks.length) return { raw: '', cmd: '', args: [], opts: {} };
    const cmd = tks[0].toLowerCase();
    const po = parseOptions(tks.slice(1));
    return { raw: String(raw || ''), cmd, args: po.args, opts: po.opts };
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

  function nowStr() {
    return new Date().toISOString();
  }

  const state = {
    basePath: getBasePath(),
    events: null,
    persons: null,
    families: null,
    storiesIndex: null,
    current: null,
    outputLines: [],
    pageSize: 26,
    top: 0,
    history: JSON.parse(localStorage.getItem('gn370_history') || '[]'),
    historyPos: -1,
    lastCommand: '',
    stack: []
  };

  const dom = {
    hdr1: document.getElementById('hdr-line-1'),
    hdr2: document.getElementById('hdr-line-2'),
    out: document.getElementById('output-panel'),
    ctx: document.getElementById('ctx-line'),
    hint: document.getElementById('hint-line'),
    last: document.getElementById('last-cmd'),
    cmd: document.getElementById('cmd-input'),
    run: document.getElementById('run-btn')
  };
  const hasUi = Boolean(dom.hdr1 && dom.hdr2 && dom.out && dom.ctx && dom.last && dom.cmd && dom.run);

  function pushState() {
    state.stack.push({
      current: state.current ? JSON.parse(JSON.stringify(state.current)) : null,
      outputLines: state.outputLines.slice(),
      top: state.top
    });
    if (state.stack.length > 25) state.stack.shift();
  }

  function popState() {
    const snap = state.stack.pop();
    if (!snap) {
      writeWRN('NO PREVIOUS STATE');
      return;
    }
    state.current = snap.current;
    state.outputLines = snap.outputLines;
    state.top = snap.top;
    renderAll();
    writeOK('BACK RESTORED');
  }

  function setContext(kind, id, title, data) {
    state.current = { kind, id, title, data: data || null };
    renderContext();
  }

  function renderHeader() {
    if (!dom.hdr1 || !dom.hdr2) return;
    const ctx = state.current ? `${state.current.kind}:${state.current.id || '-'}` : 'NONE';
    dom.hdr1.textContent = `DATASET: GENEALOGIA.CURRENT  BRANCH: main  CONTEXT: ${ctx}`;
    dom.hdr2.textContent = `TS: ${nowStr()}  BASE: ${state.basePath || '/'}`;
  }

  function renderContext() {
    if (!dom.ctx || !dom.last) return;
    if (!state.current) {
      dom.ctx.textContent = 'CTX: NONE';
    } else {
      dom.ctx.textContent = `CTX: ${state.current.kind.toUpperCase()} ${state.current.id || '-'} ${state.current.title || ''}`;
    }
    dom.last.textContent = `LAST: ${state.lastCommand || '-'}`;
    renderHeader();
  }

  function appendLine(line, cls) {
    const safe = String(line || '');
    state.outputLines.push(cls ? `<span class="${cls}">${safe}</span>` : safe);
  }

  function writeOK(msg) { appendLine(`(OK) ${msg}`, 'ok'); }
  function writeWRN(msg) { appendLine(`(WRN) ${msg}`, 'wrn'); }
  function writeERR(msg) { appendLine(`(ERR) ${msg}`, 'err'); }
  function writeSEP(msg) { appendLine(msg || '----------------------------------------', 'sep'); }

  function scrollToBottom() {
    state.top = Math.max(0, state.outputLines.length - state.pageSize);
  }

  function renderOutput() {
    if (!dom.out) return;
    const end = Math.min(state.outputLines.length, state.top + state.pageSize);
    const chunk = state.outputLines.slice(state.top, end);
    dom.out.innerHTML = chunk.join('\n');
  }

  function renderAll() {
    renderContext();
    renderOutput();
  }

  async function fetchText(path) {
    const url = withBase(state.basePath, path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  }

  async function fetchJson(path) {
    return JSON.parse(await fetchText(path));
  }

  async function ensureEvents() {
    if (state.events) return state.events;
    const text = await fetchText('data/current/events.ndjson');
    state.events = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    return state.events;
  }

  async function ensureStoriesIndex() {
    if (state.storiesIndex) return state.storiesIndex;
    state.storiesIndex = await fetchJson('data/current/stories/index.json');
    return state.storiesIndex;
  }

  async function ensurePersons() {
    if (state.persons) return state.persons;
    const text = await fetchText('data/current/entities/persons.ndjson');
    state.persons = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    return state.persons;
  }

  async function ensureFamilies() {
    if (state.families) return state.families;
    const text = await fetchText('data/current/entities/families.ndjson');
    state.families = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    return state.families;
  }

  function printHelp() {
    writeSEP('================ GN370 HELP ================' );
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
      'show card',
      'clear'
    ].forEach((x) => appendLine(`  ${x}`));
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
  }

  function printMenu() {
    writeSEP('=============== MAIN MENU ==================' );
    [
      '1) feed last 10',
      '2) story list',
      '3) story play SAMPLE',
      '4) open person P0000001',
      '5) open xref @I123@',
      '6) rm help',
      '7) show card'
    ].forEach((x) => appendLine(`  ${x}`));
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
  }

  async function cmdFeed(pc) {
    const events = await ensureEvents();
    const params = {
      last: 20,
      type: pc.opts.type || null,
      since: pc.opts.since || null,
      entity: pc.opts.entity || null,
      id: pc.opts.id || null
    };
    if (pc.args[0] && pc.args[0].toLowerCase() === 'last' && pc.args[1]) params.last = Number(pc.args[1]);
    if (pc.opts.last) params.last = Number(pc.opts.last);

    const rows = filterFeed(events, params);
    writeSEP(`============= FEED (${rows.length}) =============`);
    rows.forEach((e) => {
      appendLine(`${e.ts} | ${e.type} | ${e.entity}:${e.id} | ${e.title}`);
    });
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
    writeOK(`FEED READY ${rows.length} ROWS`);
  }

  async function cmdStoryList() {
    const idx = await ensureStoriesIndex();
    const stories = idx.stories || [];
    writeSEP('=============== STORY LIST ==================' );
    stories.forEach((s) => {
      appendLine(`${s.id} | ${s.title} | ${s.period} | tags:${(s.tags || []).join(',')}`);
    });
    writeSEP('============================================');
    scrollToBottom();
    renderOutput();
    writeOK(`STORIES ${stories.length}`);
  }

  async function cmdStoryOpen(id) {
    if (!id) {
      writeERR('story open <storyId> MISSING');
      renderOutput();
      return;
    }
    const idx = await ensureStoriesIndex();
    const s = (idx.stories || []).find((x) => String(x.id).toUpperCase() === String(id).toUpperCase());
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
    if (!id) {
      writeERR('story play <storyId> MISSING');
      renderOutput();
      return;
    }
    const file = `data/current/stories/${id}.story`;
    const txt = await fetchText(file);
    const scenes = parseStoryScenes(txt);
    pushState();
    setContext('story', id, id, { file, scenes: scenes.length });
    writeSEP(`========== STORY PLAY ${id} ==========`);
    scenes.forEach((sc, idx) => {
      appendLine(`SCENE ${idx + 1}: ${sc.title}`);
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
    if (!id) {
      writeERR('open person <id> MISSING');
      renderOutput();
      return;
    }
    const persons = await ensurePersons();
    const fallback = await fetchJson('data/current/entities/sample_person.json');
    const needle = String(id).toLowerCase();
    let data = persons.find((p) => String(p.id || '').toLowerCase() === needle);
    let used = 'data/current/entities/persons.ndjson';
    if (!data) {
      data = fallback;
      used = 'data/current/entities/sample_person.json';
      writeWRN(`PERSON NOT FOUND, USING SAMPLE (${used})`);
    }
    pushState();
    setContext('person', data.id || id, `${data.name || `${data.family_name || ''} ${data.given_names || ''}`}`.trim(), data);
    writeOK(`PERSON OPENED ${data.id || id}`);
    appendLine(`SOURCE: ${used}`);
    scrollToBottom();
    renderOutput();
  }

  async function cmdOpenXref(xref) {
    if (!xref) {
      writeERR('open xref <@I123@> MISSING');
      renderOutput();
      return;
    }
    const persons = await ensurePersons();
    const needle = String(xref).toUpperCase();
    const p = persons.find((r) => String(r.xref || '').toUpperCase() === needle);
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

  function cmdRmHelp() {
    writeSEP('=============== ROOTSMAGIC BRIDGE ===============');
    appendLine('(OK) Export GEDCOM from RootsMagic after TreeShare sync');
    appendLine('(OK) Copy file to data/in/rootsmagic.ged');
    appendLine('(OK) Run batch: tools\\\\rootsmagic\\\\rm_import.cmd');
    appendLine('(OK) Back in shell: refresh -> feed last 20');
    writeSEP('=================================================');
    scrollToBottom();
    renderOutput();
  }

  function cmdRmImport() {
    writeWRN('RM IMPORT cannot execute in browser static mode.');
    appendLine('Run offline: tools\\\\rootsmagic\\\\rm_import.cmd \"data\\\\in\\\\rootsmagic.ged\"');
    appendLine('Then execute: refresh | feed last 20');
    scrollToBottom();
    renderOutput();
  }

  function cmdShowCard() {
    if (!state.current) {
      writeWRN('NO CURRENT CONTEXT');
      renderOutput();
      return;
    }
    writeSEP(`=============== CARD ${state.current.kind.toUpperCase()} ===============`);
    const data = state.current.data || {};
    Object.keys(data).forEach((k) => appendLine(`${k}: ${JSON.stringify(data[k])}`));
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

  async function execute(raw) {
    const pc = parseCommand(raw);
    if (!pc.cmd) return;

    const alias = {
      h: 'help',
      m: 'menu',
      b: 'back',
      r: 'refresh'
    };
    const cmd = alias[pc.cmd] || pc.cmd;

    state.lastCommand = raw;
    dom.last.textContent = `LAST: ${state.lastCommand}`;

    if (state.history[state.history.length - 1] !== raw) {
      state.history.push(raw);
      if (state.history.length > 80) state.history.shift();
      localStorage.setItem('gn370_history', JSON.stringify(state.history));
    }
    state.historyPos = state.history.length;

    try {
      if (cmd === 'help') {
        printHelp();
      } else if (cmd === 'menu') {
        printMenu();
      } else if (cmd === 'back') {
        popState();
      } else if (cmd === 'refresh') {
        if (state.lastCommand && state.lastCommand.toLowerCase() !== 'refresh') {
          await execute(state.lastCommand);
        } else {
          writeWRN('NOTHING TO REFRESH');
          renderOutput();
        }
      } else if (cmd === 'feed') {
        await cmdFeed(pc);
      } else if (cmd === 'story' && (pc.args[0] || '').toLowerCase() === 'list') {
        await cmdStoryList();
      } else if (cmd === 'story' && (pc.args[0] || '').toLowerCase() === 'open') {
        await cmdStoryOpen(pc.args[1]);
      } else if (cmd === 'story' && (pc.args[0] || '').toLowerCase() === 'play') {
        await cmdStoryPlay(pc.args[1]);
      } else if (cmd === 'open' && (pc.args[0] || '').toLowerCase() === 'person') {
        await cmdOpenPerson(pc.args[1]);
      } else if (cmd === 'open' && (pc.args[0] || '').toLowerCase() === 'xref') {
        await cmdOpenXref(pc.args[1]);
      } else if (cmd === 'rm' && (pc.args[0] || '').toLowerCase() === 'help') {
        cmdRmHelp();
      } else if (cmd === 'rm' && (pc.args[0] || '').toLowerCase() === 'import') {
        cmdRmImport();
      } else if (cmd === 'show' && (pc.args[0] || '').toLowerCase() === 'card') {
        cmdShowCard();
      } else if (cmd === 'clear') {
        cmdClear();
      } else {
        writeERR(`UNKNOWN COMMAND: ${raw}`);
        renderOutput();
      }
    } catch (e) {
      writeERR(e.message || String(e));
      renderOutput();
    }
  }

  function movePage(delta) {
    state.top = Math.max(0, Math.min(Math.max(0, state.outputLines.length - state.pageSize), state.top + delta));
    renderOutput();
  }

  function bindUi() {
    if (!hasUi) return;
    dom.run.addEventListener('click', async function () {
      const v = dom.cmd.value.trim();
      dom.cmd.value = '';
      if (v) await execute(v);
      dom.cmd.focus();
    });

    dom.cmd.addEventListener('keydown', async function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        dom.run.click();
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

    dom.out.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      movePage(ev.deltaY > 0 ? 3 : -3);
    }, { passive: false });

    document.addEventListener('keydown', async function (ev) {
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

  function boot() {
    if (!hasUi) return;
    renderHeader();
    renderContext();
    printMenu();
    writeOK('GN370 SHELL READY');
    scrollToBottom();
    renderOutput();
    bindUi();
    dom.cmd.focus();
    setInterval(renderHeader, 1000);
  }

  window.GN370 = {
    getBasePath,
    withBase,
    tokenize,
    parseOptions,
    parseCommand,
    filterFeed,
    parseStoryScenes,
    _state: state,
    execute
  };

  boot();
})();
