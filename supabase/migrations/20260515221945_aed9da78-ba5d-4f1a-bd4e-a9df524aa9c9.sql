
ALTER TABLE public.animales_finca ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.animales_finca ADD COLUMN IF NOT EXISTS subtipo text;

UPDATE public.animales_finca SET subtipo = tipo WHERE subtipo IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS animales_finca_unico_categoria_subtipo
  ON public.animales_finca (finca_id, categoria, subtipo)
  WHERE categoria IS NOT NULL;
