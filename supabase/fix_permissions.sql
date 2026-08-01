/*
# Mixer Visuals — POLISALAR TUZATISH (muhim!)

Muammo: "infinite recursion detected in policy for relation 'profiles'"
Sabab: polisalar ichida profiles jadvaliga o'z-o'ziga murojaat (EXISTS subquery) RLS bilan rekursiya qilyapti.

Yechim: admin tekshiruvi SECURITY DEFINER funksiyaga ko'chirildi (RLS'ni chetlab o'tadi).

Supabase Dashboard -> SQL Editor -> hammasini ko'chirib Run qiling.
*/

-- ===== 1. is_admin() funksiyasi (RLS chetlab o'tadi, rekursiya yo'q) =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ===== 2. profiles polisalarini tuzatish =====
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id AND role = 'user');

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- ===== 3. license_keys polisalari =====
DROP POLICY IF EXISTS "keys_select_own_or_admin" ON public.license_keys;
CREATE POLICY "keys_select_own_or_admin" ON public.license_keys FOR SELECT
  TO authenticated USING (used_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "keys_insert_admin" ON public.license_keys;
CREATE POLICY "keys_insert_admin" ON public.license_keys FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "keys_update_activate" ON public.license_keys;
CREATE POLICY "keys_update_activate" ON public.license_keys FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ===== 4. payments polisalari =====
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;
CREATE POLICY "payments_select_own_or_admin" ON public.payments FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- ===== 5. promocodes polisalari =====
DROP POLICY IF EXISTS "promocodes_select_admin" ON public.promocodes;
CREATE POLICY "promocodes_select_admin" ON public.promocodes FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "promocodes_insert_admin" ON public.promocodes;
CREATE POLICY "promocodes_insert_admin" ON public.promocodes FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "promocodes_update_admin" ON public.promocodes;
CREATE POLICY "promocodes_update_admin" ON public.promocodes FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "promocodes_delete_admin" ON public.promocodes;
CREATE POLICY "promocodes_delete_admin" ON public.promocodes FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== 6. ensure_profile (profil yo'q bo'lsa avtomatik yaratadi) =====
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_username text;
  v_ref text;
  v_is_first boolean;
  v_role text := 'user';
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN to_jsonb(v_profile);
  END IF;

  v_username := COALESCE((auth.jwt() -> 'user_metadata' ->> 'username'), split_part(auth.jwt() ->> 'email', '@', 1), 'user');
  v_ref := v_username;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username OR referral_code = v_ref) THEN
    v_ref := v_username || '-' || substr(md5(random()::text), 1, 4);
    v_username := v_ref;
  END IF;

  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first;
  IF v_is_first THEN v_role := 'admin'; END IF;

  INSERT INTO public.profiles (id, username, email, role, referral_code)
  VALUES (auth.uid(), v_username, auth.jwt() ->> 'email', v_role, v_ref)
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;

-- ===== 7. O'zingizni admin qilish =====
-- QUYIDAGI emailni o'zingiznikiga almashtiring va Run bosing:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'sizning@emailingiz.com';
