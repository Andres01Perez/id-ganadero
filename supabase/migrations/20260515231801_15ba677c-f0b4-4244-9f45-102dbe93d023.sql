CREATE TABLE public.parientes_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sexo public.animal_sexo NOT NULL,
  nombre text NOT NULL,
  numero text NOT NULL,
  numero_registro text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX parientes_externos_sexo_numero_uniq
  ON public.parientes_externos (sexo, lower(numero));

ALTER TABLE public.parientes_externos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view parientes_externos active"
  ON public.parientes_externos FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "insert parientes_externos active"
  ON public.parientes_externos FOR INSERT TO authenticated
  WITH CHECK (public.is_active_user(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "update parientes_externos active"
  ON public.parientes_externos FOR UPDATE TO authenticated
  USING (public.is_active_user(auth.uid()))
  WITH CHECK (public.is_active_user(auth.uid()));

CREATE POLICY "delete parientes_externos admin"
  ON public.parientes_externos FOR DELETE TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

CREATE TRIGGER trg_parientes_externos_updated_at
  BEFORE UPDATE ON public.parientes_externos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.animales
  ADD COLUMN madre_externa_id uuid REFERENCES public.parientes_externos(id) ON DELETE SET NULL,
  ADD COLUMN padre_externo_id uuid REFERENCES public.parientes_externos(id) ON DELETE SET NULL;