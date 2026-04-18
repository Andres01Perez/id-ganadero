
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.animal_tipo AS ENUM ('macho','hembra','cria','embrion','otro');
CREATE TYPE public.animal_sexo AS ENUM ('M','H');
CREATE TYPE public.metodo_cruce AS ENUM ('monta_directa','inseminacion_artificial','fiv','transferencia_embrion');
CREATE TYPE public.parto_resultado AS ENUM ('vivo','muerto','aborto');
CREATE TYPE public.palpacion_resultado AS ENUM ('positivo','negativo');
CREATE TYPE public.embrion_estado AS ENUM ('congelado','transferido','implantado','perdido','nacido');

-- ============================================
-- FINCAS
-- ============================================
CREATE TABLE public.fincas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  ubicacion text,
  hectareas numeric,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fincas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ANIMALES
-- ============================================
CREATE TABLE public.animales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text,
  tipo public.animal_tipo NOT NULL,
  sexo public.animal_sexo,
  fecha_nacimiento date,
  numero_registro text,
  color text,
  raza text,
  finca_id uuid REFERENCES public.fincas(id) ON DELETE SET NULL,
  madre_id uuid REFERENCES public.animales(id) ON DELETE SET NULL,
  padre_id uuid REFERENCES public.animales(id) ON DELETE SET NULL,
  foto_principal_url text,
  -- Embrión específico (nullable para otros tipos)
  donadora_id uuid REFERENCES public.animales(id) ON DELETE SET NULL,
  receptora_id uuid REFERENCES public.animales(id) ON DELETE SET NULL,
  fecha_transferencia date,
  estado_embrion public.embrion_estado,
  activo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_animales_tipo ON public.animales(tipo);
CREATE INDEX idx_animales_finca ON public.animales(finca_id);
ALTER TABLE public.animales ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EVENTOS REPRODUCTIVOS
-- ============================================
CREATE TABLE public.ciclos_calor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  fecha_proximo_estimado date,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ciclos_calor ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.aspiraciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  cantidad_ovocitos integer,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aspiraciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.embriones_recolectados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id_donadora uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  cantidad integer,
  calidad text,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.embriones_recolectados ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.palpaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  resultado public.palpacion_resultado NOT NULL,
  tiempo_prenez_dias integer,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.palpaciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.inseminaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  hora time,
  metodo public.metodo_cruce NOT NULL,
  toro_id uuid REFERENCES public.animales(id) ON DELETE SET NULL,
  toro_externo_nombre text,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inseminaciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.partos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id_madre uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  sexo_cria public.animal_sexo,
  numero_parto integer,
  resultado public.parto_resultado NOT NULL,
  cria_id uuid REFERENCES public.animales(id) ON DELETE SET NULL,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chequeos_veterinarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  estado text,
  diagnostico text,
  veterinario text,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chequeos_veterinarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTROL Y SOSTENIMIENTO
-- ============================================
CREATE TABLE public.vacunaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  vacuna text NOT NULL,
  lote text,
  proxima_dosis date,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vacunaciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.medicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  medicamento text NOT NULL,
  dosis text,
  motivo text,
  dias_tratamiento integer,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medicaciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dietas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  tipo_alimento text NOT NULL,
  cantidad_kg_dia numeric,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PESO HISTÓRICO
-- ============================================
CREATE TABLE public.pesajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES public.animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  peso_kg numeric NOT NULL,
  ganancia_desde_anterior_kg numeric,
  evidencia_url text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pesajes_animal_fecha ON public.pesajes(animal_id, fecha DESC);
ALTER TABLE public.pesajes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla text NOT NULL,
  registro_id uuid NOT NULL,
  accion text NOT NULL,
  cambios jsonb,
  usuario_id uuid,
  usuario_display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_registro ON public.audit_log(tabla, registro_id);
CREATE INDEX idx_audit_log_usuario ON public.audit_log(usuario_id);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER GENÉRICO DE AUDIT
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_display_name text;
  v_cambios jsonb;
  v_registro_id uuid;
