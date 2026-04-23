DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animales'
      AND column_name = 'codigo'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'animales'
      AND column_name = 'numero'
  ) THEN
    ALTER TABLE public.animales RENAME COLUMN codigo TO numero;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'animales_codigo_key'
      AND conrelid = 'public.animales'::regclass
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'animales_numero_key'
      AND conrelid = 'public.animales'::regclass
  ) THEN
    ALTER TABLE public.animales RENAME CONSTRAINT animales_codigo_key TO animales_numero_key;
  END IF;
END $$;