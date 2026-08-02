-- Admin foydalanuvchining IP manzilini ko'ra oladi (IP BAN tugmasi uchun)
drop policy if exists "admin_read_registration_ips" on public.registration_ips;
create policy "admin_read_registration_ips" on public.registration_ips
  for select to authenticated
  using (public.is_admin());
