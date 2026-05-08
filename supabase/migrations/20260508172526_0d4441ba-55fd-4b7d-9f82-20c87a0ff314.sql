
-- Enums
CREATE TYPE public.inventario_categoria AS ENUM ('alimentacion', 'medicina', 'otros');
CREATE TYPE public.inventario_importancia AS ENUM ('estandar', 'baja', 'media', 'alta');
CREATE TYPE public.inventario_movimiento_tipo AS ENUM ('entrada', 'salida');

-- Catálogo global de unidades de medida
CREATE TABLE public.unidades_medida (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  abreviatura text,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX unidades_medida_nombre_lower_idx ON public.unidades_medida (lower(nombre));

ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view unidades_medida active user"
  ON public.unidades_medida FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "insert unidades_medida active user"
  ON public.unidades_medida FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()));

CREATE POLICY "update unidades_medida admin non system"
  ON public.unidades_medida FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()) AND is_system = false);

CREATE POLICY "delete unidades_medida admin non system"
  ON public.unidades_medida FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) AND is_system = false);

-- Seed inicial
INSERT INTO public.unidades_medida (nombre, abreviatura, is_system) VALUES
  ('Kilogramo', 'kg', true),
  ('Gramo', 'g', true),
  ('Litro', 'L', true),
  ('Mililitro', 'ml', true),
  ('Galón', 'gal', true),
  ('Unidad', 'u', true),
  ('Bulto', 'bulto', true),
  ('Metro', 'm', true),
  ('Centímetro', 'cm', true),
  ('Dosis', 'dosis', true);

-- Productos de inventario por finca
CREATE TABLE public.inventario_productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finca_id uuid NOT NULL,
  categoria public.inventario_categoria NOT NULL,
  nombre text NOT NULL,
  unidad_id uuid NOT NULL REFERENCES public.unidades_medida(id),
  punto_minimo numeric NOT NULL DEFAULT 0,
  importancia public.inventario_importancia NOT NULL DEFAULT 'estandar',
  fecha_vencimiento date,
  notas text,
  marca text,
  tipo_alimento text,
  laboratorio text,
  via_administracion text,
  ubicacion text,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventario_productos_finca_cat_idx ON public.inventario_productos (finca_id, categoria, activo);

ALTER TABLE public.inventario_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view inventario_productos by finca"
  ON public.inventario_productos FOR SELECT TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));

CREATE POLICY "insert inventario_productos by finca"
  ON public.inventario_productos FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid())
    AND created_by = auth.uid()
    AND finca_id IS NOT NULL
    AND user_has_finca(auth.uid(), finca_id)
  );

CREATE POLICY "update inventario_productos by finca"
  ON public.inventario_productos FOR UPDATE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id))
  WITH CHECK (user_has_finca(auth.uid(), finca_id));

CREATE POLICY "delete inventario_productos by finca"
  ON public.inventario_productos FOR DELETE TO authenticated
  USING (user_has_finca(auth.uid(), finca_id));

-- Función para validar acceso a producto vía finca
CREATE OR REPLACE FUNCTION public.user_can_access_producto(_user_id uuid, _producto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _producto_id IS NOT NULL
    AND public.is_active_user(_user_id)
    AND EXISTS (
      SELECT 1
      FROM public.inventario_productos p
      WHERE p.id = _producto_id
        AND public.user_has_finca(_user_id, p.finca_id)
    )
$$;

-- Movimientos de inventario
CREATE TABLE public.inventario_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES public.inventario_productos(id) ON DELETE CASCADE,
  tipo public.inventario_movimiento_tipo NOT NULL,
  cantidad numeric NOT NULL CHECK (cantidad > 0),
  fecha date NOT NULL DEFAULT current_date,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventario_movimientos_producto_idx ON public.inventario_movimientos (producto_id, fecha DESC);

ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view inventario_movimientos"
  ON public.inventario_movimientos FOR SELECT TO authenticated
  USING (user_can_access_producto(auth.uid(), producto_id));

CREATE POLICY "insert inventario_movimientos"
  ON public.inventario_movimientos FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid())
    AND responsable_id = auth.uid()
    AND user_can_access_producto(auth.uid(), producto_id)
  );

CREATE POLICY "update inventario_movimientos"
  ON public.inventario_movimientos FOR UPDATE TO authenticated
  USING (user_can_access_producto(auth.uid(), producto_id));

CREATE POLICY "delete inventario_movimientos"
  ON public.inventario_movimientos FOR DELETE TO authenticated
  USING (user_can_access_producto(auth.uid(), producto_id));

-- Triggers
CREATE TRIGGER update_inventario_productos_updated_at
  BEFORE UPDATE ON public.inventario_productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_inventario_productos
  AFTER INSERT OR UPDATE OR DELETE ON public.inventario_productos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_inventario_movimientos
  AFTER INSERT OR UPDATE OR DELETE ON public.inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
