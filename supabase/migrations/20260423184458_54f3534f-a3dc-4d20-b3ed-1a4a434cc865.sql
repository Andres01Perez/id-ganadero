DROP POLICY IF EXISTS "Animal fotos view by animal access" ON storage.objects;
DROP POLICY IF EXISTS "Animal fotos upload by animal access" ON storage.objects;
DROP POLICY IF EXISTS "Animal fotos update by animal access" ON storage.objects;
DROP POLICY IF EXISTS "Animal fotos delete by animal access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view animal fotos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload animal fotos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update animal fotos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete animal fotos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload animal fotos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update animal fotos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete animal fotos" ON storage.objects;

CREATE POLICY "Animal fotos view by animal access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'animal-fotos'
  AND public.user_can_access_animal(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Animal fotos upload by animal access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-fotos'
  AND public.user_can_access_animal(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Animal fotos update by animal access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'animal-fotos'
  AND public.user_can_access_animal(auth.uid(), (storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'animal-fotos'
  AND public.user_can_access_animal(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Animal fotos delete by animal access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-fotos'
  AND public.user_can_access_animal(auth.uid(), (storage.foldername(name))[1]::uuid)
);