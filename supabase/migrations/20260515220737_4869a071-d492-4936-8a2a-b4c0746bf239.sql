
-- POTREROS
DROP POLICY IF EXISTS "view potreros by finca" ON public.potreros;
DROP POLICY IF EXISTS "insert potreros by finca" ON public.potreros;
DROP POLICY IF EXISTS "update potreros by finca" ON public.potreros;
DROP POLICY IF EXISTS "delete potreros by finca" ON public.potreros;

CREATE POLICY "view potreros by finca" ON public.potreros FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "insert potreros by finca" ON public.potreros FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super(auth.uid()) OR (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id)));
CREATE POLICY "update potreros by finca" ON public.potreros FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete potreros by finca" ON public.potreros FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));

-- ANIMALES_FINCA
DROP POLICY IF EXISTS "view animales_finca by finca" ON public.animales_finca;
DROP POLICY IF EXISTS "insert animales_finca by finca" ON public.animales_finca;
DROP POLICY IF EXISTS "update animales_finca by finca" ON public.animales_finca;
DROP POLICY IF EXISTS "delete animales_finca by finca" ON public.animales_finca;

CREATE POLICY "view animales_finca by finca" ON public.animales_finca FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "insert animales_finca by finca" ON public.animales_finca FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super(auth.uid()) OR (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), finca_id)));
CREATE POLICY "update animales_finca by finca" ON public.animales_finca FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete animales_finca by finca" ON public.animales_finca FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));

-- INVENTARIO_PRODUCTOS
DROP POLICY IF EXISTS "view inventario_productos by finca" ON public.inventario_productos;
DROP POLICY IF EXISTS "insert inventario_productos by finca" ON public.inventario_productos;
DROP POLICY IF EXISTS "update inventario_productos by finca" ON public.inventario_productos;
DROP POLICY IF EXISTS "delete inventario_productos by finca" ON public.inventario_productos;

CREATE POLICY "view inventario_productos by finca" ON public.inventario_productos FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "insert inventario_productos by finca" ON public.inventario_productos FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_super(auth.uid())
    OR (is_active_user(auth.uid()) AND created_by = auth.uid() AND finca_id IS NOT NULL AND user_has_finca(auth.uid(), finca_id))
  );
CREATE POLICY "update inventario_productos by finca" ON public.inventario_productos FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id))
  WITH CHECK (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "delete inventario_productos by finca" ON public.inventario_productos FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));

-- INVENTARIO_MOVIMIENTOS
DROP POLICY IF EXISTS "view inventario_movimientos" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "insert inventario_movimientos" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "update inventario_movimientos" ON public.inventario_movimientos;
DROP POLICY IF EXISTS "delete inventario_movimientos" ON public.inventario_movimientos;

CREATE POLICY "view inventario_movimientos" ON public.inventario_movimientos FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_can_access_producto(auth.uid(), producto_id));
CREATE POLICY "insert inventario_movimientos" ON public.inventario_movimientos FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_super(auth.uid())
    OR (is_active_user(auth.uid()) AND responsable_id = auth.uid() AND user_can_access_producto(auth.uid(), producto_id))
  );
CREATE POLICY "update inventario_movimientos" ON public.inventario_movimientos FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_can_access_producto(auth.uid(), producto_id));
CREATE POLICY "delete inventario_movimientos" ON public.inventario_movimientos FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_can_access_producto(auth.uid(), producto_id));

-- GALERIA_FOTOS
DROP POLICY IF EXISTS "view galeria_fotos by finca" ON public.galeria_fotos;
DROP POLICY IF EXISTS "insert galeria_fotos by finca" ON public.galeria_fotos;
DROP POLICY IF EXISTS "delete galeria_fotos owner or admin" ON public.galeria_fotos;

CREATE POLICY "view galeria_fotos by finca" ON public.galeria_fotos FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR user_has_finca(auth.uid(), finca_id));
CREATE POLICY "insert galeria_fotos by finca" ON public.galeria_fotos FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_super(auth.uid())
    OR (is_active_user(auth.uid()) AND subido_por = auth.uid() AND user_has_finca(auth.uid(), finca_id))
  );
CREATE POLICY "delete galeria_fotos owner or admin" ON public.galeria_fotos FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()) OR subido_por = auth.uid());

-- FINCAS (SELECT explícito para admin)
DROP POLICY IF EXISTS "Authenticated can view fincas" ON public.fincas;
CREATE POLICY "Authenticated can view fincas" ON public.fincas FOR SELECT TO authenticated
  USING (is_admin_or_super(auth.uid()) OR (is_active_user(auth.uid()) AND user_has_finca(auth.uid(), id)));
