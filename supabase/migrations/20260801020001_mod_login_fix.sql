/*
# Mixer Visuals — mod_login tuzatish (pgcrypto extensions schemasida)

Supabase'da pgcrypto 'extensions' schemasida o'rnatilgan — crypt() chaqiruvini
to'g'rilaymiz va yangi foydalanuvchilar uchun mod_login qayta yaratamiz.
*/

CREATE OR REPLACE FUNCTION public.mod_login(p_email text, p_password text, p_hwid text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_enc text;
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF p_email IS NULL OR p_password IS NULL OR p_hwid IS NULL OR p_hwid = '' THEN
    RETURN jsonb_build_object('error', 'invalid_request');
  END IF;

  SELECT id, encrypted_password INTO v_uid, v_enc
  FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'bad_credentials');
  END IF;
  IF v_enc IS NULL OR v_enc = '' OR v_enc <> extensions.crypt(p_password, v_enc) THEN
    RETURN jsonb_build_object('error', 'bad_credentials');
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

REVOKE ALL ON FUNCTION public.mod_login(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mod_login(text, text, text) TO anon, authenticated;
