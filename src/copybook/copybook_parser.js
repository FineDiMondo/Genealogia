(function () {
  'use strict';

  function toKey(name) {
    return String(name || '')
      .trim()
      .toLowerCase()
      .replace(/-+/g, '_');
  }

  function parsePic(line) {
    const m = String(line).match(/\bPIC\s+([X9])\s*\(\s*(\d+)\s*\)/i);
    if (!m) return null;
    return {
      type: m[1].toUpperCase(),
      length: Number(m[2]) || 0
    };
  }

  function parseCopybook(text, opts) {
    const src = String(text || '').replace(/\r\n/g, '\n');
    const lines = src.split('\n');
    const fields = [];
    let recordName = '';
    let offset = 0;

    lines.forEach(function (line, idx) {
      const clean = line.replace(/\s+\*.*$/, '').trim();
      if (!clean) return;
      if (/^(\*>|\*)/.test(clean)) return;

      const lm = clean.match(/^(\d{2})\s+([A-Z0-9-]+)\b/i);
      if (!lm) return;
      const level = Number(lm[1]);
      const name = lm[2].toUpperCase();

      if (level === 1) {
        recordName = name;
        return;
      }
      if (level !== 5) return;
      if (/\bREDEFINES\b/i.test(clean)) return;

      const pic = parsePic(clean);
      if (!pic || !pic.length) return;
      const om = clean.match(/\bOCCURS\s+(\d+)\b/i);
      const occurs = om ? Math.max(1, Number(om[1]) || 1) : 1;
      const totalLen = pic.length * occurs;

      fields.push({
        name: name,
        key: toKey(name),
        level: level,
        line: idx + 1,
        pic: 'PIC ' + pic.type + '(' + pic.length + ')',
        picType: pic.type,
        numeric: pic.type === '9',
        itemLength: pic.length,
        occurs: occurs,
        length: totalLen,
        offset: offset,
        start: offset + 1,
        end: offset + totalLen
      });
      offset += totalLen;
    });

    return {
      copyName: (opts && opts.copyName) || null,
      recordName: recordName || ((opts && opts.copyName) || 'REC'),
      fields: fields,
      totalLength: offset
    };
  }

  window.GNCopybook = {
    toKey: toKey,
    parseCopybook: parseCopybook
  };
})();
