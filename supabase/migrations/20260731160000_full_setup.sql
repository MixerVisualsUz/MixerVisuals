/*
=====================================================================
Mixer Visuals — TO'LIQ BAZA SETUP (yangi Supabase loyihasi uchun)
=====================================================================
Qanday ishlatiladi:
1. https://supabase.com saytida akkaunt yarating (yoki kiring)
2. "New project" bosing, nom yozing, parol yozing, mintaqa tanlang
3. Chap tomondagi "SQL Editor" -> "New query" ni bosing
4. Bu fayldagi HAMMA kodni ko'chirib qo'ying -> Run bosing
5. "Settings" -> "API" bo'limidan URL va anon key ni nusxalang
6. .env faylida 2 qatorni yangilang (men yordam beraman)
=====================================================================
*/

-- ==================== PROFILES ====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  hwid text,
  subscription_plan text,
  subscription_expires date,
  blocked boolean NOT NULL DEFAULT false,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==================== PLANS ====================
CREATE TABLE IF NOT EXISTS public.plans (
  code text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  duration_days int NOT NULL,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_read_all" ON public.plans FOR SELECT
  TO anon, authenticated USING (true);

-- ==================== LICENSE KEYS ====================
CREATE TABLE IF NOT EXISTS public.license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_code text NOT NULL,
  used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  receipt_path text,
  promo_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ==================== PROMOCODES ====================
CREATE TABLE IF NOT EXISTS public.promocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  max_uses int NOT NULL DEFAULT -1,
  used_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;

-- ==================== ADMIN TEKSHIRUV FUNKSIYASI (rekursiyasiz) ====================
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

-- ==================== RLS POLISALAR ====================
-- profiles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- license_keys
CREATE POLICY "keys_select_own_or_admin" ON public.license_keys FOR SELECT
  TO authenticated USING (used_by = auth.uid() OR public.is_admin());

CREATE POLICY "keys_insert_admin" ON public.license_keys FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "keys_update_activate" ON public.license_keys FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- payments
CREATE POLICY "payments_select_own_or_admin" ON public.payments FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_update_own" ON public.payments FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- promocodes
CREATE POLICY "promocodes_select_admin" ON public.promocodes FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "promocodes_insert_admin" ON public.promocodes FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "promocodes_update_admin" ON public.promocodes FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "promocodes_delete_admin" ON public.promocodes FOR DELETE
  TO authenticated USING (public.is_admin());

-- ==================== PROMOKOD FUNKSIYALARI ====================
CREATE OR REPLACE FUNCTION public.validate_promocode(p_code text)
RETURNS TABLE(code text, discount_percent int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pc.code, pc.discount_percent
  FROM public.promocodes pc
  WHERE pc.code = upper(p_code)
    AND pc.active = true
    AND (pc.max_uses = -1 OR pc.used_count < pc.max_uses)
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promocode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promocode(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.use_promocode(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promocodes
  SET used_count = used_count + 1
  WHERE code = upper(p_code) AND active = true;
END;
$$;

REVOKE ALL ON FUNCTION public.use_promocode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_promocode(text) TO authenticated;

-- ==================== RO'YXATDAN O'TISH TRIGGERI ====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_ref_code text;
  v_ref_by uuid;
  v_ref_input text;
  v_is_first boolean;
  v_role text := 'user';
BEGIN
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_ref_code := v_username;

  SELECT NOT EXISTS(SELECT 1 FROM public.profiles) INTO v_is_first;
  IF v_is_first THEN
    v_role := 'admin';
  END IF;

  IF EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_ref_code) THEN
    v_ref_code := v_ref_code || '-' || substr(md5(random()::text), 1, 4);
  END IF;

  v_ref_input := NULLIF(new.raw_user_meta_data->>'referred_by', '');
  IF v_ref_input IS NOT NULL THEN
    SELECT id INTO v_ref_by FROM public.profiles WHERE referral_code = v_ref_input LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, username, email, role, referral_code, referred_by)
  VALUES (new.id, v_username, new.email, v_role, v_ref_code, v_ref_by)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== PROFIL KAFOLAT FUNKSIYASI ====================
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

-- ==================== TARIFLAR (seed) ====================
INSERT INTO public.plans (code, name, price, duration_days, active) VALUES
  ('7days', '7 kun', 25000, 7, false),
  ('30days', '30 kun', 60000, 30, true),
  ('60days', '60 kun', 110000, 60, true),
  ('90days', '90 kun', 160000, 90, true),
  ('180days', '180 kun', 280000, 180, true),
  ('lifetime', 'Cheksiz', 150000, -1, false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  duration_days = EXCLUDED.duration_days,
  active = EXCLUDED.active;

-- ==================== CHEK RASMLARI BUCKET ====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "receipts_read_all" ON storage.objects;
CREATE POLICY "receipts_read_all" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_insert_own" ON storage.objects;
CREATE POLICY "receipts_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "receipts_update_own" ON storage.objects;
CREATE POLICY "receipts_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ==================== O'ZINGIZNI ADMIN QILISH ====================
-- Saytda birinchi bo'lib ro'yxatdan o'tganingizda avtomatik admin bo'lasiz.
-- Agar kerak bo'lsa, quyidagi qatorda emailni o'zgartirib Run bosing:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'sizning@emailingiz.com';
