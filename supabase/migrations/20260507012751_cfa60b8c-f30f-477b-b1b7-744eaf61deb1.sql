-- animales_finca: permitir CRUD a operarios con acceso a la finca
DROP POLICY IF EXISTS "insert animales_finca admin" ON public.animales_finca;
DROP POLICY IF EXISTS "update animales_finca admin" ON public.animales_finca;
DROP POLICY IF EXISTS "delete animales_finca admin" ON public.animales_finca;

CREATE POLICY "insert animales_finca by finca" ON public.animales_finca
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id));
CREATE POLICY "update animales_finca by finca" ON public.animales_finca
  FOR UPDATE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete animales_finca by finca" ON public.animales_finca
  FOR DELETE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));

-- potreros: idem
DROP POLICY IF EXISTS "insert potreros admin" ON public.potreros;
DROP POLICY IF EXISTS "update potreros admin" ON public.potreros;
DROP POLICY IF EXISTS "delete potreros admin" ON public.potreros;

CREATE POLICY "insert potreros by finca" ON public.potreros
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id));
CREATE POLICY "update potreros by finca" ON public.potreros
  FOR UPDATE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete potreros by finca" ON public.potreros
  FOR DELETE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));