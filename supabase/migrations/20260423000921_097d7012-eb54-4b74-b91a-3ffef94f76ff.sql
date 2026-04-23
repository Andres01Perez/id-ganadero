ALTER TABLE public.animales
DROP CONSTRAINT IF EXISTS animales_raza_permitida_check;

ALTER TABLE public.animales
ADD CONSTRAINT animales_raza_permitida_check
CHECK (raza IS NULL OR raza = 'Brahman');

ALTER TABLE public.animales
DROP CONSTRAINT IF EXISTS animales_color_permitido_check;

ALTER TABLE public.animales
ADD CONSTRAINT animales_color_permitido_check
CHECK (color IS NULL OR color IN ('Gris', 'Rojo'));
