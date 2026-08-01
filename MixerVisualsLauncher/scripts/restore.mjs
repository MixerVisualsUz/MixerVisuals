import { copyFileSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['main.js', 'preload.js'];

for (const name of targets) {
  const file = join(root, name);
  const bak = file + '.bak';
  if (existsSync(bak)) {
    copyFileSync(bak, file);
    unlinkSync(bak);
    console.log(`RESTORED ${name}`);
  }
}

console.log('Restore done.');
