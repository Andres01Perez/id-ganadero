
-- 1. Tabla user_finca_acceso
CREATE TABLE public.user_finca_acceso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  finca_id uuid NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, finca_id)
);

CREATE INDEX idx_user_finca_acceso_user ON public.user_finca_acceso(user_id);
CREATE INDEX idx_user_finca_acceso_finca ON public.user_finca_acceso(finca_id);

ALTER TABLE public.user_finca_acceso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage user_finca_acceso select"
  ON public.user_finca_acceso FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins manage user_finca_acceso insert"
  ON public.user_finca_acceso FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins manage user_finca_acceso update"
  ON public.user_finca_acceso FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins manage user_finca_acceso delete"
  ON public.user_finca_acceso FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()));

-- 2. Función security definer
CREATE OR REPLACE FUNCTION public.user_has_finca(_user_id uuid, _finca_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _finca_id IS NOT NULL AND (
      public.is_admin_or_super(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_finca_acceso
        WHERE user_id = _user_id AND finca_id = _finca_id
      )
    )
$$;

-- 3. Animales: hacer finca_id NOT NULL si no hay huérfanos
DO $$
DECLARE
  huerfanos int;
BEGIN
  SELECT count(*) INTO huerfanos FROM public.animales WHERE finca_id IS NULL;
  IF huerfanos = 0 THEN
    ALTER TABLE public.animales ALTER COLUMN finca_id SET NOT NULL;
  END IF;
END $$;

-- 4. Reescribir RLS de animales
DROP POLICY IF EXISTS "Authenticated insert animales" ON public.animales;
DROP POLICY IF EXISTS "Authenticated view animales" ON public.animales;
DROP POLICY IF EXISTS "Owners or admins delete animales" ON public.animales;
DROP POLICY IF EXISTS "Owners or admins update animales" ON public.animales;

CREATE POLICY "view animales by finca"
  ON public.animales FOR SELECT TO authenticated
  USING (
    is_admin_or_super(auth.uid())
    OR (finca_id IS NOT NULL AND user_has_finca(auth.uid(), finca_id))
  );

CREATE POLICY "insert animales by finca"
  ON public.animales FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid())
    AND created_by = auth.uid()
    AND finca_id IS NOT NULL
    AND (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id))
  );

CREATE POLICY "update animales by finca"
  ON public.animales FOR UPDATE TO authenticated
  USING (
    is_admin_or_super(auth.uid())
    OR (finca_id IS NOT NULL AND user_has_finca(auth.uid(), finca_id))
  );

CREATE POLICY "delete animales by finca"
  ON public.animales FOR DELETE TO authenticated
  USING (
    is_admin_or_super(auth.uid())
    OR (finca_id IS NOT NULL AND user_has_finca(auth.uid(), finca_id))
  );

-- 5. Helper para tablas de eventos
CREATE OR REPLACE FUNCTION public.user_can_access_animal(_user_id uuid, _animal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.animales a
    WHERE a.id = _animal_id
      AND (
        public.is_admin_or_super(_user_id)
        OR (a.finca_id IS NOT NULL AND public.user_has_finca(_user_id, a.finca_id))
      )
  )
$$;

-- 6. Reescribir RLS de tablas de eventos (animal_id)
-- pesajes
DROP POLICY IF EXISTS "view pesajes" ON public.pesajes;
DROP POLICY IF EXISTS "insert pesajes" ON public.pesajes;
DROP POLICY IF EXISTS "update pesajes" ON public.pesajes;
DROP POLICY IF EXISTS "delete pesajes" ON public.pesajes;
CREATE POLICY "view pesajes" ON public.pesajes FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert pesajes" ON public.pesajes FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update pesajes" ON public.pesajes FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete pesajes" ON public.pesajes FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- vacunaciones
DROP POLICY IF EXISTS "view vacunaciones" ON public.vacunaciones;
DROP POLICY IF EXISTS "insert vacunaciones" ON public.vacunaciones;
DROP POLICY IF EXISTS "update vacunaciones" ON public.vacunaciones;
DROP POLICY IF EXISTS "delete vacunaciones" ON public.vacunaciones;
CREATE POLICY "view vacunaciones" ON public.vacunaciones FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert vacunaciones" ON public.vacunaciones FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update vacunaciones" ON public.vacunaciones FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete vacunaciones" ON public.vacunaciones FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- medicaciones
DROP POLICY IF EXISTS "view medicaciones" ON public.medicaciones;
DROP POLICY IF EXISTS "insert medicaciones" ON public.medicaciones;
DROP POLICY IF EXISTS "update medicaciones" ON public.medicaciones;
DROP POLICY IF EXISTS "delete medicaciones" ON public.medicaciones;
CREATE POLICY "view medicaciones" ON public.medicaciones FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert medicaciones" ON public.medicaciones FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update medicaciones" ON public.medicaciones FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete medicaciones" ON public.medicaciones FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- palpaciones
DROP POLICY IF EXISTS "view palpaciones" ON public.palpaciones;
DROP POLICY IF EXISTS "insert palpaciones" ON public.palpaciones;
DROP POLICY IF EXISTS "update palpaciones" ON public.palpaciones;
DROP POLICY IF EXISTS "delete palpaciones" ON public.palpaciones;
CREATE POLICY "view palpaciones" ON public.palpaciones FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert palpaciones" ON public.palpaciones FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update palpaciones" ON public.palpaciones FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete palpaciones" ON public.palpaciones FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- partos (animal_id_madre)
DROP POLICY IF EXISTS "view partos" ON public.partos;
DROP POLICY IF EXISTS "insert partos" ON public.partos;
DROP POLICY IF EXISTS "update partos" ON public.partos;
DROP POLICY IF EXISTS "delete partos" ON public.partos;
CREATE POLICY "view partos" ON public.partos FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id_madre));
CREATE POLICY "insert partos" ON public.partos FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id_madre));
CREATE POLICY "update partos" ON public.partos FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id_madre));
CREATE POLICY "delete partos" ON public.partos FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id_madre));

