# Mixer Visuals

Minecraft 1.21.4 uchun visual helper: launcher + mod + obuna tizimi (Supabase).

## Sayt va yuklab olish

- **Sayt:** https://mixervisualsuz.github.io/
- **Launcher:** [MixerVisualsLauncher.exe](https://github.com/MixerVisualsUz/MixerVisuals/releases/latest/download/MixerVisualsLauncher.exe)
- **Mod (faqat binary):** [MixerVisuals.jar](https://github.com/MixerVisualsUz/MixerVisuals/releases/latest/download/MixerVisuals.jar)

## Qanday ishlaydi

1. Foydalanuvchi saytdan launcher'ni yuklab oladi.
2. Launcher o'zi Minecraft'ni (Fabric 1.21.4 + modlar bilan) o'rnatadi.
3. O'ynash uchun saytda ro'yxatdan o'tish + obuna sotib olish kerak (admin tasdiqlaydi).
4. Launcher har safar Supabase'dan tekshiradi: **obuna + HWID** (har kompyuterga akkount bog'lanadi).
   - Obuna yo'q → `no_subscription`, muddati tugagan → `expired`, boshqa kompyuter → `hwid_mismatch`.
5. Mod jar himoyalangan (nomlar scrambllangan + integrity tekshiruvi), source maxfiy.

## Tuzilishi

```
├── src/                  # Sayt (React + Vite + Tailwind)
├── public/               # Sayt statik fayllari
├── supabase/             # Supabase SQL (migratsiyalar, RPC)
├── MixerVisualsLauncher/ # Electron launcher (main.js + ui + modlar)
├── MixerVisualsMod/      # Mod manbasi (repo'ga kiritilmagan — maxfiy)
└── .github/workflows/    # GitHub Pages deploy
```

## Backend

- **Supabase:** `https://qkgbzuiipphoisvvfdlo.supabase.co` (anon key public — `.env.example` da)
- `auto_login` RPC: email + HWID orqali obuna holatini qaytaradi (sql: `supabase/migrations/20260801020004_auto_login.sql`)

## Ishlab chiqish

```bash
npm install
npm run dev        # sayt lokal
npm run build      # sayt build
```

Launcher: `cd MixerVisualsLauncher && npm install && npm start`

## Litsenziya

Maxsus shartlar: mod binary va backend faqat obuna egalari uchun. Sayt va launcher manbasi ushbu repo'da ochiq.
