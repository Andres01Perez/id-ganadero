-- ===== ENUM potrero_estado =====
CREATE TYPE public.potrero_estado AS ENUM ('cargado', 'descargado', 'en_renovacion');

-- ===== EMPLEADOS =====
CREATE TABLE public.empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL,
  cedula text,
  fecha_nacimiento date,
  fecha_ingreso date,
  fecha_salida date,
  activo boolean NOT NULL DEFAULT true,
  foto_url text,
  notas text,
  user_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_empleados_updated_at
BEFORE UPDATE ON public.empleados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== EMPLEADO_FINCAS (N:N) =====
CREATE TABLE public.empleado_fincas (
  empleado_id uuid NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  finca_id uuid NOT NULL REFERENCES public.fincas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (empleado_id, finca_id)
);

CREATE INDEX idx_empleado_fincas_finca ON public.empleado_fincas(finca_id);
CREATE INDEX idx_empleado_fincas_empleado ON public.empleado_fincas(empleado_id);

ALTER TABLE public.empleado_fincas ENABLE ROW LEVEL SECURITY;

-- Policies empleado_fincas
CREATE POLICY "view empleado_fincas by finca"
ON public.empleado_fincas FOR SELECT TO authenticated
USING (public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "insert empleado_fincas admin"
ON public.empleado_fincas FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "delete empleado_fincas admin"
ON public.empleado_fincas FOR DELETE TO authenticated
USING (public.is_admin_or_super(auth.uid()));

-- Policies empleados
CREATE POLICY "view empleados by finca"
ON public.empleados FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.empleado_fincas ef
    WHERE ef.empleado_id = empleados.id
      AND public.user_has_finca(auth.uid(), ef.finca_id)
  )
);

CREATE POLICY "insert empleados admin"
ON public.empleados FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "update empleados admin"
ON public.empleados FOR UPDATE TO authenticated
USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "delete empleados admin"
ON public.empleados FOR DELETE TO authenticated
USING (public.is_admin_or_super(auth.uid()));

-- ===== POTREROS =====
CREATE TABLE public.potreros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id uuid NOT NULL REFERENCES public.fincas(id) ON DELETE CASCADE,
  numero text NOT NULL,
  estado public.potrero_estado NOT NULL DEFAULT 'descargado',
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (finca_id, numero)
);

CREATE INDEX idx_potreros_finca ON public.potreros(finca_id);

ALTER TABLE public.potreros ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_potreros_updated_at
BEFORE UPDATE ON public.potreros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "view potreros by finca"
ON public.potreros FOR SELECT TO authenticated
USING (public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "insert potreros admin"
ON public.potreros FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "update potreros admin"
ON public.potreros FOR UPDATE TO authenticated
USING (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "delete potreros admin"
ON public.potreros FOR DELETE TO authenticated
USING (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));

-- ===== TIPOS ANIMAL FINCA (global) =====
CREATE TABLE public.tipos_animal_finca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_animal_finca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tipos_animal_finca all auth"
ON public.tipos_animal_finca FOR SELECT TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "insert tipos_animal_finca admin"
ON public.tipos_animal_finca FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "update tipos_animal_finca admin non system"
ON public.tipos_animal_finca FOR UPDATE TO authenticated
USING (public.is_admin_or_super(auth.uid()) AND is_system = false);

CREATE POLICY "delete tipos_animal_finca admin non system"
ON public.tipos_animal_finca FOR DELETE TO authenticated
USING (public.is_admin_or_super(auth.uid()) AND is_system = false);

-- Seed
INSERT INTO public.tipos_animal_finca (nombre, is_system) VALUES
  ('Ternero', true), ('Novillo', true), ('Otro', true);

-- ===== ANIMALES FINCA =====
CREATE TABLE public.animales_finca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id uuid NOT NULL REFERENCES public.fincas(id) ON DELETE CASCADE,
  tipo_id uuid NOT NULL REFERENCES public.tipos_animal_finca(id),
  nombre text NOT NULL,
  edad integer,
  fecha_ingreso date,
  fecha_salida date,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_animales_finca_finca ON public.animales_finca(finca_id);

ALTER TABLE public.animales_finca ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_animales_finca_updated_at
BEFORE UPDATE ON public.animales_finca
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "view animales_finca by finca"
ON public.animales_finca FOR SELECT TO authenticated
USING (public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "insert animales_finca admin"
ON public.animales_finca FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "update animales_finca admin"
ON public.animales_finca FOR UPDATE TO authenticated
USING (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));

CREATE POLICY "delete animales_finca admin"
ON public.animales_finca FOR DELETE TO authenticated
USING (public.is_admin_or_super(auth.uid()) AND public.user_has_finca(auth.uid(), finca_id));