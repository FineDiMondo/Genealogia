import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = process.cwd();
const srcScripts = [
  'src/copybook/copybook_parser.js',
  'src/copybook/record_parser.js',
  'src/copybook/record_renderer_370.js',
  'assets/gn370.js'
];

const testsDir = path.join(root, 'tests');
const testScripts = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join('tests', f));

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://127.0.0.1/index.html',
  runScripts: 'outside-only'
});

const { window } = dom;

function runScript(relPath) {
  const abs = path.join(root, relPath);
  const code = fs.readFileSync(abs, 'utf8');
  window.eval(`${code}\n//# sourceURL=${abs.replace(/\\/g, '/')}`);
}

const results = [];
window.__GN370_TEST__ = {
  test(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, err: e?.message || String(e) });
    }
  },
  assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assert failed');
  }
};

for (const rel of srcScripts) runScript(rel);
for (const rel of testScripts) runScript(rel);

let fails = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`[PASS] ${r.name}`);
  } else {
    fails += 1;
    console.log(`[FAIL] ${r.name} -> ${r.err}`);
  }
}
console.log('----------------------------------------');
console.log(`TOTAL ${results.length}  FAIL ${fails}`);

process.exitCode = fails > 0 ? 1 : 0;