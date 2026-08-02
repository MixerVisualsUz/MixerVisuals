const path = require('path');
const fs = require('fs');
const { Client } = require('minecraft-launcher-core');

const DATA_DIR = path.join(process.env.APPDATA, 'mixer-visuals-launcher', 'MixerVisualsData');
const MC_DIR = path.join(DATA_DIR, 'minecraft');
const JAVA = path.join(__dirname, 'java21', 'bin', 'java.exe');
const LOG = path.join(DATA_DIR, 'test-mirror.log');
const VERSIONS_DIR = path.join(MC_DIR, 'versions');
const MC_VERSION = '1.21.4';
const PROFILE_ID = 'fabric-loader-0.19.3-1.21.4';
const BMCLAPI = 'https://bmclapi2.bangbang93.com';

function log(...a) {
  const s = a.map(String).join(' ');
  console.log(s);
  try { fs.appendFileSync(LOG, `[${new Date().toLocaleTimeString()}] ${s}\n`); } catch (e) {}
}

if (!fs.existsSync(JAVA)) { log('JAVA NOT FOUND: ' + JAVA); process.exit(1); }

const srcPath = path.join(VERSIONS_DIR, MC_VERSION, `${MC_VERSION}.json`);
if (!fs.existsSync(srcPath)) { log('VERSION JSON NOT FOUND: ' + srcPath); process.exit(1); }
const patchedPath = path.join(VERSIONS_DIR, `${MC_VERSION}.patched.json`);
const raw = fs.readFileSync(srcPath, 'utf8');
const out = raw
  .replace(/https:\/\/piston-data\.mojang\.com/g, BMCLAPI)
  .replace(/https:\/\/launcher\.mojang\.com/g, BMCLAPI)
  .replace(/https:\/\/libraries\.minecraft\.net/g, `${BMCLAPI}/libraries`);
fs.writeFileSync(patchedPath, out);
const pistons = (out.match(/mojang\.com/g) || []).length;
log('patched json written:', patchedPath, 'remaining mojang.com refs:', pistons);

const opts = {
  authorization: { access_token: '0', client_token: '0', uuid: 'Muxammaddin', name: 'Muxammaddin', meta: { type: 'offline' } },
  root: MC_DIR,
  version: { number: MC_VERSION, id: PROFILE_ID, type: 'release', custom: PROFILE_ID },
  memory: { max: '4096', min: '1024' },
  javaPath: JAVA,
  window: { width: 1280, height: 720, fullscreen: false },
  overrides: {
    detached: false,
    hideWindow: false,
    cwd: MC_DIR,
    versionJson: patchedPath,
    url: { resource: `${BMCLAPI}/assets` },
  },
};

log('=== MIRROR TEST START ===');
const client = new Client();
let spawned = false;

client.on('debug', (e) => {
  if (String(e).includes('Launching with arguments')) {
    spawned = true;
    log('GAME SPAWNED, args:', String(e).slice(0, 600));
  } else {
    log('debug:', String(e).slice(0, 200));
  }
});
client.on('data', (e) => log('MC:', String(e).trim().split('\n').slice(-3).join(' | ')));
client.on('progress', (e) => log('progress:', JSON.stringify(e)));
client.on('error', (e) => { log('ERROR:', e && e.message); process.exit(1); });
client.on('close', (code) => {
  log('=== GAME CLOSED, exit code =', code, ', spawned =', spawned);
  process.exit(0);
});

client.launch(opts).then(() => log('launch() resolved')).catch((e) => { log('LAUNCH FAIL:', e && e.message); process.exit(1); });

setTimeout(() => {
  if (spawned) {
    log('spawned confirmed, killing java after grace period');
    try { require('child_process').execSync('taskkill /IM java.exe /F 2>NUL'); } catch (e) {}
    setTimeout(() => process.exit(0), 3000);
  } else {
    log('TIMEOUT: not spawned in 75 min');
    process.exit(2);
  }
}, 75 * 60 * 1000);
