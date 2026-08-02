-- Ro'yxatdan o'tgan qurilma haqida ma'lumot (user-agent)
alter table public.registration_ips add column if not exists device text;
