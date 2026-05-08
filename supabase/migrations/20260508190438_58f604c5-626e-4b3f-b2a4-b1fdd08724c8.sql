
-- 1. Add finca_id column to audit_log
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS finca_id uuid;
CREATE INDEX IF NOT EXISTS idx_audit_log_finca_created ON public.audit_log (finca_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log (created_at DESC);

-- 2. Rewrite audit_trigger to resolve finca_id per source table
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_display_name text;
  v_cambios jsonb;
  v_registro_id uuid;
  v_finca_id uuid;
  v_row jsonb;
BEGIN
  v_user_id := auth.uid();
  SELECT display_name INTO v_display_name FROM public.profiles WHERE id = v_user_id;

  IF TG_OP = 'INSERT' THEN
    v_cambios := to_jsonb(NEW);
    v_registro_id := NEW.id;
    v_row := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_cambios := jsonb_build_object('antes', to_jsonb(OLD), 'despues', to_jsonb(NEW));
    v_registro_id := NEW.id;
    v_row := to_jsonb(NEW);
  ELSE
    v_cambios := to_jsonb(OLD);
    v_registro_id := OLD.id;
    v_row := to_jsonb(OLD);
  END IF;

  -- Resolve finca_id per table
  CASE TG_TABLE_NAME
    WHEN 'animales', 'animales_finca', 'potreros', 'inventario_productos', 'empleado_fincas', 'user_finca_acceso' THEN
      v_finca_id := NULLIF(v_row->>'finca_id','')::uuid;
    WHEN 'fincas' THEN
      v_finca_id := NULLIF(v_row->>'id','')::uuid;
    WHEN 'inventario_movimientos' THEN
      SELECT finca_id INTO v_finca_id FROM public.inventario_productos
        WHERE id = NULLIF(v_row->>'producto_id','')::uuid;
    WHEN 'vacunaciones','medicaciones','pesajes','palpaciones','inseminaciones',
         'chequeos_veterinarios','dietas','ciclos_calor','aspiraciones','campeonatos',
         'embriones_detalle' THEN
      SELECT finca_id INTO v_finca_id FROM public.animales
        WHERE id = NULLIF(v_row->>'animal_id','')::uuid;
    WHEN 'partos' THEN
      SELECT finca_id INTO v_finca_id FROM public.animales
        WHERE id = NULLIF(v_row->>'animal_id_madre','')::uuid;
    WHEN 'embriones_recolectados' THEN
      SELECT finca_id INTO v_finca_id FROM public.animales
        WHERE id = NULLIF(v_row->>'animal_id_donadora','')::uuid;
    ELSE
      v_finca_id := NULL;
  END CASE;

  INSERT INTO public.audit_log (tabla, registro_id, accion, cambios, usuario_id, usuario_display_name, finca_id)
  VALUES (TG_TABLE_NAME, v_registro_id, TG_OP, v_cambios, v_user_id, v_display_name, v_finca_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Update RLS on audit_log: allow finca members to view
DROP POLICY IF EXISTS "Admins view audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "View audit_log by finca or admin" ON public.audit_log;

CREATE POLICY "View audit_log by finca or admin"
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  public.is_admin_or_super(auth.uid())
  OR (finca_id IS NOT NULL AND public.user_has_finca(auth.uid(), finca_id))
);

-- 4. Attach triggers to operational tables (idempotent)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'animales','animales_finca','potreros','inventario_productos','inventario_movimientos',
    'empleados','empleado_fincas','fincas','user_finca_acceso',
    'vacunaciones','medicaciones','pesajes','palpaciones','inseminaciones','partos',
    'chequeos_veterinarios','dietas','ciclos_calor','aspiraciones','campeonatos',
    'embriones_recolectados','embriones_detalle'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I_trg ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER audit_%I_trg AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();',
      t, t
    );
  END LOOP;
END$$;
