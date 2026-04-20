
-- 1. Tabla app_assets
CREATE TABLE public.app_assets (
  key text PRIMARY KEY,
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view app_assets"
  ON public.app_assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin insert app_assets"
  ON public.app_assets FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin update app_assets"
  ON public.app_assets FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin delete app_assets"
  ON public.app_assets FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_app_assets_updated_at
  BEFORE UPDATE ON public.app_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Bucket público app-assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read app-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-assets');

CREATE POLICY "Super admin upload app-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin update app-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin delete app-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'super_admin'));

-- 3. Columna foto_url en fincas
ALTER TABLE public.fincas ADD COLUMN IF NOT EXISTS foto_url text;
