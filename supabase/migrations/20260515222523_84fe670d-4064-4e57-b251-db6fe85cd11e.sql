
-- Tabla
CREATE TABLE public.animal_genealogia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL,
  file_url text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_animal_genealogia_animal ON public.animal_genealogia(animal_id);

ALTER TABLE public.animal_genealogia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view animal_genealogia by animal"
  ON public.animal_genealogia FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_can_access_animal(auth.uid(), animal_id));

CREATE POLICY "insert animal_genealogia by animal"
  ON public.animal_genealogia FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid())
    AND uploaded_by = auth.uid()
    AND (is_admin_or_super(auth.uid()) OR user_can_access_animal(auth.uid(), animal_id))
  );

CREATE POLICY "delete animal_genealogia owner or admin"
  ON public.animal_genealogia FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR uploaded_by = auth.uid());

-- Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-genealogia', 'animal-genealogia', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "animal-genealogia public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'animal-genealogia');

CREATE POLICY "animal-genealogia authenticated insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'animal-genealogia' AND is_active_user(auth.uid()) AND owner = auth.uid());

CREATE POLICY "animal-genealogia owner or admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'animal-genealogia' AND (owner = auth.uid() OR is_admin_or_super(auth.uid())));

-- Quitar campeonatos
DROP TABLE IF EXISTS public.campeonatos;
