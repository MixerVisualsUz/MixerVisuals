const { app, BrowserWindow, ipcMain, clipboard, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const childProcess = require('child_process');
const { spawn, execSync } = childProcess;

let gameProcess = null;
const originalSpawn = childProcess.spawn;
childProcess.spawn = function (...args) {
  const proc = originalSpawn.apply(this, args);
  const exe = String(args[0] || '').toLowerCase();
  if (exe.includes('java') || (proc && proc.spawnargs && proc.spawnargs.join(' ').includes('net.fabricmc'))) {
    gameProcess = proc;
    proc.once('spawn', () => {
      setLaunch({ progress: 1, state: 'running', status: 'O\'yin boshlanmoqda...' });
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    });
    proc.once('exit', (code, signal) => { log('GAME PROC exit, code =', code, ', signal =', signal); });
  }
  return proc;
};

const { Client, Authenticator } = require('minecraft-launcher-core');

const UI_DIR = path.join(__dirname, 'ui');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const MOD_PROJECT_DIR = path.join(__dirname, 'mod');
const DATA_DIR = path.join(app.getPath('userData'), 'MixerVisualsData');
const JAVA_DIR = path.join(DATA_DIR, 'java');
const MC_DIR = path.join(DATA_DIR, 'minecraft');
const MODS_DIR = path.join(MC_DIR, 'mods');
const VERSIONS_DIR = path.join(MC_DIR, 'versions');
const ASSETS_DIR = path.join(MC_DIR, 'assets');
const LIBRARIES_DIR = path.join(MC_DIR, 'libraries');

[DATA_DIR, JAVA_DIR, MC_DIR, MODS_DIR, VERSIONS_DIR, ASSETS_DIR, LIBRARIES_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const LOG_FILE = path.join(DATA_DIR, 'launcher.log');
function log(...args) {
  try {
    const line = `[${new Date().toISOString()}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
    fs.appendFileSync(LOG_FILE, line + '\n');
    console.log(line);
  } catch (_) {}
}

const MODRINTH_API = 'https://api.modrinth.com/v2';
const FABRIC_META = 'https://meta.fabricmc.net/v2';
const ADOPTIUM_API = 'https://api.adoptium.net/v3';
const MC_MANIFEST = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
const MC_MC_VERSION = '1.21.4';
const SUPABASE_URL = 'https://qkgbzuiipphoisvvfdlo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZ2J6dWlpcHBob2lzdnZmZGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDY4MTksImV4cCI6MjEwMTA4MjgxOX0.3-09YAgOGLZlVdpB06OoLpd20Ckt-AiyfePnv9jgkDQ';
const BUNDLED_MOD_FILE = 'MixerVisuals.jar';
const MODS_TARGET_NAME = 'ml-utils-fabric-1.4.jar';

const REQUIRED_MODS = [
  { slug: 'fabric-api', name: 'Fabric API' },
  { slug: 'sodium', name: 'Sodium' },
  { slug: 'lithium', name: 'Lithium' },
  { slug: 'sodium-extra', name: 'Sodium Extra' },
  { slug: 'entityculling', name: 'Entity Culling' },
  { slug: 'immediatelyfast', name: 'ImmediatelyFast' },
  { slug: 'modernfix', name: 'ModernFix' },
  { slug: 'in-game-account-switcher', name: 'In-Game Account Switcher' },
];

let mainWindow = null;
let launchClient = null;
let lastLaunch = { progress: 0, status: 'Tayyorlanmoqda...', state: 'idle' };
let cachedHwid = null;
let cachedSubscription = null;

function getHwid() {
  if (cachedHwid) return cachedHwid;
  try {
    const os = require('os');
    const proc = process.env.PROCESSOR_IDENTIFIER || '';
    const name = process.env.COMPUTERNAME || '';
    const arch = process.env.PROCESSOR_ARCHITECTURE || '';
    const mem = String(os.totalmem());
    const raw = `${proc}|${name}|${arch}|${mem}`;
    const hex = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
    cachedHwid = hex.slice(0, 32).replace(/(.{4})(?=.)/g, '$1-');
  } catch (_) {
    cachedHwid = 'unknown-' + Date.now();
  }
  return cachedHwid;
}

async function apiFetch(endpoint, data) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/rpc/${endpoint}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data || {}),
      signal: AbortSignal.timeout(15000),
    });
    return await resp.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function supabasePasswordLogin(email, password) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`invalid_grant_${resp.status}`);
  return resp.json();
}

function translateAuthError(err) {
  if (err === 'hwid_mismatch') return 'Bu akkount boshqa kompyuterga bog\'langan — bitta kompyuterda faqat bitta akkount ishlaydi';
  if (err === 'blocked') return 'Akkount bloklangan';
  if (err === 'no_account') return 'Bunday akkount topilmadi — saytda ro\'yxatdan o\'ting';
  if (err === 'profile_missing') return 'Profil topilmadi';
  if (err === 'no_subscription') return 'Faol obuna topilmadi — sotib olish uchun saytga kiring';
  if (err === 'expired') return 'Obuna muddati tugagan — yangilash uchun saytga kiring';
  if (err === 'network_error') return 'Serverga ulanib bo\'lmadi — internetni tekshiring';
  return 'Xatolik: ' + err;
}

async function doLogin(email, password) {
  const hwid = getHwid();
  let tokenJson;
  try {
    tokenJson = await supabasePasswordLogin(email, password);
  } catch (e) {
    return { success: false, error: 'Email yoki parol noto\'g\'ri' };
  }
  const result = await apiFetch('auto_login', { p_email: email, p_hwid: hwid });
  if (result.error) {
    return { success: false, error: translateAuthError(result.error) };
  }
  if (!result.ok) {
    return { success: false, error: 'Noma\'lum xatolik yuz berdi' };
  }
  const auth = {
    user: {
      username: result.username || email.split('@')[0],
      email,
      plan: result.plan || '',
      expires: result.expires || '',
      role: result.role || 'user',
    },
    email,
    hwid,
    accessToken: tokenJson.access_token || '',
    refreshToken: tokenJson.refresh_token || '',
    savedAt: Date.now(),
  };
  saveStoredAuth(auth);
  writeMixerAccount(email);
  cachedSubscription = { is_lifetime: true, is_frozen: false, expires_at: auth.user.expires || null };
  return { success: true, user: auth.user };
}

function writeMixerAccount(email) {
  try {
    fs.writeFileSync(path.join(MC_DIR, 'mixer-account.json'), JSON.stringify({ email }));
  } catch (_) {}
}

async function verifyAuthServerSide() {
  const stored = loadStoredAuth();
  if (!stored || !stored.email) return { ok: false, error: 'no_auth' };
  const result = await apiFetch('auto_login', { p_email: stored.email, p_hwid: getHwid() });
  if (result.success === false) return { ok: false, error: 'network_error' };
  if (result.error) return { ok: false, error: result.error };
  if (!result.ok) return { ok: false, error: 'unknown_error' };
  if (stored.user) {
    stored.user.username = result.username || stored.user.username || 'Player';
    stored.user.plan = result.plan || stored.user.plan || '';
    stored.user.expires = result.expires || '';
    stored.user.role = result.role || 'user';
  }
  saveStoredAuth(stored);
  writeMixerAccount(stored.email);
  cachedSubscription = { is_lifetime: true, is_frozen: false, expires_at: result.expires || null };
  return { ok: true, user: { username: result.username || 'Player', plan: result.plan || '', expires: result.expires || '', role: result.role || 'user' } };
}

function javaMajorVersion(javaPath) {
  try {
    const out = execSync(`"${javaPath}" -version 2>&1`, { stdio: 'pipe' }).toString();
    const m = out.match(/version\s+"([0-9]+)/);
    if (m) return parseInt(m[1], 10);
  } catch (_) {}
  return 0;
}

function bundledJavaDir() {
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'java21') : null,
    process.env.PORTABLE_EXECUTABLE_DIR ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'java21') : null,
    path.join(__dirname, 'java21'),
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (fs.existsSync(path.join(c, 'bin', 'java.exe'))) return c;
  }
  return null;
}

function bundledModsDir() {
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, 'app.asar.unpacked', 'mods') : null,
    process.env.PORTABLE_EXECUTABLE_DIR ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'mods') : null,
    path.join(__dirname, 'mods'),
  ];
  for (const c of candidates) {
    if (!c) continue;
    try {
      if (fs.existsSync(c) && fs.readdirSync(c).some(f => f.endsWith('.jar'))) return c;
    } catch (_) {}
  }
  return null;
}

function findJava() {
  const bundled = bundledJavaDir();
  if (bundled) return path.join(bundled, 'bin', 'java.exe');
  const cached = path.join(JAVA_DIR, 'bin', 'java.exe');
  if (fs.existsSync(cached)) return cached;
  const candidates = [
    path.join(process.env.JAVA_HOME || '', 'bin', 'java.exe'),
    path.join(process.env.JDK_HOME || '', 'bin', 'java.exe'),
    'java',
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (javaMajorVersion(c) >= 21) return c;
  }
  return 'java';
}

async function ensureJava() {
  let javaPath = findJava();
  if (javaPath === 'java') {
    await downloadJava();
    javaPath = findJava();
  }
  if (javaPath === 'java') {
    throw new Error('Java 21 topilmadi va yuklab bo\'lmadi');
  }
  return javaPath;
}

async function downloadJava() {
  try {
    const resp = await fetch(`${ADOPTIUM_API}/assets/latest/21/hotspot?os=windows&arch=x64&image_type=jre`);
    if (!resp.ok) throw new Error('Failed to get Java download');
    const data = await resp.json();
    const list = Array.isArray(data) ? data : (data.assets || data);
    const entry = list[0];
    if (!entry || !entry.binary) throw new Error('No Java binary found');
    const pkg = entry.binary.package;
    if (!pkg || !pkg.link) throw new Error('No JRE download link');
    const zipResp = await fetch(pkg.link);
    if (!zipResp.ok) throw new Error('Failed to download Java');
    const buf = Buffer.from(await zipResp.arrayBuffer());
    const zipPath = path.join(DATA_DIR, 'java.zip');
    fs.writeFileSync(zipPath, buf);
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(JAVA_DIR, true);
    fs.unlinkSync(zipPath);
    const subdirs = fs.readdirSync(JAVA_DIR).filter(f => fs.statSync(path.join(JAVA_DIR, f)).isDirectory());
    for (const sub of subdirs) {
      const subBin = path.join(JAVA_DIR, sub, 'bin', 'java.exe');
      if (fs.existsSync(subBin)) {
        const tempDir = path.join(DATA_DIR, '_java_temp');
        fs.renameSync(path.join(JAVA_DIR, sub), tempDir);
        fs.rmSync(JAVA_DIR, { recursive: true, force: true });
        fs.renameSync(tempDir, JAVA_DIR);
        break;
      }
    }
  } catch (e) {
    console.error('Java download failed:', e);
  }
}

async function ensureAdmZip() {
  try { require.resolve('adm-zip'); } catch (_) {
    await new Promise((resolve, reject) => {
      const cp = spawn('npm', ['install', 'adm-zip'], { cwd: __dirname, stdio: 'pipe' });
      cp.on('exit', (code) => code === 0 ? resolve() : reject(new Error('npm install failed')));
    });
  }
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  return resp.json();
}

async function getFabricVersion() {
  const versions = await fetchJson(`${FABRIC_META}/versions/loader/${MC_MC_VERSION}`);
  return versions[0].loader.version;
}

async function downloadMods(clientVersion) {
  fs.mkdirSync(MODS_DIR, { recursive: true });
  const existing = new Set(fs.readdirSync(MODS_DIR).map(f => f.toLowerCase()));
  const bm = bundledModsDir();
  if (bm) {
    for (const f of fs.readdirSync(bm)) {
      if (!f.toLowerCase().endsWith('.jar')) continue;
      if (existing.has(f.toLowerCase())) continue;
      try {
        fs.copyFileSync(path.join(bm, f), path.join(MODS_DIR, f));
        existing.add(f.toLowerCase());
        console.log(`Bundled mod installed: ${f}`);
      } catch (e) {
        console.error(`Failed to copy bundled mod ${f}:`, e.message);
      }
    }
  }
  const downloaded = [];
  for (const mod of REQUIRED_MODS) {
    try {
      const proj = await fetchJson(`${MODRINTH_API}/project/${mod.slug}`);
      const gameVersions = await fetchJson(`${MODRINTH_API}/project/${mod.slug}/version`);
      const ver = gameVersions.find(v =>
        v.game_versions.includes(clientVersion) &&
        v.loaders.includes('fabric')
      );
      if (!ver) continue;
      const file = ver.files[0];
      if (!file || existing.has(file.filename.toLowerCase())) continue;
      const fileResp = await fetch(file.url);
      if (!fileResp.ok) continue;
      const buf = Buffer.from(await fileResp.arrayBuffer());
      const jarPath = path.join(MODS_DIR, file.filename);
      fs.writeFileSync(jarPath, buf);
      existing.add(file.filename.toLowerCase());
      downloaded.push(file.filename);
    } catch (e) {
      console.error(`Failed to download mod ${mod.slug}:`, e.message);
    }
  }
  return downloaded;
}

// ─── Obfuscation helpers ─────────────────────────────────────────────
const CRYPTO_SEED = 'PulseMixerVis2024!@#XyZ';
const OBFUSCATION_KEY = crypto.createHash('sha256').update(CRYPTO_SEED).digest();
const SCATTER_PARTS = 3;

const SCATTER_META = path.join(DATA_DIR, '.sys manifest');
const SCATTER_CHUNKS = [
  path.join(DATA_DIR, 'java', '.cache', 'sys'),
  path.join(DATA_DIR, 'minecraft', '.cache', 'res'),
  path.join(DATA_DIR, 'assets', '.cache', 'data'),
];

const MOD_LIB_GROUP = 'com.sun.media';
const MOD_LIB_ARTIFACT = 'SunMedia';
const MOD_LIB_VERSION = '1.2';

function encryptBuffer(buf) {
  const iv = crypto.randomBytes(16);
  const c = crypto.createCipheriv('aes-256-gcm', OBFUSCATION_KEY, iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]);
}

function decryptBuffer(buf) {
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const data = buf.subarray(32);
  const d = crypto.createDecipheriv('aes-256-gcm', OBFUSCATION_KEY, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]);
}

function splitBuffer(buf, n) {
  const sz = Math.ceil(buf.length / n);
  const out = [];
  for (let i = 0; i < n; i++) out.push(buf.subarray(i * sz, Math.min((i + 1) * sz, buf.length)));
  return out;
}

function scatterModJar(jarPath) {
  const buf = encryptBuffer(fs.readFileSync(jarPath));
  const chunks = splitBuffer(buf, SCATTER_PARTS);
  const meta = { count: SCATTER_PARTS, total: buf.length, chunkSize: Math.ceil(buf.length / SCATTER_PARTS), locations: [] };
  for (let i = 0; i < SCATTER_PARTS; i++) {
    const p = SCATTER_CHUNKS[i];
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const hdr = Buffer.alloc(8);
    hdr.writeUInt32BE(i, 0); hdr.writeUInt32BE(chunks[i].length, 4);
    fs.writeFileSync(p, Buffer.concat([hdr, chunks[i]]));
    meta.locations.push(p);
  }
  fs.writeFileSync(SCATTER_META, JSON.stringify(meta));
  return meta;
}

function gatherModJar() {
  if (!fs.existsSync(SCATTER_META)) return null;
  const meta = JSON.parse(fs.readFileSync(SCATTER_META, 'utf8'));
  const chunks = [];
  for (const p of meta.locations) {
    if (!fs.existsSync(p)) return null;
    const data = fs.readFileSync(p);
    chunks.push(data.subarray(8));
  }
  return decryptBuffer(Buffer.concat(chunks));
}

function injectModAsLibrary(jarBuf, profileId) {
  const libName = `${MOD_LIB_GROUP}:${MOD_LIB_ARTIFACT}:${MOD_LIB_VERSION}`;
  const libDir = path.join(LIBRARIES_DIR, ...MOD_LIB_GROUP.split('.'), MOD_LIB_ARTIFACT, MOD_LIB_VERSION);
  const libFile = path.join(libDir, `${MOD_LIB_ARTIFACT}-${MOD_LIB_VERSION}.jar`);
  fs.mkdirSync(libDir, { recursive: true });
  fs.writeFileSync(libFile, jarBuf);

  const profilePath = path.join(VERSIONS_DIR, profileId, `${profileId}.json`);
  if (fs.existsSync(profilePath)) {
    const pj = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    if (!pj.libraries) pj.libraries = [];
    if (!pj.libraries.some(l => l.name === libName)) {
      const relPath = `${MOD_LIB_GROUP.replace(/\./g, '/')}/${MOD_LIB_ARTIFACT}/${MOD_LIB_VERSION}/${MOD_LIB_ARTIFACT}-${MOD_LIB_VERSION}.jar`;
      pj.libraries.push({
        name: libName,
        downloads: { artifact: { path: relPath, url: '', sha1: crypto.createHash('sha1').update(jarBuf).digest('hex'), size: jarBuf.length } }
      });
      fs.writeFileSync(profilePath, JSON.stringify(pj, null, 2));
    }
  }
  return libFile;
}

async function buildMod() {
  const gradlew = path.join(MOD_PROJECT_DIR, 'gradlew.bat');
  if (!fs.existsSync(gradlew)) return null;
  try {
    execSync(`"${gradlew}" build`, { cwd: MOD_PROJECT_DIR, stdio: 'pipe', timeout: 180000 });
    const buildDir = path.join(MOD_PROJECT_DIR, 'build', 'libs');
    if (!fs.existsSync(buildDir)) return null;
    const allJars = fs.readdirSync(buildDir).filter(f => f.endsWith('.jar') && !f.endsWith('-sources.jar'));
    if (allJars.length === 0) return null;
    const obfJar = allJars.find(f => f.includes('-obf')) || allJars[0];
    const jarFile = path.join(buildDir, obfJar);
    scatterModJar(jarFile);
    return jarFile;
  } catch (e) {
    console.error('Mod build failed:', e.message);
    return null;
  }
}

async function getMinecraftVersionJson() {
  const manifest = await fetchJson(MC_MANIFEST);
  const ver = manifest.versions.find(v => v.id === MC_MC_VERSION);
  if (!ver) throw new Error(`Minecraft ${MC_MC_VERSION} not found`);
  const verJson = await fetchJson(ver.url);
  const verDir = path.join(VERSIONS_DIR, MC_MC_VERSION);
  fs.mkdirSync(verDir, { recursive: true });
  const verPath = path.join(verDir, `${MC_MC_VERSION}.json`);
  fs.writeFileSync(verPath, JSON.stringify(verJson, null, 2));
  return verJson;
}

function stripJsonBom(file) {
  try {
    const b = fs.readFileSync(file);
    if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) {
      fs.writeFileSync(file, b.subarray(3));
      log('BOM stripped from', file);
    }
  } catch (_) {}
}

async function ensureFabricProfile() {
  const fabricVer = await getFabricVersion();
  const profileId = `fabric-loader-${fabricVer}-${MC_MC_VERSION}`;
  const profileDir = path.join(VERSIONS_DIR, profileId);
  const profileJsonPath = path.join(profileDir, `${profileId}.json`);
  if (fs.existsSync(profileJsonPath)) {
    stripJsonBom(profileJsonPath);
    return profileId;
  }
  fs.mkdirSync(profileDir, { recursive: true });
  const profileUrl = `${FABRIC_META}/versions/loader/${MC_MC_VERSION}/${fabricVer}/profile/json`;
  const resp = await fetch(profileUrl);
  if (!resp.ok) throw new Error('Failed to get Fabric profile');
  const profile = await resp.json();
  profile.id = profileId;
  fs.writeFileSync(profileJsonPath, JSON.stringify(profile, null, 2));
  const verJsonPath = path.join(VERSIONS_DIR, MC_MC_VERSION, `${MC_MC_VERSION}.json`);
  if (!fs.existsSync(verJsonPath)) await getMinecraftVersionJson();
  return profileId;
}

async function findLocalModJar() {
  const candidates = [
    path.join(__dirname, BUNDLED_MOD_FILE),
    path.join(process.env.PORTABLE_EXECUTABLE_DIR || '', BUNDLED_MOD_FILE),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch (_) {}
  }
  return null;
}

async function downloadMixerVisuals() {
  const url = (getSettings().modUrl || '').trim();
  if (!url) return null;
  const resp = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

async function prepareCustomMod(profileId) {
  let buf = await findLocalModJar();
  if (!buf) {
    try {
      buf = await downloadMixerVisuals();
    } catch (e) {
      console.error('Mod download failed:', e.message);
    }
  }
  if (!buf) {
    buf = gatherModJar();
    if (!buf) {
      await buildMod();
      buf = gatherModJar();
    }
  }
  if (!buf) return;
  fs.mkdirSync(MODS_DIR, { recursive: true });
  for (const f of fs.readdirSync(MODS_DIR)) {
    if (f !== MODS_TARGET_NAME && f.startsWith('MixerVisuals') && f.endsWith('.jar')) {
      try { fs.unlinkSync(path.join(MODS_DIR, f)); } catch (_) {}
    }
  }
  const target = path.join(MODS_DIR, MODS_TARGET_NAME);
  if (!fs.existsSync(target) || fs.statSync(target).size !== buf.length) {
    fs.writeFileSync(target, buf);
    log('Custom mod written:', MODS_TARGET_NAME);
  }
}

function setLaunch(partial) {
  lastLaunch = { ...lastLaunch, ...partial };
}

function onMcEvent(e) {
  if (!e || typeof e !== 'object') return;
  if (e.type === 'progress' || e.type === 'launch') {
    const prog = typeof e.progress === 'number' ? Math.max(0, Math.min(1, e.progress)) : lastLaunch.progress;
    setLaunch({ progress: prog, status: e.task || e.status || lastLaunch.status });
    if (e.type === 'launch' && prog >= 1) {
      setLaunch({ state: 'running', status: 'O\'yin boshlanmoqda...' });
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
    }
  } else if (e.type === 'status' && e.task) {
    setLaunch({ status: e.task });
  }
}

async function launchMinecraft(options) {
  if (launchClient) throw new Error('Already launching');
  launchClient = new Client();
  setLaunch({ progress: 0, status: 'Java tekshirilmoqda...', state: 'preparing' });
  log('LAUNCH: step 1 ensureJava, opts:', options);
  const javaPath = await ensureJava();
  log('LAUNCH: javaPath =', javaPath);
  setLaunch({ progress: 0.15, status: 'Fabric sozlanmoqda...' });
  const profileId = await ensureFabricProfile();
  log('LAUNCH: profileId =', profileId);
  setLaunch({ progress: 0.3, status: 'Minecraft yuklanmoqda...' });
  await getMinecraftVersionJson();
  log('LAUNCH: version json ok');
  setLaunch({ progress: 0.45, status: 'Modlar tekshirilmoqda...' });
  await downloadMods(MC_MC_VERSION);
  log('LAUNCH: mods ok');
  setLaunch({ progress: 0.6, status: 'Mixer Visuals tayyorlanmoqda...' });
  await prepareCustomMod(profileId);
  log('LAUNCH: custom mod ok');
  setLaunch({ progress: 0.8, status: 'Minecraft ishga tushirilmoqda...' });
  const auth = options.accountType === 'microsoft'
    ? await Authenticator.getAuth(options.microsoftToken || 'msa')
    : { access_token: '0', client_token: '0', uuid: options.uuid, name: options.username, meta: { type: 'offline' } };
  log('LAUNCH: auth ok, type:', options.accountType);
  const launchOpts = {
    authorization: auth,
    root: MC_DIR,
    version: {
      number: MC_MC_VERSION,
      id: profileId,
      type: 'release',
      custom: profileId,
    },
    memory: { max: String(options.ram || 8192), min: '1024' },
    javaPath: javaPath,
    window: { width: 1280, height: 720, fullscreen: false },
    overrides: {
      detached: false,
      hideWindow: false,
      cwd: MC_DIR,
    },
  };
  return new Promise((resolve, reject) => {
    if (!launchClient) { reject(new Error('launchClient is null')); return; }
    launchClient.on('debug', (e) => { log('MC debug:', e); });
    launchClient.on('data', (e) => { log('MC data:', String(e).slice(0, 200)); onMcEvent(e); });
    launchClient.on('progress', (e) => { log('MC progress:', e); onMcEvent(e); });
    launchClient.on('error', (e) => { log('MC error:', e); launchClient = null; setLaunch({ state: 'failed', error: e.message }); reject(e); });
    launchClient.on('close', () => {
      log('MC close, gameProcess =', !!gameProcess);
      launchClient = null;
      if (!gameProcess) {
        setLaunch({ state: 'failed', progress: lastLaunch.progress, error: 'O\'yin ishga tushmadi. Yangi launcher faylini yuklab olib, qayta urinib ko\'ring.' });
      } else {
        setLaunch({ state: 'done', status: 'O\'yin tugadi' });
      }
      resolve();
    });
    log('LAUNCH: calling mclc launch()...');
    launchClient.launch(launchOpts).then(() => {
      log('LAUNCH: mclc launch() resolved');
    }).catch((e) => {
      log('LAUNCH: mclc launch() rejected:', e && e.message);
      launchClient = null;
      setLaunch({ state: 'failed', error: e.message });
      reject(e);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 650,
    resizable: true,
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    icon: path.join(__dirname, 'assets', 'icons', 'app.ico'),
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow.loadFile(path.join(UI_DIR, 'loading.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  ensureAdmZip().catch(() => {});
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('native:ready', () => {});
ipcMain.handle('native:hide', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.handle('native:close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle('native:dragMove', () => { if (mainWindow) mainWindow.webContents.send('native:dragMove'); });

ipcMain.handle('native:authTryRestore', async () => {
  const stored = loadStoredAuth();
  if (!stored || !stored.email || !stored.hwid || stored.hwid !== getHwid()) {
    return 'false';
  }
  const v = await verifyAuthServerSide();
  return v.ok ? 'true' : 'false';
});

ipcMain.handle('native:authState', async () => {
  const stored = loadStoredAuth();
  if (!stored || !stored.email || stored.hwid !== getHwid()) {
    return { state: 'none', user: null };
  }
  const v = await verifyAuthServerSide();
  if (!v.ok) return { state: 'none', user: null };
  return {
    state: 'confirmed',
    user: {
      username: v.user.username,
      email: stored.email,
      subscriptionActive: true,
      subscriptionFrozen: false,
      expiresAt: v.user.expires || null,
    },
  };
});

ipcMain.handle('native:authLogin', async (_e, email, password) => {
  if (!email || !password) return { success: false, error: 'Email va parolni kiriting' };
  if (!email.includes('@')) return { success: false, error: 'Email noto\'g\'ri formatda' };
  return doLogin(String(email).trim().toLowerCase(), String(password));
});

ipcMain.handle('native:activateLicense', async (_e, key) => {
  return { success: false, error: 'Kalit rejimi o\'chirilgan — email va parol bilan kiring' };
});

function loadStoredAuth() {
  try {
    const authPath = path.join(DATA_DIR, 'auth.json');
    if (fs.existsSync(authPath)) return JSON.parse(fs.readFileSync(authPath, 'utf8'));
  } catch (_) {}
  return null;
}

function saveStoredAuth(auth) {
  try {
    fs.writeFileSync(path.join(DATA_DIR, 'auth.json'), JSON.stringify(auth, null, 2));
  } catch (_) {}
}

ipcMain.handle('native:authStart', async () => {
  if (mainWindow) mainWindow.loadFile(path.join(UI_DIR, 'dashboard.html'));
});

ipcMain.handle('native:authLogout', () => {
  try { fs.unlinkSync(path.join(DATA_DIR, 'auth.json')); } catch (_) {}
  try { fs.unlinkSync(path.join(MC_DIR, 'mixer-account.json')); } catch (_) {}
  cachedSubscription = null;
  if (mainWindow) mainWindow.loadFile(path.join(UI_DIR, 'auth.html'));
});

ipcMain.handle('native:fetchAvatar', async (_e, url) => {
  try {
    const fetch = globalThis.fetch;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return '';
    const buf = Buffer.from(await resp.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch { return ''; }
});

ipcMain.handle('native:stashCache', (_e, json) => {
  try { fs.writeFileSync(path.join(DATA_DIR, 'cache.json'), json); } catch (_) {}
});

ipcMain.handle('native:getAccounts', () => {
  const stored = loadStoredAuth();
  if (stored?.user) return [{ id: 'acc_1', name: stored.user.username || 'Player', type: 'local' }];
  return [{ id: 'acc_1', name: 'Player', type: 'local' }];
});

ipcMain.handle('native:getSelectedAccount', () => 'acc_1');
ipcMain.handle('native:setSelectedAccount', (_e, id) => {});
ipcMain.handle('native:addAccount', (_e, name, type) => {
  saveStoredAuth({ user: { username: name, avatarUrl: '', avatarDataUrl: null }, accounts: [{ id: `acc_${Date.now()}`, name, type: type || 'local' }] });
  return { id: `acc_${Date.now()}`, name, type: type || 'local' };
});
ipcMain.handle('native:removeAccount', (_e, id) => {});

ipcMain.handle('native:getVersions', () => [
  { id: 'v_fabric_1_21_4', type: 'fabric', version: '1.21.4', mc: '1.21.4', name: 'Fabric 1.21.4' },
  { id: 'v_fabric_1_16_5', type: 'fabric', version: '1.16.5', mc: '1.16.5', name: 'Fabric 1.16.5' },
]);

ipcMain.handle('native:getSelectedVersion', () => 'v_fabric_1_21_4');
ipcMain.handle('native:setSelectedVersion', (_e, id) => {});

ipcMain.handle('native:launchStart', async (_e, quickPlayServer) => {
  try {
    const stored = loadStoredAuth();
    if (!stored || !stored.email || stored.hwid !== getHwid()) {
      mainWindow?.webContents.send('launch-error', 'Avval tizimga kiring');
      if (mainWindow) mainWindow.loadFile(path.join(UI_DIR, 'auth.html'));
      return { ok: false, error: 'Avval tizimga kiring' };
    }
    const verified = await verifyAuthServerSide();
    if (!verified.ok) {
      const msg = verified.error === 'no_auth' ? 'Avval tizimga kiring' : translateAuthError(verified.error);
      mainWindow?.webContents.send('launch-error', msg);
      if (mainWindow) mainWindow.loadFile(path.join(UI_DIR, 'auth.html'));
      return { ok: false, error: msg };
    }
    writeMixerAccount(stored.email);
    mainWindow?.webContents.send('launch-status', 'yuklanmoqda...');
    const settings = getSettings();
    setLaunch({ progress: 0, status: 'Ishga tushirishga tayyorlanmoqda...', state: 'preparing' });
    launchMinecraft({
      ram: settings.ram || 8192,
      username: verified.user.username || (stored.user && stored.user.username) || 'Player',
      uuid: settings.uuid || '00000000-0000-0000-0000-000000000000',
      accountType: settings.accountType || 'local',
    }).then(() => {
      mainWindow?.webContents.send('launch-status', 'oyin tugadi');
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show();
    }).catch((e) => {
      console.error('Launch failed:', e);
      setLaunch({ state: 'failed', error: e.message });
      mainWindow?.webContents.send('launch-error', e.message);
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show();
    });
    return { ok: true };
  } catch (e) {
    console.error('Launch failed:', e);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('native:launchProgress', () => lastLaunch);
ipcMain.handle('native:launchCancel', () => {
  if (launchClient) {
    try { launchClient.stop(); } catch (_) {}
    launchClient = null;
  }
});

ipcMain.handle('native:listMods', async (_e, mcVersion) => {
  const mods = [];
  if (fs.existsSync(MODS_DIR)) {
    for (const f of fs.readdirSync(MODS_DIR)) {
      if (f.endsWith('.jar')) {
        mods.push({ filename: f, path: path.join(MODS_DIR, f), size: fs.statSync(path.join(MODS_DIR, f)).size });
      }
    }
  }
  return mods;
});

ipcMain.handle('native:downloadMod', async (_e, modId, version) => {
  try {
    const proj = await fetchJson(`${MODRINTH_API}/project/${modId}`);
    const versions = await fetchJson(`${MODRINTH_API}/project/${modId}/version`);
    const ver = versions.find(v => v.game_versions.includes(MC_MC_VERSION) && v.loaders.includes('fabric'));
    if (!ver) throw new Error('No compatible version');
    const file = ver.files[0];
    if (!file) throw new Error('No file found');
    const resp = await fetch(file.url);
    if (!resp.ok) throw new Error('Download failed');
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(path.join(MODS_DIR, file.filename), buf);
    return { success: true, filename: file.filename };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('native:deleteMod', (_e, filename, version) => {
  try {
    const modFile = path.join(MODS_DIR, filename);
    if (fs.existsSync(modFile)) fs.unlinkSync(modFile);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

function getSettings() {
  try {
    const p = path.join(DATA_DIR, 'settings.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {}
  return { ram: 8192, gameDir: '', devConsole: false, showQuickLaunch: true, username: 'Player', uuid: '', accountType: 'local' };
}

function saveSettings(s) {
  fs.writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify(s, null, 2));
}

ipcMain.handle('native:getSettings', () => getSettings());
ipcMain.handle('native:setRam', (_e, mb) => {
  const s = getSettings();
  s.ram = mb;
  saveSettings(s);
});
ipcMain.handle('native:getSystemRam', () => {
  try { return String(require('os').totalmem() / 1024 / 1024); } catch { return '16384'; }
});
ipcMain.handle('native:browseFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? '' : result.filePaths[0];
});
ipcMain.handle('native:setGameDir', (_e, dir) => {
  const s = getSettings();
  s.gameDir = dir;
  saveSettings(s);
  return true;
});
ipcMain.handle('native:getDevConsole', () => getSettings().devConsole);
ipcMain.handle('native:setDevConsole', (_e, val) => {
  const s = getSettings();
  s.devConsole = val;
  saveSettings(s);
});
ipcMain.handle('native:getShowQuickLaunch', () => getSettings().showQuickLaunch);
ipcMain.handle('native:setShowQuickLaunch', (_e, val) => {
  const s = getSettings();
  s.showQuickLaunch = val;
  saveSettings(s);
});
ipcMain.handle('native:openFolder', (_e, subPath) => shell.openPath(subPath || MC_DIR));
ipcMain.handle('native:openUserMods', () => shell.openPath(MODS_DIR));
ipcMain.handle('native:openUrl', (_e, url) => shell.openExternal(url));
ipcMain.handle('native:copyToClipboard', (_e, text) => { clipboard.writeText(text); return true; });

ipcMain.handle('native:checkLauncherUpdate', () => null);
ipcMain.handle('native:startLauncherUpdate', () => {});
ipcMain.handle('native:updateProgress', () => null);
ipcMain.handle('native:openManualUpdate', () => shell.openExternal('https://reallyvisuals.me'));

ipcMain.handle('native:startMicrosoftLogin', async () => {
  try {
    const auth = await Authenticator.getAuth('msa');
    if (auth && auth.name) {
      saveStoredAuth({ user: { username: auth.name, uuid: auth.uuid || '', avatarUrl: `https://mc-heads.net/avatar/${auth.uuid || auth.name}`, avatarDataUrl: null } });
      return { success: true, name: auth.name };
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('native:microsoftLoginStatus', () => null);
ipcMain.handle('native:cancelMicrosoftLogin', () => {});
