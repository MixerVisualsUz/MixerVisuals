/*
# Mixer Visuals — Atomik kalit aktivatsiyasi + yakuniy tozalash

1. activate_key(text) — litsenziya kalitini atomik (ikki odam bir vaqtda
   ishlata olmaydi) faollashtiradi va obunani biriktiradi.
2. Barcha test foydalanuvchilari va orfans profillar tozalanadi.
*/

-- ===== 1. Atomik kalit aktivatsiyasi =====
CREATE OR REPLACE FUNCTION public.activate_key(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key public.license_keys%ROWTYPE;
  v_plan public.plans%ROWTYPE;
  v_expires date;
  v_new_plan text;
BEGIN
  SELECT * INTO v_key FROM public.license_keys WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bunday kalit topilmadi');
  END IF;
  IF v_key.used_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Bu kalit allaqachon ishlatilgan');
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE code = v_key.plan_code LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Kalit rejasi topilmadi');
  END IF;

  UPDATE public.license_keys
  SET used_by = auth.uid(), used_at = now()
  WHERE id = v_key.id AND used_by IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bu kalit allaqachon ishlatilgan');
  END IF;

  IF v_plan.duration_days = -1 THEN
    v_new_plan := 'lifetime';
    v_expires := NULL;
  ELSE
    SELECT COALESCE(subscription_expires, CURRENT_DATE) INTO v_expires
    FROM public.profiles WHERE id = auth.uid();
    IF v_expires IS NULL OR v_expires < CURRENT_DATE THEN
      v_expires := CURRENT_DATE;
    END IF;
    v_expires := v_expires + v_plan.duration_days;
    v_new_plan := v_plan.code;
  END IF;

  UPDATE public.profiles
  SET subscription_plan = v_new_plan, subscription_expires = v_expires
  WHERE id = auth.uid();

  RETURN jsonb_build_object('ok', true, 'plan', v_new_plan, 'expires', v_expires);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_key(text) TO authenticated;

-- ===== 2. Test foydalanuvchilar va orfans profillar =====
DELETE FROM auth.users WHERE email LIKE '%@mailinator.com';

DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
