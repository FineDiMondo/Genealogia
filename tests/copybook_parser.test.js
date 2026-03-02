(function () {
  'use strict';
  const T = window.__GN370_TEST__;
  const C = window.GNCopybook;

  T.test('copybook parser reads PIC X/9 and computes total length', function () {
    const cpy = [
      '01 PERSON-REC.',
      '  05 PERSON-ID PIC X(16).',
      '  05 FULL-NAME PIC X(64).',
      '  05 CHILD-COUNT PIC 9(3).'
    ].join('\n');
    const parsed = C.parseCopybook(cpy, { copyName: 'PERSON.CPY' });
    T.assert(parsed.fields.length === 3, 'field count');
    T.assert(parsed.totalLength === 83, 'total length');
    T.assert(parsed.fields[0].start === 1 && parsed.fields[0].end === 16, 'offset 1');
    T.assert(parsed.fields[2].numeric === true, 'numeric PIC 9');
  });
})();