BEGIN
  v_user_id := auth.uid();
  SELECT display_name INTO v_display_name FROM public.profiles WHERE id = v_user_id;

  IF TG_OP = 'INSERT' THEN
    v_cambios := to_jsonb(NEW);
    v_registro_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_cambios := jsonb_build_object('antes', to_jsonb(OLD), 'despues', to_jsonb(NEW));
    v_registro_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_cambios := to_jsonb(OLD);
    v_registro_id := OLD.id;
  END IF;

  INSERT INTO public.audit_log (tabla, registro_id, accion, cambios, usuario_id, usuario_display_name)
  VALUES (TG_TABLE_NAME, v_registro_id, TG_OP, v_cambios, v_user_id, v_display_name);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar trigger a tablas críticas
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY['animales','ciclos_calor','aspiraciones','embriones_recolectados',
                       'palpaciones','inseminaciones','partos','chequeos_veterinarios',
                       'vacunaciones','medicaciones','dietas','pesajes'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_trigger()', t, t);
  END LOOP;
END $$;

-- Trigger de updated_at
CREATE TRIGGER set_fincas_updated BEFORE UPDATE ON public.fincas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_animales_updated BEFORE UPDATE ON public.animales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER: usuario activo con perfil
-- ============================================
CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND active = true)
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- FINCAS
CREATE POLICY "Authenticated can view fincas" ON public.fincas FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "Admins manage fincas insert" ON public.fincas FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins manage fincas update" ON public.fincas FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins manage fincas delete" ON public.fincas FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ANIMALES
CREATE POLICY "Authenticated view animales" ON public.animales FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "Authenticated insert animales" ON public.animales FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Owners or admins update animales" ON public.animales FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "Owners or admins delete animales" ON public.animales FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- Macro para crear políticas en tablas de eventos (se hace manualmente por claridad)
-- Patrón: SELECT por activos, INSERT por activos con responsable=auth.uid, UPDATE/DELETE por responsable o admin

-- CICLOS_CALOR
CREATE POLICY "view ciclos_calor" ON public.ciclos_calor FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert ciclos_calor" ON public.ciclos_calor FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update ciclos_calor" ON public.ciclos_calor FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete ciclos_calor" ON public.ciclos_calor FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- ASPIRACIONES
CREATE POLICY "view aspiraciones" ON public.aspiraciones FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert aspiraciones" ON public.aspiraciones FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update aspiraciones" ON public.aspiraciones FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete aspiraciones" ON public.aspiraciones FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- EMBRIONES_RECOLECTADOS
CREATE POLICY "view embriones_recolectados" ON public.embriones_recolectados FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert embriones_recolectados" ON public.embriones_recolectados FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update embriones_recolectados" ON public.embriones_recolectados FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete embriones_recolectados" ON public.embriones_recolectados FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- PALPACIONES
CREATE POLICY "view palpaciones" ON public.palpaciones FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert palpaciones" ON public.palpaciones FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update palpaciones" ON public.palpaciones FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete palpaciones" ON public.palpaciones FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- INSEMINACIONES
CREATE POLICY "view inseminaciones" ON public.inseminaciones FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert inseminaciones" ON public.inseminaciones FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update inseminaciones" ON public.inseminaciones FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete inseminaciones" ON public.inseminaciones FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- PARTOS
CREATE POLICY "view partos" ON public.partos FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert partos" ON public.partos FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update partos" ON public.partos FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete partos" ON public.partos FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- CHEQUEOS_VETERINARIOS
CREATE POLICY "view chequeos" ON public.chequeos_veterinarios FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert chequeos" ON public.chequeos_veterinarios FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update chequeos" ON public.chequeos_veterinarios FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete chequeos" ON public.chequeos_veterinarios FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- VACUNACIONES
CREATE POLICY "view vacunaciones" ON public.vacunaciones FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert vacunaciones" ON public.vacunaciones FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update vacunaciones" ON public.vacunaciones FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete vacunaciones" ON public.vacunaciones FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- MEDICACIONES
CREATE POLICY "view medicaciones" ON public.medicaciones FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert medicaciones" ON public.medicaciones FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update medicaciones" ON public.medicaciones FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete medicaciones" ON public.medicaciones FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- DIETAS
CREATE POLICY "view dietas" ON public.dietas FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert dietas" ON public.dietas FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update dietas" ON public.dietas FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete dietas" ON public.dietas FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- PESAJES
CREATE POLICY "view pesajes" ON public.pesajes FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "insert pesajes" ON public.pesajes FOR INSERT TO authenticated WITH CHECK (public.is_active_user(auth.uid()) AND responsable_id = auth.uid());
CREATE POLICY "update pesajes" ON public.pesajes FOR UPDATE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));
CREATE POLICY "delete pesajes" ON public.pesajes FOR DELETE TO authenticated USING (responsable_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- AUDIT LOG (solo admins leen)
CREATE POLICY "Admins view audit_log" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('animal-fotos','animal-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Animal fotos public read" ON storage.objects FOR SELECT USING (bucket_id = 'animal-fotos');
CREATE POLICY "Animal fotos auth insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'animal-fotos');
CREATE POLICY "Animal fotos auth update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'animal-fotos');
CREATE POLICY "Animal fotos auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'animal-fotos');
