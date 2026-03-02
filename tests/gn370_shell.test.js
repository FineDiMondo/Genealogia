(function () {
  'use strict';
  const T = window.__GN370_TEST__;
  const G = window.GN370;

  T.test('parseCommand tokenizes quotes', function () {
    const p = G.parseCommand('open person "P0000001" /type "person.updated"');
    T.assert(p.cmd === 'open', 'cmd');
    T.assert(p.args[0] === 'person', 'arg0');
    T.assert(p.args[1] === 'P0000001', 'quoted arg');
    T.assert(p.opts.type === 'person.updated', 'quoted option');
  });

  T.test('parseOptions handles /type /last /since', function () {
    const p = G.parseCommand('feed /type person.updated /last 5 /since 2026-03-01');
    T.assert(p.opts.type === 'person.updated', 'type');
    T.assert(p.opts.last === '5', 'last');
    T.assert(p.opts.since === '2026-03-01', 'since');
  });

  T.test('filterFeed applies type and last', function () {
    const events = [
      { ts: '2026-03-01T00:00:00Z', type: 'person.updated', entity: 'person', id: 'P1', title: 'a' },
      { ts: '2026-03-02T00:00:00Z', type: 'story.published', entity: 'story', id: 'S1', title: 'b' },
      { ts: '2026-03-03T00:00:00Z', type: 'person.updated', entity: 'person', id: 'P2', title: 'c' }
    ];
    const out = G.filterFeed(events, { type: 'person.updated', last: 1 });
    T.assert(out.length === 1, 'length');
    T.assert(out[0].id === 'P2', 'latest retained');
  });

  T.test('getBasePath detects /Genealogia/', function () {
    T.assert(G.getBasePath('/Genealogia/index.html') === '/Genealogia', 'pages base');
    T.assert(G.getBasePath('/index.html') === '', 'local base');
  });

  T.test('parseStoryScenes segments by # title', function () {
    const s = '# One\nA\n# Two\nB\nC';
    const scenes = G.parseStoryScenes(s);
    T.assert(scenes.length === 2, 'scene count');
    T.assert(scenes[0].title === 'One', 'scene 1');
    T.assert(scenes[1].lines.length === 2, 'scene 2 lines');
  });

})();
