-- 1 IP manzildan faqat 1 ta akkount: ro'yxatdan o'tgan IP'lar jadvali
create table if not exists public.registration_ips (
  id uuid primary key default gen_random_uuid(),
  ip text not null unique,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.registration_ips enable row level security;

-- Anon/userlar to'g'ridan-to'g'ri yozishlari taqiqlanadi (faqat edge function service role orqali ishlaydi)
create policy "no public access to registration_ips"
  on public.registration_ips
  for all
  using (false)
  with check (false);

comment on table public.registration_ips is 'Ro''yxatdan o''tgan IP manzillar — har bir IP dan faqat 1 ta akkount';
