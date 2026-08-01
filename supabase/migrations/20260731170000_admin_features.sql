/*
# Mixer Visuals — Admin funksiyalari va tariflar tozalash

1. 7 kunlik va 60 kunlik tariflar o'chiriladi. 30/90/180 kun faol.
2. plans jadvali uchun admin polisalari (admin tariflarni boshqaradi).
3. license_keys yangilash polisasi mustahkamlanadi — kalitni faqat o'zi ishlatgan odam bog'lay oladi.
*/

-- ===== 1. Tariflarni tozalash =====
DELETE FROM public.plans WHERE code IN ('7days', '60days');

UPDATE public.plans SET active = true WHERE code IN ('30days', '90days', '180days');

-- ===== 2. plans polisalari (admin boshqaradi) =====
DROP POLICY IF EXISTS "plans_update_admin" ON public.plans;
CREATE POLICY "plans_update_admin" ON public.plans FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "plans_insert_admin" ON public.plans;
CREATE POLICY "plans_insert_admin" ON public.plans FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "plans_delete_admin" ON public.plans;
CREATE POLICY "plans_delete_admin" ON public.plans FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== 3. license_keys polisasini mustahkamlash =====
DROP POLICY IF EXISTS "keys_update_activate" ON public.license_keys;
CREATE POLICY "keys_update_activate" ON public.license_keys FOR UPDATE
  TO authenticated USING (true)
  WITH CHECK (used_by = auth.uid());
