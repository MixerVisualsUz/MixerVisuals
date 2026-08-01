-- ==================== BONUS (BOX) TIZIMI ====================
-- "Bonus" bo'limidagi box ochilganda aniq foizlar bo'yicha sovg'a beradi:
--   70% -> 5% chegirma promokodi (BONUS5-XXXXXX, 1 marta ishlatiladigan)
--   10% -> 10% chegirma promokodi (BONUS10-XXXXXX, 1 marta ishlatiladigan)
--   15% -> 15% chegirma promokodi (BONUS15-XXXXXX, 1 marta ishlatiladigan)
--   5%  -> akkauntga to'g'ridan-to'g'ri 1 oylik obuna qo'shiladi
-- Qo'shimcha: kuniga 1 marta ochish cheklovi (suiiste'molni oldini olish uchun)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_box_open timestamptz;

CREATE OR REPLACE FUNCTION public.open_box()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roll int;
  v_code text;
  v_exp date;
BEGIN
  -- Kuniga 1 marta cheklovi (admin'lar uchun cheksiz)
  IF NOT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND last_box_open > now() - interval '24 hours'
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Kuniga faqat 1 marta ochish mumkin. Ertaga qayta urinib ko‘ring.'
    );
  END IF;

  UPDATE public.profiles SET last_box_open = now() WHERE id = auth.uid();

  -- 1..100 oralig'ida real tasodifiy son
  v_roll := floor(random() * 100) + 1;

  IF v_roll <= 70 THEN
    -- 70%: 5% chegirma
    v_code := 'BONUS5-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.promocodes (code, discount_percent, max_uses, active)
    VALUES (v_code, 5, 1, true);
    RETURN jsonb_build_object('type', 'promo', 'code', v_code, 'discount_percent', 5);

  ELSIF v_roll <= 80 THEN
    -- 10%: 10% chegirma
    v_code := 'BONUS10-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.promocodes (code, discount_percent, max_uses, active)
    VALUES (v_code, 10, 1, true);
    RETURN jsonb_build_object('type', 'promo', 'code', v_code, 'discount_percent', 10);

  ELSIF v_roll <= 95 THEN
    -- 15%: 15% chegirma
    v_code := 'BONUS15-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.promocodes (code, discount_percent, max_uses, active)
    VALUES (v_code, 15, 1, true);
    RETURN jsonb_build_object('type', 'promo', 'code', v_code, 'discount_percent', 15);

  ELSE
    -- 5%: 1 oylik obuna to'g'ridan-to'g'ri akkauntga
    v_exp := GREATEST(
      COALESCE(
        (SELECT subscription_expires FROM public.profiles WHERE id = auth.uid()),
        CURRENT_DATE
      ),
      CURRENT_DATE
    ) + 30;

    UPDATE public.profiles
    SET subscription_plan = '30days',
        subscription_expires = v_exp
    WHERE id = auth.uid();

    RETURN jsonb_build_object('type', 'subscription', 'expires', v_exp);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.open_box() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_box() TO authenticated;
