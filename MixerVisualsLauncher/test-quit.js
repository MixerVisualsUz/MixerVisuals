const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { Client } = require('minecraft-launcher-core');

const DATA_DIR = path.join(process.env.APPDATA, 'mixer-visuals-launcher', 'MixerVisualsData');
const MC_DIR = path.join(DATA_DIR, 'minecraft');
const JAVA = path.join(__dirname, 'java21', 'bin', 'java.exe');
const LOG = path.join(DATA_DIR, 'test-quit.log');
const VERSIONS_DIR = path.join(MC_DIR, 'versions');
const MC_VERSION = '1.21.4';
const PROFILE_ID = 'fabric-loader-0.19.3-1.21.4';
const BMCLAPI = 'https://bmclapi2.bangbang93.com';

function log(...a) {
  const s = a.map(String).join(' ');
  console.log(s);
  try { fs.appendFileSync(LOG, `[${new Date().toLocaleTimeString()}] ${s}\n`); } catch (e) {}
}

let gameProcess = null;
let quitTriggered = false;
let fallbackTimer = null;
const originalSpawn = childProcess.spawn;
childProcess.spawn = function (...args) {
  const exe = String(args[0] || '').toLowerCase();
  const spawnArgs = args[1] && args[1].join ? args[1].join(' ') : '';
  const isGameLaunch = exe.includes('java') && spawnArgs.includes('net.fabricmc');
  if (isGameLaunch) {
    args[2] = Object.assign({}, args[2], { detached: true });
  }
  const proc = originalSpawn.apply(this, args);
  if (isGameLaunch) {
    gameProcess = proc;
    log('PATCH: game spawn intercepted, pid =', proc.pid);
    proc.once('spawn', () => {
      log('PATCH: GAME PROC spawned event, pid =', proc.pid);
      fallbackTimer = setTimeout(() => { log('FALLBACK TIMER fired (75s)'); }, 75000);
    });
    proc.once('exit', (code, signal) => {
      log('PATCH: GAME PROC exit, code =', code, ', signal =', signal);
    });
  }
  return proc;
};

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
log('patched json written');

const opts = {
  authorization: { access_token: '0', client_token: '0', uuid: 'Muxammaddin', name: 'Muxammaddin', meta: { type: 'offline' } },
  root: MC_DIR,
  version: { number: MC_VERSION, id: PROFILE_ID, type: 'release', custom: PROFILE_ID },
  memory: { max: '4096', min: '1024' },
  javaPath: JAVA,
  window: { width: 1280, height: 720, fullscreen: false },
  overrides: {
    detached: true,
    hideWindow: false,
    cwd: MC_DIR,
    versionJson: patchedPath,
    url: { resource: `${BMCLAPI}/assets` },
  },
};

log('=== QUIT-LOGIC TEST START ===');
const client = new Client();
let markersSeen = [];

client.on('debug', (e) => {
  const s = String(e);
  if (s.includes('Launching with arguments')) { log('debug: Launching with arguments ...'); }
  else { log('debug:', s.slice(0, 200)); }
});
client.on('data', (e) => {
  const s = String(e);
  log('MC:', s.trim().split('\n').slice(-1).join(' | '));
  if (quitTriggered) return;
  if (s.includes('Sound engine started')) { markersSeen.push('Sound engine started'); log('MARKER HIT: Sound engine started'); }
  if (s.includes('Java GUI initialized')) { markersSeen.push('Java GUI initialized'); log('MARKER HIT: Java GUI initialized'); }
  if (s.includes('Created:') && s.includes('atlas')) { markersSeen.push('atlas Created'); log('MARKER HIT: Created: ... atlas'); }
  if (markersSeen.length > 0 && !quitTriggered) {
    quitTriggered = true;
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    log('>>> LAUNCHER QUIT TRIGGERED (game window detected) <<<');
    setTimeout(() => {
      log('parent (launcher) process exiting now; checking java survives...');
      process.exit(0);
    }, 3000);
  }
});
client.on('progress', (e) => { if (e.type === 'launch') log('progress: launch event, prog =', e.progress); });
client.on('error', (e) => { log('ERROR:', e && e.message); process.exit(1); });
client.on('close', (code) => { log('=== GAME CLOSED, exit code =', code); process.exit(0); });

client.launch(opts).then(() => log('launch() RESOLVED - no TypeError, fix works')).catch((e) => { log('LAUNCH FAIL:', e && e.message); process.exit(1); });

setTimeout(() => {
  if (quitTriggered) { log('TEST TIMEOUT reached after quit trigger'); process.exit(0); }
  log('TIMEOUT: quit not triggered in 5 min');
  process.exit(2);
}, 5 * 60 * 1000);
