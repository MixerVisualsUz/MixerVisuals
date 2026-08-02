import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const IP_USED = 'Bu IP manzildan allaqachon akkount ochilgan — 1 ta IP dan faqat 1 ta akkount ochish mumkin';

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const rawIp = req.headers.get('x-forwarded-for') || '';
    const ip = rawIp.split(',')[0].trim();
    if (!ip) return json({ error: 'IP manzil aniqlanmadi' }, 400);

    const body = await req.json().catch(() => ({}));
    const username = String(body?.username || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!username || !email || !password) return json({ error: 'Barcha maydonlarni to\'ldiring' }, 400);
    if (password.length < 6) return json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: ipBlocked } = await admin.from('blocked_ips').select('id').eq('ip', ip).maybeSingle();
    if (ipBlocked) return json({ error: 'Bu IP manzil abadiy bloklangan — ro\'yxatdan o\'tish taqiqlangan' }, 403);

    const { data: emailBlocked } = await admin.from('blocked_emails').select('id').eq('email', email).maybeSingle();
    if (emailBlocked) return json({ error: 'Bu email abadiy bloklangan' }, 403);

    const geoResp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (geoResp?.ok) {
      const geo = await geoResp.json().catch(() => null);
      if (geo && geo.success === true && String(geo.country_code || '').toUpperCase() !== 'UZ') {
        return json({ error: 'Ro\'yxatdan o\'tish faqat O\'zbekiston hududidan mumkin' }, 403);
      }
    }

    const { data: existing } = await admin.from('registration_ips').select('id').eq('ip', ip).maybeSingle();
    if (existing) return json({ error: IP_USED }, 409);

    const { error: ipErr } = await admin.from('registration_ips').insert({ ip, email });
    if (ipErr) {
      if (ipErr.code === '23505' || (ipErr.message || '').toLowerCase().includes('duplicate')) {
        return json({ error: IP_USED }, 409);
      }
      return json({ error: 'Xatolik: ' + ipErr.message }, 500);
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (createErr || !created?.user) {
      await admin.from('registration_ips').delete().eq('ip', ip).eq('email', email).select();
      const msg = (createErr?.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' }, 409);
      }
      return json({ error: createErr?.message || 'Akkount yaratishda xatolik' }, 500);
    }

    return json({ ok: true, id: created.user.id }, 200);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
