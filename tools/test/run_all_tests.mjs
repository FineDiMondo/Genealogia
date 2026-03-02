import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');

function run(cmd, args, opts = {}) {
  const p = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...opts
  });
  return p.status ?? 1;
}

function hasCmd(command) {
  const check = process.platform === 'win32' ? 'where' : 'which';
  const out = spawnSync(check, [command], { stdio: 'ignore' });
  return (out.status ?? 1) === 0;
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

console.log('== STEP 1: JavaScript tests ==');
let rc = run(process.execPath, [path.join(root, 'tools', 'test', 'run_js_tests.mjs')]);
if (rc !== 0) process.exit(rc);

console.log('== STEP 2: DB migration tests ==');
rc = run('python', [path.join(root, 'tools', 'test', 'test_db_migration.py')], { shell: true });
if (rc !== 0) process.exit(rc);

console.log('== STEP 3: DB trigger integrity tests ==');
rc = run('python', [path.join(root, 'tests', 'schema', 'test_integrity_triggers.py')], { shell: true });
if (rc !== 0) process.exit(rc);

console.log('== STEP 4: COBOL tests (conditional) ==');
if (process.platform !== 'win32') {
  console.log('SKIP: COBOL tests require Windows PowerShell environment.');
  process.exit(0);
}

const requiredData = ['data/PERSONE.DAT', 'data/FAMIGLIE.DAT', 'data/EVENTI.DAT'];
const missingData = requiredData.filter((p) => !fileExists(p));
if (missingData.length > 0) {
  console.log(`SKIP: missing COBOL data files -> ${missingData.join(', ')}`);
  process.exit(0);
}

if (!hasCmd('cobc')) {
  console.log('SKIP: cobc not found in PATH.');
  process.exit(0);
}

const psExe = hasCmd('powershell') ? 'powershell' : (hasCmd('pwsh') ? 'pwsh' : null);
if (!psExe) {
  console.log('SKIP: PowerShell executable not available.');
  process.exit(0);
}

rc = run(psExe, ['-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'cobol', 'test.ps1')]);
process.exit(rc);