-- inseminaciones
DROP POLICY IF EXISTS "view inseminaciones" ON public.inseminaciones;
DROP POLICY IF EXISTS "insert inseminaciones" ON public.inseminaciones;
DROP POLICY IF EXISTS "update inseminaciones" ON public.inseminaciones;
DROP POLICY IF EXISTS "delete inseminaciones" ON public.inseminaciones;
CREATE POLICY "view inseminaciones" ON public.inseminaciones FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert inseminaciones" ON public.inseminaciones FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update inseminaciones" ON public.inseminaciones FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete inseminaciones" ON public.inseminaciones FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- chequeos_veterinarios
DROP POLICY IF EXISTS "view chequeos" ON public.chequeos_veterinarios;
DROP POLICY IF EXISTS "insert chequeos" ON public.chequeos_veterinarios;
DROP POLICY IF EXISTS "update chequeos" ON public.chequeos_veterinarios;
DROP POLICY IF EXISTS "delete chequeos" ON public.chequeos_veterinarios;
CREATE POLICY "view chequeos" ON public.chequeos_veterinarios FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert chequeos" ON public.chequeos_veterinarios FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update chequeos" ON public.chequeos_veterinarios FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete chequeos" ON public.chequeos_veterinarios FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- ciclos_calor
DROP POLICY IF EXISTS "view ciclos_calor" ON public.ciclos_calor;
DROP POLICY IF EXISTS "insert ciclos_calor" ON public.ciclos_calor;
DROP POLICY IF EXISTS "update ciclos_calor" ON public.ciclos_calor;
DROP POLICY IF EXISTS "delete ciclos_calor" ON public.ciclos_calor;
CREATE POLICY "view ciclos_calor" ON public.ciclos_calor FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert ciclos_calor" ON public.ciclos_calor FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update ciclos_calor" ON public.ciclos_calor FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete ciclos_calor" ON public.ciclos_calor FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- dietas
DROP POLICY IF EXISTS "view dietas" ON public.dietas;
DROP POLICY IF EXISTS "insert dietas" ON public.dietas;
DROP POLICY IF EXISTS "update dietas" ON public.dietas;
DROP POLICY IF EXISTS "delete dietas" ON public.dietas;
CREATE POLICY "view dietas" ON public.dietas FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert dietas" ON public.dietas FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update dietas" ON public.dietas FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete dietas" ON public.dietas FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- aspiraciones
DROP POLICY IF EXISTS "view aspiraciones" ON public.aspiraciones;
DROP POLICY IF EXISTS "insert aspiraciones" ON public.aspiraciones;
DROP POLICY IF EXISTS "update aspiraciones" ON public.aspiraciones;
DROP POLICY IF EXISTS "delete aspiraciones" ON public.aspiraciones;
CREATE POLICY "view aspiraciones" ON public.aspiraciones FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert aspiraciones" ON public.aspiraciones FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update aspiraciones" ON public.aspiraciones FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete aspiraciones" ON public.aspiraciones FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));

-- embriones_recolectados (animal_id_donadora)
DROP POLICY IF EXISTS "view embriones_recolectados" ON public.embriones_recolectados;
DROP POLICY IF EXISTS "insert embriones_recolectados" ON public.embriones_recolectados;
DROP POLICY IF EXISTS "update embriones_recolectados" ON public.embriones_recolectados;
DROP POLICY IF EXISTS "delete embriones_recolectados" ON public.embriones_recolectados;
CREATE POLICY "view embriones_recolectados" ON public.embriones_recolectados FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id_donadora));
CREATE POLICY "insert embriones_recolectados" ON public.embriones_recolectados FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id_donadora));
CREATE POLICY "update embriones_recolectados" ON public.embriones_recolectados FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id_donadora));
CREATE POLICY "delete embriones_recolectados" ON public.embriones_recolectados FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id_donadora));

-- embriones_detalle (animal_id)
DROP POLICY IF EXISTS "view embriones_detalle" ON public.embriones_detalle;
DROP POLICY IF EXISTS "insert embriones_detalle" ON public.embriones_detalle;
DROP POLICY IF EXISTS "update embriones_detalle" ON public.embriones_detalle;
DROP POLICY IF EXISTS "delete embriones_detalle" ON public.embriones_detalle;
CREATE POLICY "view embriones_detalle" ON public.embriones_detalle FOR SELECT TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "insert embriones_detalle" ON public.embriones_detalle FOR INSERT TO authenticated WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "update embriones_detalle" ON public.embriones_detalle FOR UPDATE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
CREATE POLICY "delete embriones_detalle" ON public.embriones_detalle FOR DELETE TO authenticated USING (user_can_access_animal(auth.uid(), animal_id));
