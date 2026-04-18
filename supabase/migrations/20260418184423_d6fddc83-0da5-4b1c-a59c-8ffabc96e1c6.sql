DROP POLICY IF EXISTS "Animal fotos visibles públicamente" ON storage.objects;

CREATE POLICY "Animal fotos visibles a usuarios activos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'animal-fotos'
  AND public.is_active_user(auth.uid())
);