/*
# Mixer Visuals — Admin boshqaruv polisalari

Admin foydalanuvchilarni boshqara olishi, to'lovlarni tasdiqlashi va
litsenziya kalitlarini o'chira olishi uchun RLS polisalar.
*/

-- Admin boshqa foydalanuvchilarni tahrirlay oladi (obuna, blok, HWID)
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin to'lovlarni tasdiqlaydi/rad etadi
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin litsenziya kalitlarini o'chira oladi
DROP POLICY IF EXISTS "keys_delete_admin" ON public.license_keys;
CREATE POLICY "keys_delete_admin" ON public.license_keys FOR DELETE
  TO authenticated USING (public.is_admin());
