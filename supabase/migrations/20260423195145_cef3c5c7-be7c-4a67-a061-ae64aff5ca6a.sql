-- Limpiar políticas previas del bucket app-assets para evitar conflictos
DROP POLICY IF EXISTS "Super admin upload app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin update app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin delete app-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view app-assets" ON storage.objects;
DROP POLICY IF EXISTS "App assets public read" ON storage.objects;

-- Lectura pública (el bucket es público)
CREATE POLICY "App assets public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'app-assets');

-- Subir: solo super_admin
CREATE POLICY "App assets super admin insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-assets'
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- Actualizar (upsert): solo super_admin
CREATE POLICY "App assets super admin update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-assets'
  AND has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  bucket_id = 'app-assets'
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- Borrar: solo super_admin
CREATE POLICY "App assets super admin delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-assets'
  AND has_role(auth.uid(), 'super_admin'::app_role)
);