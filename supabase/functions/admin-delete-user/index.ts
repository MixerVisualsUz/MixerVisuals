import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const client = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await client.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Kirish talab qilinadi' }), { status: 401, headers });

    const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin huquqi yo‘q' }), { status: 403, headers });
    }

    const body = await req.json();
    const uid = String(body?.id || '');
    if (!uid) return new Response(JSON.stringify({ error: 'id berilmagan' }), { status: 400, headers });
    if (uid === user.id) return new Response(JSON.stringify({ error: 'O‘z akkountingizni o‘chira olmaysiz' }), { status: 400, headers });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers });
  }
});
