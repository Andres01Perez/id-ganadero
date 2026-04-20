

## Panel Superadmin (vista desktop integral)

### Acceso oculto
- Nueva ruta pública `/sa` con formulario **email + contraseña** (signin nativo de Supabase, no usa el sistema de display_name).
- Excluir superadmins del listado del login normal: `list-display-names` filtra usuarios cuyo rol sea `super_admin` (join con `user_roles`).
- Tras login en `/sa`, si el usuario tiene rol `super_admin` → redirige a `/superadmin`. Si no, signOut + error.
- Si un superadmin entra por `/` (login normal), no aparece en la lista → no puede entrar por ahí. Si por algún motivo ya tiene sesión y va a `/menu`, lo redirigimos a `/superadmin`.

### Layout `/superadmin` (desktop-first)

```text
┌────────────────────────────────────────────────────────┐
│ Sidebar (w-60) │  Contenido (flex-1, max-w-7xl)        │
│                │                                        │
│ JPS Superadmin │  [Header: título sección + breadcrumb]│
│                │                                        │
│ • Resumen      │                                        │
│ • Usuarios     │  ... vista de la sección activa ...   │
│ • Imágenes     │                                        │
│ • Información  │                                        │
│   finca        │                                        │
│                │                                        │
│ ─────────      │                                        │
│ [Cerrar sesión]│                                        │
└────────────────────────────────────────────────────────┘
```

Usa `SidebarProvider` de shadcn. Sin BottomTabBar, sin SafeAreaTopBar (oculto en esta ruta). Responsive: en móvil sidebar colapsa pero la prioridad es desktop.

Rutas anidadas:
- `/superadmin` → Resumen (KPIs: total fincas, animales por tipo, usuarios activos, último login)
- `/superadmin/usuarios`
- `/superadmin/imagenes`
- `/superadmin/finca/:fincaId?` (vista jerárquica)

### 1. Usuarios

Tabla densa con todos los usuarios (admins + operarios), columnas:
`Display name | Email | Rol | Fincas asignadas | Activo | Acciones`

Acciones por fila: **Editar nombre** · **Cambiar contraseña** · **Cambiar rol** · **Editar fincas** · **Activar/Desactivar**.

Botón superior: **+ Nuevo usuario** (modal con los mismos campos que ya hay en `Admin.tsx`, ampliado para elegir cualquier rol incluido `super_admin`).

Necesita **2 nuevas edge functions** (con verificación `super_admin` en server):
- `admin-update-user`: cambia `display_name`, `email` (recalculado del slug), `password`, `active`.
- `admin-update-user-role`: borra rol viejo en `user_roles`, inserta el nuevo. Solo super_admin.

Edición de fincas reusa la lógica que ya existe en `Admin.tsx` (insert/delete en `user_finca_acceso`).

### 2. Imágenes

Sistema de **assets reemplazables** vía nueva tabla `app_assets`:
```sql
create table public.app_assets (
  key text primary key,        -- 'menu.icon.machos', 'menu.banner', 'logo', 'finca.123.foto'
  url text not null,
  updated_at timestamptz default now(),
  updated_by uuid
);
```
RLS: SELECT autenticado, INSERT/UPDATE/DELETE solo `super_admin`.

Nuevo bucket de Storage `app-assets` (público). Todas las imágenes editables se suben aquí.

Hook `useAppAsset(key, fallback)` que lee `app_assets` con cache (React Query) y devuelve URL. Si no hay registro → usa el import estático actual como fallback. Esto se aplica en `Menu.tsx`, banners, `Index.tsx` (logo), etc., con cambio mínimo: `<img src={useAppAsset('menu.icon.machos', iconMachos)}/>`.

UI de la sección **Imágenes**, con sub-tabs:

| Sub-tab | Contenido |
|---|---|
| **Menú principal** | 6 tarjetas (Fincas/Machos/Hembras/Crías/Embriones/Otros) + banner header + logo. Cada una con preview actual y zona drag-and-drop (`react-dropzone`-style nativo: `onDragOver/onDrop`) + botón "Resetear al original" (borra el override). |
| **Banners de páginas** | Banner Menú, banner Lista (CategoríaAnimales/Fincas), banner HojaVida. Igual: preview + dropzone. |
| **Fotos de fincas** | Una fila por finca con su foto actual y dropzone. **Requiere migration**: `alter table fincas add column foto_url text`. |
| **Fotos de animales** | Reemplaza la pestaña actual de `Admin.tsx`. Mismo grid pero con dropzone por fila + filtro por finca/tipo. |

