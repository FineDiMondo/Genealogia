import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const fixtures = {
  'PERSONE.DAT': [
    '# fixture generated for COBOL smoke tests',
    'P0000001|Mario Rossi|M|1950-01-01|Roma',
    'P0000002|Anna Bianchi|F|1955-02-10|Milano',
    'P0000003|Luca Verdi|M|1980-07-21|Torino'
  ],
  'FAMIGLIE.DAT': [
    '# fixture generated for COBOL smoke tests',
    'F0000001|P0000001|P0000002|1975-06-12|Roma'
  ],
  'EVENTI.DAT': [
    '# fixture generated for COBOL smoke tests',
    'E0000001|BIRT|P0000001|1950-01-01|Roma',
    'E0000002|MARR|F0000001|1975-06-12|Roma'
  ]
};

for (const [file, lines] of Object.entries(fixtures)) {
  const abs = path.join(dataDir, file);
  fs.writeFileSync(abs, `${lines.join('\n')}\n`, 'utf8');
  console.log(`WROTE ${path.relative(root, abs)}`);
}