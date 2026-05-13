
-- Tabla
CREATE TABLE public.galeria_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id uuid NOT NULL,
  storage_path text NOT NULL,
  url text NOT NULL,
  subido_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_galeria_fotos_finca_created ON public.galeria_fotos (finca_id, created_at DESC);

ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view galeria_fotos by finca"
ON public.galeria_fotos FOR SELECT TO authenticated
USING (public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "insert galeria_fotos by finca"
ON public.galeria_fotos FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user(auth.uid())
  AND subido_por = auth.uid()
  AND public.user_has_finca(auth.uid(), finca_id)
);

CREATE POLICY "delete galeria_fotos owner or admin"
ON public.galeria_fotos FOR DELETE TO authenticated
USING (subido_por = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria-finca', 'galeria-finca', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "galeria-finca public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'galeria-finca');

CREATE POLICY "galeria-finca insert by finca"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'galeria-finca'
  AND public.is_active_user(auth.uid())
  AND public.user_has_finca(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "galeria-finca delete owner or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'galeria-finca'
  AND (
    public.is_admin_or_super(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.galeria_fotos g
      WHERE g.storage_path = storage.objects.name
        AND g.subido_por = auth.uid()
    )
  )
);
