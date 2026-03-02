(function () {
  'use strict';
  const T = window.__GN370_TEST__;
  const C = window.GNCopybook;
  const R = window.GNRecord;

  function pad(v, n) {
    return String(v).padEnd(n, ' ').slice(0, n);
  }

  T.test('record parser validates fixed-length record', function () {
    const copy = C.parseCopybook([
      '01 EVENT-REC.',
      '  05 EVENT-ID PIC X(8).',
      '  05 CONF PIC 9(3).',
      '  05 NOTE PIC X(10).'
    ].join('\n'), { copyName: 'EVENT.CPY' });
    const rec = pad('E0000001', 8) + pad('095', 3) + pad('OK', 10);
    const out = R.parseRecord(copy, rec);
    T.assert(out.isValid === true, 'valid record');
    T.assert(out.expectedLength === 21, 'len');
    T.assert(out.values['EVENT-ID'].trim() === 'E0000001', 'id');
  });

  T.test('record parser flags truncation', function () {
    const copy = C.parseCopybook([
      '01 X.',
      '  05 A PIC X(4).',
      '  05 B PIC X(4).'
    ].join('\n'));
    const out = R.parseRecord(copy, 'ABC');
    T.assert(out.isValid === false, 'invalid');
    T.assert(out.errors.length > 0, 'errors present');
  });
})();
