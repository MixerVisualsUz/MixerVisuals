-- ==================== SOZLAMALAR (settings) ====================
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_auth" ON public.settings;
CREATE POLICY "settings_select_auth" ON public.settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON public.settings;
CREATE POLICY "settings_update_admin" ON public.settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, UPDATE ON public.settings TO authenticated;

INSERT INTO public.settings (key, value) VALUES ('hwid_reset_price', '10000')
ON CONFLICT (key) DO NOTHING;
