import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    if (!ip) return json({ allowed: false, reason: 'no_ip' });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: blocked } = await admin.from('blocked_ips').select('id').eq('ip', ip).maybeSingle();
    if (blocked) return json({ allowed: false, reason: 'ip_ban', country_code: null });

    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!resp || !resp.ok) return json({ allowed: true, reason: 'unknown' });
    const geo = await resp.json().catch(() => null);
    if (!geo || geo.success !== true) return json({ allowed: true, reason: 'unknown' });

    const countryCode = String(geo.country_code || '').toUpperCase();
    return json({ allowed: countryCode === 'UZ', country_code: countryCode, country: geo.country || '' });
  } catch {
    return json({ allowed: true, reason: 'unknown' });
  }
});
