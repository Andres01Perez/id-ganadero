-- empleados
DROP POLICY IF EXISTS "delete empleados admin" ON public.empleados;
DROP POLICY IF EXISTS "insert empleados admin" ON public.empleados;
DROP POLICY IF EXISTS "update empleados admin" ON public.empleados;
DROP POLICY IF EXISTS "view empleados by finca" ON public.empleados;

CREATE POLICY "empleados select"
  ON public.empleados
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_super(auth.uid())
    OR (
      public.is_active_user(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.empleado_fincas ef
        WHERE ef.empleado_id = empleados.id
          AND public.user_has_finca(auth.uid(), ef.finca_id)
      )
    )
  );

CREATE POLICY "empleados insert admin"
  ON public.empleados
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "empleados update admin"
  ON public.empleados
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "empleados delete admin"
  ON public.empleados
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

-- empleado_fincas
DROP POLICY IF EXISTS "delete empleado_fincas admin" ON public.empleado_fincas;
DROP POLICY IF EXISTS "insert empleado_fincas admin" ON public.empleado_fincas;
DROP POLICY IF EXISTS "view empleado_fincas by finca" ON public.empleado_fincas;

CREATE POLICY "empleado_fincas select"
  ON public.empleado_fincas
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_super(auth.uid())
    OR public.user_has_finca(auth.uid(), finca_id)
  );

CREATE POLICY "empleado_fincas insert admin"
  ON public.empleado_fincas
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "empleado_fincas delete admin"
  ON public.empleado_fincas
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_super(auth.uid()));