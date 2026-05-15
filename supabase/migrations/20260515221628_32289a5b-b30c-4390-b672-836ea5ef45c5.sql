
INSERT INTO storage.buckets (id, name, public)
VALUES ('finca-fotos', 'finca-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "finca-fotos public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'finca-fotos');

CREATE POLICY "finca-fotos admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'finca-fotos' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "finca-fotos admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'finca-fotos' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "finca-fotos admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'finca-fotos' AND public.is_admin_or_super(auth.uid()));
