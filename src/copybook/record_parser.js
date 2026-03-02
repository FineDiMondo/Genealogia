(function () {
  'use strict';

  function rtrim(v) {
    return String(v || '').replace(/\s+$/, '');
  }

  function stripTrailingNewline(v) {
    return String(v || '').replace(/(\r?\n)+$/, '');
  }

  function parseRecord(copySchema, rawText) {
    if (!copySchema || !Array.isArray(copySchema.fields)) {
      return {
        isValid: false,
        expectedLength: 0,
        actualLength: 0,
        values: {},
        errors: ['Invalid copybook schema'],
        warnings: []
      };
    }

    const errors = [];
    const warnings = [];
    const expected = Number(copySchema.totalLength) || 0;
    const source = stripTrailingNewline(rawText);
    const actual = source.length;

    if (actual < expected) {
      errors.push('record truncated: expected ' + expected + ' got ' + actual);
    } else if (actual > expected) {
      warnings.push('extra bytes ignored: expected ' + expected + ' got ' + actual);
    }

    const fixed = (actual >= expected ? source.slice(0, expected) : source.padEnd(expected, ' '));
    const values = {};

    copySchema.fields.forEach(function (f) {
      const seg = fixed.slice(f.offset, f.offset + f.length);
      if (f.occurs > 1) {
        const arr = [];
        for (let i = 0; i < f.occurs; i += 1) {
          const item = seg.slice(i * f.itemLength, (i + 1) * f.itemLength);
          arr.push(f.numeric ? item : rtrim(item));
          if (f.numeric && /[^0-9 ]/.test(item)) {
            errors.push('numeric field invalid chars: ' + f.name + '[' + i + ']');
          }
        }
        values[f.name] = arr;
      } else {
        if (f.numeric && /[^0-9 ]/.test(seg)) {
          errors.push('numeric field invalid chars: ' + f.name);
        }
        values[f.name] = f.numeric ? seg : rtrim(seg);
      }
    });

    return {
      isValid: errors.length === 0,
      expectedLength: expected,
      actualLength: actual,
      values: values,
      errors: errors,
      warnings: warnings
    };
  }

  window.GNRecord = {
    parseRecord: parseRecord,
    rtrim: rtrim,
    stripTrailingNewline: stripTrailingNewline
  };
})();
