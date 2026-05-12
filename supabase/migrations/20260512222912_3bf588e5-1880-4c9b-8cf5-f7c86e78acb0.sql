
-- ANIMALES: políticas globales (cualquier usuario activo)
DROP POLICY IF EXISTS "view animales by finca" ON public.animales;
DROP POLICY IF EXISTS "insert animales by finca" ON public.animales;
DROP POLICY IF EXISTS "update animales by finca" ON public.animales;
DROP POLICY IF EXISTS "delete animales by finca" ON public.animales;

CREATE POLICY "view animales global" ON public.animales
  FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "insert animales global" ON public.animales
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user(auth.uid())
    AND created_by = auth.uid()
    AND finca_id IS NOT NULL
  );

CREATE POLICY "update animales global" ON public.animales
  FOR UPDATE TO authenticated
  USING (public.is_active_user(auth.uid()))
  WITH CHECK (public.is_active_user(auth.uid()) AND finca_id IS NOT NULL);

CREATE POLICY "delete animales global" ON public.animales
  FOR DELETE TO authenticated
  USING (public.is_active_user(auth.uid()));

-- Helpers: tablas hijas con animal_id
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'vacunaciones','medicaciones','pesajes','palpaciones','inseminaciones',
    'chequeos_veterinarios','dietas','ciclos_calor','aspiraciones',
    'campeonatos','embriones_detalle'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "view %1$s" ON public.%1$s;', t);
    EXECUTE format('DROP POLICY IF EXISTS "insert %1$s" ON public.%1$s;', t);
    EXECUTE format('DROP POLICY IF EXISTS "update %1$s" ON public.%1$s;', t);
    EXECUTE format('DROP POLICY IF EXISTS "delete %1$s" ON public.%1$s;', t);
    -- chequeos has slightly different name
  END LOOP;
END $$;

-- chequeos_veterinarios specific old names
DROP POLICY IF EXISTS "view chequeos" ON public.chequeos_veterinarios;
DROP POLICY IF EXISTS "insert chequeos" ON public.chequeos_veterinarios;
DROP POLICY IF EXISTS "update chequeos" ON public.chequeos_veterinarios;
DROP POLICY IF EXISTS "delete chequeos" ON public.chequeos_veterinarios;

-- Crear políticas globales para tablas con animal_id + responsable_id
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'vacunaciones','medicaciones','pesajes','palpaciones','inseminaciones',
    'chequeos_veterinarios','dietas','ciclos_calor','aspiraciones',
    'campeonatos','embriones_detalle'
  ]) LOOP
    EXECUTE format($f$
      CREATE POLICY "view %1$s global" ON public.%1$s
        FOR SELECT TO authenticated
        USING (public.is_active_user(auth.uid()));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "insert %1$s global" ON public.%1$s
        FOR INSERT TO authenticated
        WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "update %1$s global" ON public.%1$s
        FOR UPDATE TO authenticated
        USING (public.is_active_user(auth.uid()))
        WITH CHECK (public.is_active_user(auth.uid()));
    $f$, t);
    EXECUTE format($f$
      CREATE POLICY "delete %1$s global" ON public.%1$s
        FOR DELETE TO authenticated
        USING (public.is_active_user(auth.uid()));
    $f$, t);
  END LOOP;
END $$;

-- partos (animal_id_madre)
DROP POLICY IF EXISTS "view partos" ON public.partos;
DROP POLICY IF EXISTS "insert partos" ON public.partos;
DROP POLICY IF EXISTS "update partos" ON public.partos;
DROP POLICY IF EXISTS "delete partos" ON public.partos;

CREATE POLICY "view partos global" ON public.partos
  FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert partos global" ON public.partos
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update partos global" ON public.partos
  FOR UPDATE TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "delete partos global" ON public.partos
  FOR DELETE TO authenticated USING (public.is_active_user(auth.uid()));

-- embriones_recolectados (animal_id_donadora)
DROP POLICY IF EXISTS "view embriones_recolectados" ON public.embriones_recolectados;
DROP POLICY IF EXISTS "insert embriones_recolectados" ON public.embriones_recolectados;
DROP POLICY IF EXISTS "update embriones_recolectados" ON public.embriones_recolectados;
DROP POLICY IF EXISTS "delete embriones_recolectados" ON public.embriones_recolectados;

CREATE POLICY "view embriones_recolectados global" ON public.embriones_recolectados
  FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert embriones_recolectados global" ON public.embriones_recolectados
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update embriones_recolectados global" ON public.embriones_recolectados
  FOR UPDATE TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "delete embriones_recolectados global" ON public.embriones_recolectados
  FOR DELETE TO authenticated USING (public.is_active_user(auth.uid()));
