-- ============================================================
-- Config kodlari orqali ulashish (shared configs)
-- XXXX-XXXX-XXXX-XXXX formatidagi qisqa kodlar
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shared_configs (
    code       text PRIMARY KEY,
    payload    text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1. create_shared_config(p_payload) -> jsonb {code} | {error}
--    Konfig payload'ini saqlaydi va 16 belgili kod qaytaradi
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_shared_config(p_payload text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code text;
    v_i int;
BEGIN
    IF p_payload IS NULL OR length(p_payload) < 10 OR length(p_payload) > 50000 THEN
        RETURN jsonb_build_object('error', 'invalid payload');
    END IF;
    FOR v_i IN 1..12 LOOP
        v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
                         substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
                         substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' ||
                         substr(md5(random()::text || clock_timestamp()::text), 1, 4));
        BEGIN
            INSERT INTO public.shared_configs(code, payload) VALUES (v_code, p_payload);
            RETURN jsonb_build_object('code', v_code);
        EXCEPTION WHEN unique_violation THEN
            CONTINUE;
        END;
    END LOOP;
    RETURN jsonb_build_object('error', 'failed');
END;
$$;

-- ============================================================
-- 2. get_shared_config(p_code) -> text (payload) | null
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_shared_config(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payload text;
BEGIN
    IF p_code IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT payload INTO v_payload
    FROM public.shared_configs
    WHERE code = upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'))
    LIMIT 1;
    RETURN v_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.create_shared_config(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_config(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_shared_config(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_config(text) TO anon, authenticated;
