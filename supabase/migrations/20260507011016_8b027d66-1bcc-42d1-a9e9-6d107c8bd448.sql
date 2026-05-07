-- Bucket público para fotos de empleados
INSERT INTO storage.buckets (id, name, public)
VALUES ('empleado-fotos', 'empleado-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura: cualquier usuario activo
CREATE POLICY "empleado-fotos read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'empleado-fotos' AND public.is_active_user(auth.uid()));

-- Insert: solo admin/super_admin
CREATE POLICY "empleado-fotos insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'empleado-fotos' AND public.is_admin_or_super(auth.uid()));

-- Update: solo admin/super_admin
CREATE POLICY "empleado-fotos update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'empleado-fotos' AND public.is_admin_or_super(auth.uid()));

-- Delete: solo admin/super_admin
CREATE POLICY "empleado-fotos delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'empleado-fotos' AND public.is_admin_or_super(auth.uid()));