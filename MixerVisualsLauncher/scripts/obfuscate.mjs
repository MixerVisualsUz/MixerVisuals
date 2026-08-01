import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = ['main.js', 'preload.js'];

const options = {
  compact: true,
  identifierNamesGenerator: 'hexadecimal',
  stringArray: true,
  stringArrayThreshold: 0.8,
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

for (const name of targets) {
  const file = join(root, name);
  const bak = file + '.bak';
  if (!existsSync(file)) {
    console.log(`SKIP ${name}: not found`);
    continue;
  }
  if (existsSync(bak)) {
    copyFileSync(bak, file);
  }
  copyFileSync(file, bak);
  const source = readFileSync(file, 'utf8');
  const obfuscated = JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode();
  writeFileSync(file, obfuscated, 'utf8');
  console.log(`OBFUSCATED ${name}: ${source.length} -> ${obfuscated.length} bytes`);
}

console.log('Launcher obfuscation done.');
