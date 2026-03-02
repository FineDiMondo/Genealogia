(function () {
  'use strict';
  const T = window.__GN370_TEST__;

  T.test('gedcom fixture contains INDI and FAM blocks', function () {
    const fixture = [
      '0 @I1@ INDI',
      '1 NAME Mario /Rossi/',
      '0 @F1@ FAM',
      '1 HUSB @I1@'
    ].join('\n');
    T.assert(fixture.includes(' INDI'), 'INDI marker');
    T.assert(fixture.includes(' FAM'), 'FAM marker');
  });
})();
