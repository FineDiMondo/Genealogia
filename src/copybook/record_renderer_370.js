(function () {
  'use strict';

  function padRight(v, n) {
    const s = String(v || '');
    if (s.length >= n) return s;
    return s + ' '.repeat(n - s.length);
  }

  function makeBar(current, total, step, detail) {
    const width = 24;
    const t = Math.max(0, Number(total) || 0);
    const c = Math.max(0, Math.min(t, Number(current) || 0));
    const pct = t > 0 ? Math.round((c * 100) / t) : 0;
    const fill = Math.round((pct * width) / 100);
    const bar = '#'.repeat(fill) + '-'.repeat(width - fill);
    const d = detail ? '  ' + detail : '';
    return '[' + bar + ']  ' + String(pct).padStart(3, ' ') + '%  ' + (step || 'RUN') + '  (' + c + '/' + t + ')' + d;
  }

  function renderCopy(copy, type, copyPath) {
    const title = (type || 'COPY') + '  TOTAL LEN:' + (copy.totalLength || 0) + '  SRC:' + (copyPath || '-');
    const out = [];
    out.push('------------------------------------------------------------');
    out.push(title);
    out.push('------------------------------------------------------------');
    out.push('FIELD                 OFFSET   LEN   PIC');
    (copy.fields || []).forEach(function (f) {
      out.push(
        padRight(f.name, 20) + ' ' +
        String(f.start).padStart(6, ' ') + ' ' +
        String(f.length).padStart(5, ' ') + ' ' +
        f.pic
      );
    });
    out.push('------------------------------------------------------------');
    return out;
  }

  function renderRecord(type, id, copy, parsed, copyPath) {
    const out = [];
    out.push('------------------------------------------------------------');
    out.push((type || 'RECORD') + ' RECORD  ID:' + (id || '-') + '  LEN:' + parsed.expectedLength + '  COPY:' + (copyPath || '-'));
    out.push('------------------------------------------------------------');
    (copy.fields || []).forEach(function (f) {
      const val = parsed.values[f.name];
      const shown = Array.isArray(val) ? val.join(' | ') : val;
      out.push(padRight(f.name, 14) + ' : ' + String(shown || ''));
    });
    if (parsed.warnings && parsed.warnings.length) {
      out.push('------------------------------------------------------------');
      parsed.warnings.forEach(function (w) { out.push('(WRN) ' + w); });
    }
    if (parsed.errors && parsed.errors.length) {
      out.push('------------------------------------------------------------');
      parsed.errors.forEach(function (e) { out.push('(ERR) ' + e); });
    }
    out.push('------------------------------------------------------------');
    return out;
  }

  window.GNRender370 = {
    makeBar: makeBar,
    renderCopy: renderCopy,
    renderRecord: renderRecord
  };
})();
