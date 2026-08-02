-- VAQTINCHALIK tekshiruv: gemini akkountlari va IP'lar
create table if not exists public.debug_gemini_ips (email text, ip text, created_at timestamptz);

insert into public.debug_gemini_ips
select r.email, r.ip, r.created_at from public.registration_ips r where r.email like 'gemini%';

insert into public.debug_gemini_ips
select u.email, null, u.created_at from auth.users u
where u.email like 'gemini%' and u.email not in (select email from public.debug_gemini_ips);
