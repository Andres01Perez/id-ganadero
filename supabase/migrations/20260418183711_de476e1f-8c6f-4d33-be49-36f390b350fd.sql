-- Crear bucket público para fotos de animales
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-fotos', 'animal-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas: cualquiera puede ver, solo admin/super_admin pueden subir/modificar/borrar
CREATE POLICY "Animal fotos visibles públicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'animal-fotos');

CREATE POLICY "Admin sube fotos de animales"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-fotos'
  AND public.is_admin_or_super(auth.uid())
);

CREATE POLICY "Admin actualiza fotos de animales"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'animal-fotos'
  AND public.is_admin_or_super(auth.uid())
);

CREATE POLICY "Admin elimina fotos de animales"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-fotos'
  AND public.is_admin_or_super(auth.uid())
);