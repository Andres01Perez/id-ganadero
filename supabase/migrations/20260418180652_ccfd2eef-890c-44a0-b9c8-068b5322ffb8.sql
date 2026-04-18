-- 1. Crear tabla embriones_detalle
CREATE TABLE public.embriones_detalle (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id uuid NOT NULL UNIQUE REFERENCES public.animales(id) ON DELETE CASCADE,
  donadora_id uuid REFERENCES public.animales(id),
  receptora_id uuid REFERENCES public.animales(id),
  fecha_transferencia date,
  estado_embrion public.embrion_estado,
  responsable_id uuid NOT NULL,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.embriones_detalle ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
CREATE POLICY "view embriones_detalle"
  ON public.embriones_detalle FOR SELECT
  TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "insert embriones_detalle"
  ON public.embriones_detalle FOR INSERT
  TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND responsable_id = auth.uid());

CREATE POLICY "update embriones_detalle"
  ON public.embriones_detalle FOR UPDATE
  TO authenticated
  USING (responsable_id = auth.uid() OR is_admin_or_super(auth.uid()));

CREATE POLICY "delete embriones_detalle"
  ON public.embriones_detalle FOR DELETE
  TO authenticated
  USING (responsable_id = auth.uid() OR is_admin_or_super(auth.uid()));

-- 4. Trigger updated_at
CREATE TRIGGER set_embriones_detalle_updated_at
  BEFORE UPDATE ON public.embriones_detalle
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Trigger de auditoría
CREATE TRIGGER audit_embriones_detalle
  AFTER INSERT OR UPDATE OR DELETE ON public.embriones_detalle
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger();

-- 6. Eliminar columnas de embrión de animales
ALTER TABLE public.animales
  DROP COLUMN IF EXISTS donadora_id,
  DROP COLUMN IF EXISTS receptora_id,
  DROP COLUMN IF EXISTS fecha_transferencia,
  DROP COLUMN IF EXISTS estado_embrion;