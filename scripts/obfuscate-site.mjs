import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'dist', 'assets');

const options = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  stringArray: true,
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  stringArrayEncoding: ['base64'],
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  simplify: true,
  renameGlobals: false,
  transformObjectKeys: false,
  numbersToExpressions: false,
  unicodeEscapeSequence: false,
};

const files = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
if (files.length === 0) {
  console.log('No JS assets found in dist/assets');
  process.exit(1);
}

let totalIn = 0;
let totalOut = 0;
for (const name of files) {
  const file = join(assetsDir, name);
  const source = readFileSync(file, 'utf8');
  const obfuscated = JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode();
  writeFileSync(file, obfuscated, 'utf8');
  totalIn += source.length;
  totalOut += obfuscated.length;
  console.log(`OBFUSCATED ${name}: ${source.length} -> ${obfuscated.length} bytes`);
}

console.log(`Site obfuscation done: ${totalIn} -> ${totalOut} bytes total.`);
