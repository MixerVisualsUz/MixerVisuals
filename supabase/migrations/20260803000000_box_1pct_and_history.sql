-- Box: 1 oylik obuna yutish foizi 5% -> 1%, foizlar qayta taqsimlandi:
--   74% -> BONUS5 (5% chegirma)
--   10% -> BONUS10 (10% chegirma)
--   15% -> BONUS15 (15% chegirma)
--    1% -> akkauntga to'g'ridan-to'g'ri 1 oylik obuna
-- Qo'shimcha: box_history jadvali — har bir yutuq yozib boriladi (admin nazorati)

CREATE TABLE IF NOT EXISTS public.box_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  prize text NOT NULL,
  detail text
);

ALTER TABLE public.box_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS box_history_insert_own ON public.box_history;
CREATE POLICY box_history_insert_own ON public.box_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS box_history_select_own_or_admin ON public.box_history;
CREATE POLICY box_history_select_own_or_admin ON public.box_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

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
  IF NOT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND last_box_open > now() - interval '24 hours'
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Kuniga faqat 1 marta ochish mumkin. Ertaga qayta urinib ko''ring.'
    );
  END IF;

  UPDATE public.profiles SET last_box_open = now() WHERE id = auth.uid();

  v_roll := floor(random() * 100) + 1;

  IF v_roll <= 74 THEN
    v_code := 'BONUS5-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.promocodes (code, discount_percent, max_uses, active)
    VALUES (v_code, 5, 1, true);
    INSERT INTO public.box_history (user_id, prize, detail) VALUES (auth.uid(), 'promo5', v_code);
    RETURN jsonb_build_object('type', 'promo', 'code', v_code, 'discount_percent', 5);

  ELSIF v_roll <= 84 THEN
    v_code := 'BONUS10-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.promocodes (code, discount_percent, max_uses, active)
    VALUES (v_code, 10, 1, true);
    INSERT INTO public.box_history (user_id, prize, detail) VALUES (auth.uid(), 'promo10', v_code);
    RETURN jsonb_build_object('type', 'promo', 'code', v_code, 'discount_percent', 10);

  ELSIF v_roll <= 99 THEN
    v_code := 'BONUS15-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.promocodes (code, discount_percent, max_uses, active)
    VALUES (v_code, 15, 1, true);
    INSERT INTO public.box_history (user_id, prize, detail) VALUES (auth.uid(), 'promo15', v_code);
    RETURN jsonb_build_object('type', 'promo', 'code', v_code, 'discount_percent', 15);

  ELSE
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

    INSERT INTO public.box_history (user_id, prize, detail) VALUES (auth.uid(), 'subscription_30d', v_exp::text);

    RETURN jsonb_build_object('type', 'subscription', 'expires', v_exp);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.open_box() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_box() TO authenticated;
