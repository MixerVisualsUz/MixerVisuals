const path = require('path');
const fs = require('fs');
const { Client } = require('minecraft-launcher-core');

const DATA_DIR = path.join(process.env.APPDATA, 'mixer-visuals-launcher', 'MixerVisualsData');
const MC_DIR = path.join(DATA_DIR, 'minecraft');
const JAVA = path.join(__dirname, 'java21', 'bin', 'java.exe');
const MODS = path.join(MC_DIR, 'mods');
const QP_LOG = path.join(DATA_DIR, 'test-quickplay.log');
const CRASH_DIR = path.join(MC_DIR, 'crash-reports');
const NEW_JAR = path.join(__dirname, 'MixerVisuals.jar');
const PROFILE_ID = 'fabric-loader-0.19.3-1.21.4';

function log(...a) {
  const s = a.map(String).join(' ');
  console.log(s);
  try { fs.appendFileSync(QP_LOG, `[${new Date().toLocaleTimeString()}] ${s}\n`); } catch (e) {}
}

if (!fs.existsSync(JAVA)) { console.log('JAVA NOT FOUND: ' + JAVA); process.exit(1); }

fs.readdirSync(MODS).filter(f => f.startsWith('MixerVisuals')).forEach(f => {
  log('deleting old mod jar:', f);
  fs.unlinkSync(path.join(MODS, f));
});
fs.copyFileSync(NEW_JAR, path.join(MODS, 'ml-utils-fabric-1.4.jar'));
log('deployed ml-utils-fabric-1.4.jar:', fs.statSync(path.join(MODS, 'ml-utils-fabric-1.4.jar')).size, 'bytes');

const beforeCrash = fs.existsSync(CRASH_DIR) ? fs.readdirSync(CRASH_DIR).filter(f => f.startsWith('crash-')) : [];
const beforeHs = fs.readdirSync(MC_DIR).filter(f => f.startsWith('hs_err'));

const opts = {
  authorization: { access_token: '0', client_token: '0', uuid: 'Muxammaddin', name: 'Muxammaddin', meta: { type: 'offline' } },
  root: MC_DIR,
  version: { number: '1.21.4', id: PROFILE_ID, type: 'release', custom: PROFILE_ID },
  memory: { max: '8192', min: '1024' },
  javaPath: JAVA,
  window: { width: 1280, height: 720, fullscreen: false },
  overrides: { detached: false, hideWindow: false, cwd: MC_DIR },
  quickPlay: { type: 'singleplayer', identifier: 'New World' },
};

log('=== TEST START ===');
log('world: New World, ram: 8192');
const client = new Client();
let spawnTime = null;

client.on('debug', (e) => { if (String(e).includes('Launching with arguments')) { spawnTime = Date.now(); log('GAME SPAWNED, args:', String(e).slice(0, 500)); } });
client.on('data', (e) => log('MC:', String(e).trim().split('\n').slice(-3).join(' | ')));
client.on('progress', (e) => { if (e.type === 'percentage' && e.task === 'mojang-download') log('progress:', e.percent + '%'); });
client.on('error', (e) => { log('ERROR:', e && e.message); process.exit(1); });
client.on('close', (code) => {
  log('=== GAME CLOSED, exit code =', code, ', uptime =', spawnTime ? ((Date.now() - spawnTime) / 1000).toFixed(1) + 's' : 'unknown');
  checkReports();
  process.exit(0);
});

function checkReports() {
  const nowCrash = fs.existsSync(CRASH_DIR) ? fs.readdirSync(CRASH_DIR).filter(f => f.startsWith('crash-')) : [];
  const nowHs = fs.readdirSync(MC_DIR).filter(f => f.startsWith('hs_err'));
  const newCrash = nowCrash.filter(f => !beforeCrash.includes(f));
  const newHs = nowHs.filter(f => !beforeHs.includes(f));
  if (newCrash.length) { log('NEW CRASH REPORT:', newCrash.join(', ')); log(fs.readFileSync(path.join(CRASH_DIR, newCrash[0]), 'utf8').split('\n').slice(0, 12).join('\n')); }
  if (newHs.length) { log('NEW HS_ERR:', newHs.join(', ')); log(fs.readFileSync(path.join(MC_DIR, newHs[0]), 'utf8').split('\n').slice(0, 12).join('\n')); }
  if (!newCrash.length && !newHs.length) log('NO crash report, NO hs_err (clean or external kill)');
}

client.launch(opts).then(() => log('launch() resolved')).catch((e) => { log('LAUNCH FAIL:', e && e.message); process.exit(1); });
