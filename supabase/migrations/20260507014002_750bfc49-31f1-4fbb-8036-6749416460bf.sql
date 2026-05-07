DROP POLICY IF EXISTS "insert tipos_animal_finca admin" ON public.tipos_animal_finca;

CREATE POLICY "insert tipos_animal_finca active user"
  ON public.tipos_animal_finca
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()));