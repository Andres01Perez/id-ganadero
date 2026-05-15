CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
    v_cambios := v_row;
  ELSIF TG_OP = 'UPDATE' THEN
    v_row := to_jsonb(NEW);
    v_cambios := jsonb_build_object('antes', to_jsonb(OLD), 'despues', to_jsonb(NEW));
  ELSE
    v_row := to_jsonb(NEW);
    v_cambios := v_row;
  END IF;

  CASE TG_TABLE_NAME
    WHEN 'empleado_fincas' THEN
      v_registro_id := NULLIF(v_row->>'empleado_id','')::uuid;
    WHEN 'user_finca_acceso' THEN
      v_registro_id := NULLIF(v_row->>'user_id','')::uuid;
    ELSE
      v_registro_id := NULLIF(v_row->>'id','')::uuid;
  END CASE;

  CASE TG_TABLE_NAME
    WHEN 'animales','animales_finca','potreros','inventario_productos','empleado_fincas','user_finca_acceso' THEN
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

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;