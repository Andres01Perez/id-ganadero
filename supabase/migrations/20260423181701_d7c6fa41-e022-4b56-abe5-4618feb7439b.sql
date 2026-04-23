CREATE TABLE IF NOT EXISTS public.campeonatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  fecha date NOT NULL,
  nombre text NOT NULL,
  lugar text,
  categoria text,
  resultado text,
  juez text,
  evidencia_url text,
  notas text,
  responsable_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campeonatos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_campeonatos_animal_fecha ON public.campeonatos (animal_id, fecha DESC);

DROP POLICY IF EXISTS "view campeonatos" ON public.campeonatos;
CREATE POLICY "view campeonatos"
ON public.campeonatos
FOR SELECT
TO authenticated
USING (public.user_can_access_animal(auth.uid(), animal_id));

DROP POLICY IF EXISTS "insert campeonatos" ON public.campeonatos;
CREATE POLICY "insert campeonatos"
ON public.campeonatos
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user(auth.uid())
  AND responsable_id = auth.uid()
  AND public.user_can_access_animal(auth.uid(), animal_id)
);

DROP POLICY IF EXISTS "update campeonatos" ON public.campeonatos;
CREATE POLICY "update campeonatos"
ON public.campeonatos
FOR UPDATE
TO authenticated
USING (public.user_can_access_animal(auth.uid(), animal_id))
WITH CHECK (public.user_can_access_animal(auth.uid(), animal_id));

DROP POLICY IF EXISTS "delete campeonatos" ON public.campeonatos;
CREATE POLICY "delete campeonatos"
ON public.campeonatos
FOR DELETE
TO authenticated
USING (public.user_can_access_animal(auth.uid(), animal_id));

DROP TRIGGER IF EXISTS update_campeonatos_updated_at ON public.campeonatos;
CREATE TRIGGER update_campeonatos_updated_at
BEFORE UPDATE ON public.campeonatos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS audit_campeonatos ON public.campeonatos;
CREATE TRIGGER audit_campeonatos
AFTER INSERT OR UPDATE OR DELETE ON public.campeonatos
FOR EACH ROW
EXECUTE FUNCTION public.audit_trigger();