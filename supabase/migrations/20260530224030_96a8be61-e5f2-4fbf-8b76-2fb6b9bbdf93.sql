CREATE TABLE public.export_plantillas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  compartida boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.export_plantillas TO authenticated;
GRANT ALL ON public.export_plantillas TO service_role;

ALTER TABLE public.export_plantillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view export_plantillas own or shared"
ON public.export_plantillas
FOR SELECT
TO authenticated
USING (
  is_active_user(auth.uid())
  AND (compartida = true OR created_by = auth.uid() OR is_admin_or_super(auth.uid()))
);

CREATE POLICY "insert export_plantillas active"
ON public.export_plantillas
FOR INSERT
TO authenticated
WITH CHECK (is_active_user(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "update export_plantillas owner or admin"
ON public.export_plantillas
FOR UPDATE
TO authenticated
USING (is_admin_or_super(auth.uid()) OR created_by = auth.uid())
WITH CHECK (is_admin_or_super(auth.uid()) OR created_by = auth.uid());

CREATE POLICY "delete export_plantillas owner or admin"
ON public.export_plantillas
FOR DELETE
TO authenticated
USING (is_admin_or_super(auth.uid()) OR created_by = auth.uid());

CREATE TRIGGER update_export_plantillas_updated_at
BEFORE UPDATE ON public.export_plantillas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();