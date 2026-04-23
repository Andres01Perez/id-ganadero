CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_finca(_user_id uuid, _finca_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _finca_id IS NOT NULL
    AND public.is_active_user(_user_id)
    AND (
      public.is_admin_or_super(_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.user_finca_acceso
        WHERE user_id = _user_id
          AND finca_id = _finca_id
      )
    )
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_animal(_user_id uuid, _animal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _animal_id IS NOT NULL
    AND public.is_active_user(_user_id)
    AND EXISTS (
      SELECT 1
      FROM public.animales a
      WHERE a.id = _animal_id
        AND public.user_has_finca(_user_id, a.finca_id)
    )
$$;

DROP POLICY IF EXISTS "view animales by finca" ON public.animales;
DROP POLICY IF EXISTS "insert animales by finca" ON public.animales;
DROP POLICY IF EXISTS "update animales by finca" ON public.animales;
DROP POLICY IF EXISTS "delete animales by finca" ON public.animales;

CREATE POLICY "view animales by finca"
ON public.animales
FOR SELECT
TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND public.user_has_finca(auth.uid(), finca_id)
);

CREATE POLICY "insert animales by finca"
ON public.animales
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user(auth.uid())
  AND created_by = auth.uid()
  AND finca_id IS NOT NULL
  AND public.user_has_finca(auth.uid(), finca_id)
);

CREATE POLICY "update animales by finca"
ON public.animales
FOR UPDATE
TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND public.user_has_finca(auth.uid(), finca_id)
)
WITH CHECK (
  public.is_active_user(auth.uid())
  AND finca_id IS NOT NULL
  AND public.user_has_finca(auth.uid(), finca_id)
);

CREATE POLICY "delete animales by finca"
ON public.animales
FOR DELETE
TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND public.user_has_finca(auth.uid(), finca_id)
);

DROP POLICY IF EXISTS "Authenticated can view fincas" ON public.fincas;

CREATE POLICY "Authenticated can view fincas"
ON public.fincas
FOR SELECT
TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND public.user_has_finca(auth.uid(), id)
);