Drag-and-drop: zona resaltada al `dragenter`, archivo se redimensiona con `resizeImage` existente, sube a `app-assets/{key}/{timestamp}.jpg`, hace upsert en `app_assets`, invalida React Query → todas las pantallas que usan ese asset se actualizan al instante.

### 3. Información finca (vista jerárquica)

Ruta `/superadmin/finca/:fincaId?`.

Layout split:
- **Columna izquierda (w-72)**: lista clicable de todas las fincas con contador de animales.
- **Columna derecha**: si no hay fincaId → "Selecciona una finca". Si hay:
  - Card con datos de la finca (nombre, ubicación, hectáreas, operarios asignados).
  - Tabs: **Machos | Hembras | Crías | Embriones**. Cada tab es una `Table` shadcn con todas las columnas relevantes (código, nombre, raza, color, fecha nac, registro, padre, madre, foto thumbnail).
  - Click en una fila → drawer/sheet lateral que muestra todos los eventos del animal (vacunas, pesajes, palpaciones, partos, inseminaciones, medicaciones, dietas, ciclos calor, chequeos, embriones detalle) en accordions.

Sin paginación inicial (Supabase 1000 limit es suficiente por ahora, lo notamos en TODO si crece).

### Cambios técnicos resumidos

| Archivo / recurso | Cambio |
|---|---|
| `supabase/migrations/*` | (1) Crear tabla `app_assets` + RLS. (2) Crear bucket `app-assets` público + policies. (3) `alter table fincas add column foto_url text`. |
| `supabase/functions/list-display-names/index.ts` | Excluir usuarios con rol `super_admin` (subquery sobre `user_roles`). |
| `supabase/functions/admin-update-user/index.ts` (nuevo) | Editar nombre/email/password/active. Solo super_admin (admins solo pueden tocar operarios). |
| `supabase/functions/admin-update-user-role/index.ts` (nuevo) | Cambiar rol. Solo super_admin. |
| `src/pages/SuperAdminLogin.tsx` (nuevo, ruta `/sa`) | Form email+password. |
| `src/pages/SuperAdmin/Layout.tsx` (nuevo) | Sidebar + outlet. |
| `src/pages/SuperAdmin/Dashboard.tsx` (nuevo) | KPIs. |
| `src/pages/SuperAdmin/Usuarios.tsx` (nuevo) | Tabla + modales editar/crear. |
| `src/pages/SuperAdmin/Imagenes.tsx` (nuevo) | 4 sub-tabs con dropzone. |
| `src/pages/SuperAdmin/InformacionFinca.tsx` (nuevo) | Vista jerárquica con drawer de eventos. |
| `src/hooks/useAppAsset.ts` (nuevo) | Lee `app_assets` con React Query. |
| `src/components/AssetDropzone.tsx` (nuevo) | Reusable drag-and-drop. |
| `src/App.tsx` | Añadir rutas `/sa` y `/superadmin/*` con `ProtectedRoute requireRoles={["super_admin"]}`. Ocultar `SafeAreaTopBar` y `BottomTabBar` en estas rutas (o ya están solo donde se renderizan). |
| `src/pages/Index.tsx` | Si `roles.includes("super_admin")` → redirige a `/superadmin` en vez de `/menu`. |
| `src/components/ProtectedRoute.tsx` | Si super_admin entra a una ruta no-superadmin → redirige a `/superadmin`. |
| `src/pages/Menu.tsx`, `Fincas.tsx`, etc. | Cambiar imports estáticos por `useAppAsset(key, fallback)` para los assets editables. |

### Seguridad
- Toda mutación pasa por edge function que valida `super_admin` server-side.
- RLS de `app_assets`: SELECT autenticado, write solo `has_role(auth.uid(), 'super_admin')`.
- Bucket `app-assets`: lectura pública, write solo super_admin (RLS sobre `storage.objects`).
- El admin existente sigue viendo `/admin` actual sin cambios — su panel ya no se mezcla con el de super_admin.

### Pendiente / fuera de alcance
- Auditoría detallada de cambios de imágenes (ya existe `audit_log`, se podría enganchar después).
- Paginación de tablas grandes — se añade si alguna pasa de 500 filas.
- "Otros" del menú: queda como `/generalidades` placeholder, no se toca.

