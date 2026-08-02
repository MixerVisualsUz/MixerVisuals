-- ===== Abadiy bloklistlar: IP va Email =====
-- Ro'yxatdan o'tish register-account funksiyasi orqali tekshiriladi:
-- bloklangan IP/email dan hech qachon akkount ochib bo'lmaydi.

create table if not exists public.blocked_ips (
  id uuid primary key default gen_random_uuid(),
  ip text not null unique,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.blocked_ips enable row level security;
alter table public.blocked_emails enable row level security;

drop policy if exists "blocked_ips_admin_all" on public.blocked_ips;
create policy "blocked_ips_admin_all" on public.blocked_ips
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "blocked_emails_admin_all" on public.blocked_emails;
create policy "blocked_emails_admin_all" on public.blocked_emails
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Gemini spam akkountlarining emaillarini abadiy bloklash
insert into public.blocked_emails (email, note) values
  ('geminiqandayishlayapt1@gmail.com', 'gemini spam'),
  ('geminiqandayishlayapt2@gmail.com', 'gemini spam'),
  ('geminiqandayishlayapt3@gmail.com', 'gemini spam'),
  ('geminiqandayishlayapt4@gmail.com', 'gemini spam'),
  ('geminiqandayishlayapti8@gmail.com', 'gemini spam'),
  ('geminiqandayishlayapti9@gmail.com', 'gemini spam')
on conflict (email) do nothing;

-- Vaqtinchalik tekshiruv view'ini o'chirish
drop view if exists public.v_gemini_signup_ips;
