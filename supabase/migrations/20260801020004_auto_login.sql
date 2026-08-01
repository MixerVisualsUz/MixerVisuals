-- Mixer Visuals: auto_login — parolsiz HWID autolink
-- Fayl nomidan olingan email orqali: obuna + HWID tekshiruvi
--   obuna yo'q              -> no_subscription / expired
--   HWID boshqa userda      -> hwid_mismatch
--   HWID hali yo'q          -> avtomatik bog'lanadi (birinchi kompyuter)
--   HWID mos                -> ok

CREATE OR REPLACE FUNCTION public.auto_login(p_email text, p_hwid text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF p_email IS NULL OR p_hwid IS NULL OR p_hwid = '' THEN
    RETURN jsonb_build_object('error', 'invalid_request');
  END IF;

  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'no_account');
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE hwid = p_hwid AND id <> v_uid) THEN
    RETURN jsonb_build_object('error', 'hwid_mismatch');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_missing');
  END IF;
  IF v_profile.blocked THEN
    RETURN jsonb_build_object('error', 'blocked');
  END IF;

  IF v_profile.hwid IS NULL OR v_profile.hwid = '' THEN
    UPDATE public.profiles SET hwid = p_hwid WHERE id = v_uid;
    v_profile.hwid := p_hwid;
  ELSIF v_profile.hwid <> p_hwid THEN
    RETURN jsonb_build_object('error', 'hwid_mismatch');
  END IF;

  IF v_profile.subscription_plan IS NULL THEN
    RETURN jsonb_build_object('error', 'no_subscription');
  END IF;
  IF v_profile.subscription_expires IS NOT NULL AND v_profile.subscription_expires < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'username', v_profile.username,
    'plan', v_profile.subscription_plan,
    'expires', v_profile.subscription_expires,
    'role', v_profile.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.auto_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_login(text, text) TO anon, authenticated;
