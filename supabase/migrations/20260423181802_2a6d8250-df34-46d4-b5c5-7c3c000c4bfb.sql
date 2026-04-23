DROP POLICY IF EXISTS "Animal fotos public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read app-assets" ON storage.objects;

DROP POLICY IF EXISTS "App assets visibles a usuarios autenticados" ON storage.objects;
CREATE POLICY "App assets visibles a usuarios autenticados"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'app-assets');