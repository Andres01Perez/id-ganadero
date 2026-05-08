DROP TABLE IF EXISTS public.tipos_animal_finca CASCADE;

DELETE FROM public.animales_finca;

ALTER TABLE public.animales_finca
  DROP COLUMN IF EXISTS tipo_id,
  DROP COLUMN IF EXISTS nombre,
  DROP COLUMN IF EXISTS edad,
  DROP COLUMN IF EXISTS fecha_ingreso,
  DROP COLUMN IF EXISTS fecha_salida,
  DROP COLUMN IF EXISTS activo,
  DROP COLUMN IF EXISTS notas;

ALTER TABLE public.animales_finca
  ADD COLUMN tipo text NOT NULL,
  ADD COLUMN cantidad integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0);

CREATE UNIQUE INDEX animales_finca_finca_tipo_unique
  ON public.animales_finca (finca_id, lower(tipo));

DROP TRIGGER IF EXISTS update_animales_finca_updated_at ON public.animales_finca;
CREATE TRIGGER update_animales_finca_updated_at
BEFORE UPDATE ON public.animales_finca
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();