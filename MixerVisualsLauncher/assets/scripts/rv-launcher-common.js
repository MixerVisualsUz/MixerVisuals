// Общий код для всех страниц лаунчера. Подключается через
// <script src="../assets/scripts/rv-launcher-common.js"></script>.
//
// Возможности:
//   - localStorage-кеш с TTL (cache-first, без фоновых рефетчей)
//   - Инжект rv-skel shimmer-стилей в <head>
//   - Автозаполнение элементов с классом `js-rv-client-version`:
//     ищет такие элементы в DOM и подставляет «Client Version: X.Y.Z».
//
// На странице, где есть свой скелетон-плейсхолдер внутри элемента, скрипт
// просто заменит его текстом, когда данные станут доступны.
//
// Все запросы — публичные, без cookie/auth, отдают CORS `*`.

(function () {
    if (window.__rvLauncherCommonLoaded) return;
    window.__rvLauncherCommonLoaded = true;

    const RV_API_BASE = 'https://api.reallyvisuals.me/api';
    const RV_CACHE_TTL_MS = 10 * 60 * 1000; // 10 минут

    // ── localStorage кеш ──
    function rvCacheGet(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (!obj || typeof obj.t !== 'number') return null;
            if (Date.now() - obj.t > RV_CACHE_TTL_MS) return null;
            return obj.v;
        } catch (_) { return null; }
    }
    function rvCacheSet(key, value) {
        try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); } catch (_) {}
    }
    window.rvCacheGet = rvCacheGet;
    window.rvCacheSet = rvCacheSet;
    window.RV_API_BASE = RV_API_BASE;

    // ── Инжект CSS для shimmer-скелетона (если ещё не добавлен) ──
    function injectSkelCss() {
        if (document.getElementById('rv-skel-style')) return;
        const style = document.createElement('style');
        style.id = 'rv-skel-style';
        style.textContent =
            '@keyframes rv-skel-shimmer{' +
            '0%{background-position:-200px 0}' +
            '100%{background-position:calc(200px + 100%) 0}' +
            '}' +
            '.rv-skel{' +
            'background:linear-gradient(90deg,#1C1C20 0%,#26262B 50%,#1C1C20 100%);' +
            'background-size:200px 100%;' +
            'background-repeat:no-repeat;' +
            'animation:rv-skel-shimmer 1.4s ease-in-out infinite;' +
            'border-radius:4px;' +
            'color:transparent;' +
            'user-select:none;' +
            'pointer-events:none;' +
            '}';
        document.head.appendChild(style);
    }

    // ── Загрузка версии клиента ──
    function applyVersionToElements(version) {
        const els = document.querySelectorAll('.js-rv-client-version');
        els.forEach((el) => {
            el.replaceChildren(document.createTextNode(`Client Version: ${version || '—'}`));
        });
    }

    async function rvLoadClientVersion() {
        const els = document.querySelectorAll('.js-rv-client-version');
        if (els.length === 0) return;

        const cached = rvCacheGet('rv_client_version_v1');
        if (cached) { applyVersionToElements(cached); return; }

        try {
            const res = await fetch(`${RV_API_BASE}/public/launcher/client-version`, { cache: 'no-store' });
            if (!res.ok) { applyVersionToElements(''); return; }
            const data = await res.json();
            const v = data && data.data ? String(data.data.version || '') : '';
            const clean = /^[A-Za-z0-9._\-]{1,32}$/.test(v) ? v : '';
            rvCacheSet('rv_client_version_v1', clean);
            applyVersionToElements(clean);
        } catch (_) {
            applyVersionToElements('');
        }
    }
    window.rvLoadClientVersion = rvLoadClientVersion;

    // ── Last played (локально, на основе фактических запусков) ──
    function rvSetLastPlayed(clientType) {
        if (!clientType || !/^[A-Za-z0-9_.\-]{1,50}$/.test(clientType)) return;
        try { localStorage.setItem('rv_last_played_' + clientType, String(Date.now())); } catch (_) {}
    }
    function rvGetLastPlayed(clientType) {
        try {
            const v = localStorage.getItem('rv_last_played_' + clientType);
            if (!v) return null;
            const n = parseInt(v, 10);
            return Number.isFinite(n) ? n : null;
        } catch (_) { return null; }
    }
    function rvPluralRu(n, forms) {
        // forms = [for 1, for 2..4, for 5..]
        const a = Math.abs(n) % 100;
        const b = a % 10;
        if (a > 10 && a < 20) return forms[2];
        if (b > 1 && b < 5)   return forms[1];
        if (b === 1)          return forms[0];
        return forms[2];
    }
    function rvFormatLastPlayed(ts) {
        if (!ts) return '';
        const diff = Math.max(0, Date.now() - ts);
        const min = Math.floor(diff / 60000);
        if (min < 1)  return "Hozirgina o'ynaldi";
        if (min < 60) return `${min} ${rvPluralRu(min, ['daqiqa','daqiqa','daqiqa'])} oldin o'ynaldi`;
        const hr = Math.floor(min / 60);
        if (hr < 24)  return `${hr} ${rvPluralRu(hr,  ['soat','soat','soat'])} oldin o'ynaldi`;
        const d = Math.floor(hr / 24);
        if (d === 1)  return "Kecha o'ynaldi";
        if (d < 30)   return `${d} ${rvPluralRu(d,    ['kun','kun','kun'])} oldin o'ynaldi`;
        return "Ancha bo'ldi o'ynalmagani";
    }
    function rvUpdateLastPlayed() {
        document.querySelectorAll('.js-rv-last-played[data-client-type]').forEach((el) => {
            const ct = el.getAttribute('data-client-type');
            const ts = rvGetLastPlayed(ct);
            if (ts) {
                el.textContent = rvFormatLastPlayed(ts);
                el.style.removeProperty('display');
            } else {
                el.textContent = '';
                el.style.display = 'none';
            }
        });
    }
    window.rvSetLastPlayed    = rvSetLastPlayed;
    window.rvGetLastPlayed    = rvGetLastPlayed;
    window.rvFormatLastPlayed = rvFormatLastPlayed;
    window.rvUpdateLastPlayed = rvUpdateLastPlayed;

    // ── Game last update (по data-client-type, с кешем) ──
    function rvFmtDateShort(iso) {
        if (!iso) return '';
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
        if (!m) return '';
        return `${m[3]}.${m[2]}`;
    }
    async function rvUpdateGameLastUpdates() {
        const els = document.querySelectorAll('.js-rv-game-last-update[data-client-type]');
        if (els.length === 0) return;
        // Группируем по clientType — несколько элементов на одну версию = 1 запрос.
        const seen = new Map();
        for (const el of els) {
            const ct = el.getAttribute('data-client-type');
            if (!ct || !/^[A-Za-z0-9_.\-]+$/.test(ct)) { el.textContent = ''; continue; }
            if (!seen.has(ct)) seen.set(ct, []);
            seen.get(ct).push(el);
        }
        for (const [ct, group] of seen) {
            const cacheKey = `rv_glu_v1_${ct}`;
            const cached = rvCacheGet(cacheKey);
            const apply = (val) => {
                const text = val ? `So'nggi yangilanish: ${rvFmtDateShort(val)}` : '';
                group.forEach((el) => {
                    el.classList.remove('rv-skel');
                    // Уберём инлайн-размер от скелетона, чтобы текст не обрезался.
                    el.style.removeProperty('width');
                    el.style.removeProperty('height');
                    el.style.removeProperty('display');
                    el.textContent = text;
                });
            };
            if (cached !== null && cached !== undefined) { apply(cached); continue; }
            try {
                const url = `${RV_API_BASE}/public/launcher/game-last-update?clientType=${encodeURIComponent(ct)}`;
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) { apply(''); continue; }
                const data = await res.json();
                const v = data && data.data ? data.data.gameLastUpdate : null;
                rvCacheSet(cacheKey, v || '');
                apply(v);
            } catch (_) { apply(''); }
        }
    }
    window.rvUpdateGameLastUpdates = rvUpdateGameLastUpdates;
    window.rvFmtDateShort = rvFmtDateShort;

    // ── Блок «браузерных» хоткеев на JS-уровне ──
    // Дублирует put_AreBrowserAcceleratorKeysEnabled(FALSE) на стороне нативки —
    // защита от старых WebView2-рантаймов, где Settings3 нет, и от любых
    // комбинаций, которые WebView2 пробрасывает в DOM до своих обработчиков.
    function rvIsEditable(el) {
        if (!el) return false;
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        return !!el.isContentEditable;
    }
    document.addEventListener('keydown', (e) => {
        const k = e.key;
        const ctrl = e.ctrlKey || e.metaKey;

        // Все F-клавиши (F1..F12, F13+): help / refresh / fullscreen / devtools / etc.
        if (/^F\d+$/.test(k)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Backspace вне полей ввода = history.back в WebView2.
        if (k === 'Backspace' && !rvIsEditable(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Alt + ← / Alt + → = back / forward.
        if (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Любые Ctrl/Cmd+<буква> кроме базовых editing-комбо.
        if (ctrl) {
            const key = (k || '').toLowerCase();
            // Разрешаем стандартный edit (выделить, копировать, вставить,
            // вырезать, undo/redo) — без них поля ввода ломаются.
            const editingAllowed = ['a', 'c', 'v', 'x', 'z', 'y'];
            if (editingAllowed.includes(key) && !e.shiftKey && !e.altKey) return;
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    function init() {
        injectSkelCss();
        rvLoadClientVersion();
        rvUpdateLastPlayed();
        rvUpdateGameLastUpdates();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
