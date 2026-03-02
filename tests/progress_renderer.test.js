(function () {
  'use strict';
  const T = window.__GN370_TEST__;
  const G = window.GN370;
  const RR = window.GNRender370;

  T.test('progress renderer builds 24-char bar and percent', function () {
    const line = RR.makeBar(25, 50, 'PARSE_RECORDS', 'PERSON');
    T.assert(line.includes(' 50%') || line.includes('  50%') || line.includes(' 50%  '), 'percent 50');
    const m = line.match(/\[([#-]{24})\]/);
    T.assert(Boolean(m), 'bar length 24');
  });

  T.test('GN370 progressLine proxies renderer', function () {
    const line = G.progressLine(1, 4, 'LOAD', 'COPY');
    T.assert(line.includes('LOAD'), 'contains step');
    T.assert(line.includes('(1/4)'), 'contains counter');
  });
})();
