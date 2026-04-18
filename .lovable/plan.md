

## Plan: Fundación de auth + roles para JPS Ganadería

### Decisiones aplicadas
- **App single-tenant** (solo JPS). Sin `tenant_id`, sin subdominios, sin branding dinámico.
- **Auth real con Supabase Auth**, pero ocultando el email al usuario:
  - Front muestra **selector de "Nombre" + campo "Contraseña"**
  - Cada usuario tiene un `display_name` (ej. "Juan Pérez") que mapea a un email sintético `juanperez@yopmail.com`
  - Los usuarios **no pueden auto-registrarse** — solo se crean desde el panel admin
- **Roles:** `super_admin` (yo, el desarrollador), `admin` (cliente JPS), `operario` (ganaderos en campo)

### Esta fase = SOLO infraestructura de auth + roles
No tocamos módulos de negocio (Fincas/Machos/etc.) hasta tener la base sólida.

---

### Arquitectura de datos

```text
auth.users (gestionado por Supabase)
    │
    │ id (uuid)
    ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│ profiles                 │     │ user_roles               │
│ id (= auth.users.id) PK  │     │ id PK                    │
│ display_name TEXT UNIQUE │     │ user_id FK → auth.users  │
│ email TEXT (sintético)   │     │ role app_role            │
│ created_by FK → users    │     │ UNIQUE(user_id, role)    │
│ active BOOLEAN           │     └──────────────────────────┘
│ created_at, updated_at   │
└──────────────────────────┘
```

**Enum `app_role`:** `'super_admin' | 'admin' | 'operario'`

**Funciones security-definer:**
- `has_role(_user_id uuid, _role app_role) → boolean` — chequeo de rol sin recursión RLS
- `is_admin_or_super(_user_id uuid) → boolean` — helper para policies

**RLS:**
- `profiles`: usuario puede leer su propio profile; admin/super_admin leen todos; solo admin/super_admin insert/update/delete
- `user_roles`: usuario puede leer sus propios roles; solo super_admin asigna roles

---

### Flujo de login (cómo se ve en el front)

1. Usuario abre la app → ve selector dropdown con todos los `display_name` activos (consulta pública limitada via edge function)
2. Selecciona "Juan Pérez" → aparece campo de contraseña
3. Digita contraseña → el cliente llama `supabase.auth.signInWithPassword({ email: "juanperez@yopmail.com", password })`
4. Sesión persistida via Supabase Auth (JWT, refresh tokens, todo nativo)
5. `useAuth` hook expone user + roles → routing redirige según rol

**Listado de nombres para el dropdown:** edge function pública `list-display-names` que devuelve solo `[{ id, display_name }]` de profiles activos. Sin exponer emails ni roles.

---

### Creación de usuarios (solo admin/super_admin)

Edge function `admin-create-user` (requiere JWT con rol admin/super_admin):
1. Recibe `{ display_name, password, role }`
2. Genera email sintético: `slugify(display_name) + "@yopmail.com"` (ej. "Juan Pérez" → `juanperez@yopmail.com`)
3. Valida unicidad de `display_name`
4. Crea user en Supabase Auth via service role key
5. Inserta row en `profiles` y `user_roles`
6. Devuelve confirmación

---

### Cambios en el front

1. **Refactor `src/pages/Index.tsx`** — reemplazar el flujo actual cédula→localStorage por:
   - Dropdown de selección de nombre (carga via edge function)
   - Campo de contraseña
   - Llamada real a Supabase Auth
   - Eliminar `localStorage.setItem("cedula", ...)`

2. **Crear `src/hooks/useAuth.tsx`** — hook con `user`, `session`, `roles`, `signOut()`. Usa `onAuthStateChange` + lectura de `user_roles`.

3. **Crear `src/components/ProtectedRoute.tsx`** — wrapper que requiere sesión activa y opcionalmente un rol específico.

4. **Actualizar `src/App.tsx`** — envolver rutas autenticadas en `ProtectedRoute`. Rutas: `/` (login público), `/menu` y módulos (requieren auth), `/admin` (requiere `admin` o `super_admin`).

5. **Actualizar `src/pages/Menu.tsx`** — usar `useAuth` para mostrar nombre del usuario y para `signOut()` real (no `localStorage.removeItem`).

6. **Crear `src/pages/Admin.tsx`** (placeholder) — pantalla protegida que confirme que el sistema de roles funciona. Botón "Crear usuario" llamando a `admin-create-user`. Lo expandimos en la siguiente fase.

---

### Edge functions a crear

- `list-display-names` (pública) — devuelve nombres para el dropdown del login
- `admin-create-user` (protegida, requiere admin/super_admin) — crea usuario + profile + rol

---

### Bootstrap del primer super_admin

Como aún no hay nadie con rol `super_admin` para crear el primer usuario, el flujo será:
1. Ejecutar la migración (crea tablas + funciones, vacías)
2. Tú me das un `display_name` y contraseña deseados
3. Lo creo manualmente vía SQL en la migración de seed (un solo INSERT a `auth.users` no es posible vía SQL puro, así que lo haremos vía un seed script o tú ejecutas el signup una vez en el dashboard de Supabase y yo te asigno el rol via SQL)

**Opción más simple:** te indico cómo crear tu user en Supabase Dashboard (Authentication → Add user) con email `tunombre@yopmail.com` y password. Luego una migración inserta tu profile + rol `super_admin` referenciando ese user_id.

---

### Resumen de archivos

**SQL (migración):**
- Enum `app_role`
- Tabla `profiles` + RLS
- Tabla `user_roles` + RLS
- Funciones `has_role`, `is_admin_or_super`
- Trigger `handle_new_user` (auto-crea profile vacío al signup, aunque solo admin lo invoca)

**Edge functions:**
- `supabase/functions/list-display-names/index.ts`
- `supabase/functions/admin-create-user/index.ts`

**Front:**
- `src/hooks/useAuth.tsx` (nuevo)
- `src/components/ProtectedRoute.tsx` (nuevo)
- `src/pages/Index.tsx` (refactor completo del login)
- `src/pages/Menu.tsx` (usa useAuth)
- `src/pages/Admin.tsx` (nuevo, placeholder)
- `src/App.tsx` (rutas protegidas)

---

### Antes de implementar necesito saber

1. **Tu super_admin:** ¿qué `display_name` quieres? (ej. "Andrés Dev" → `andresdev@yopmail.com`). Tú creas el user en el Dashboard de Supabase y la migración te asigna el rol.
2. **¿Mantenemos el branding actual** (negro + dorado #b79f60, hero JPS) intacto? Asumo que sí.
3. **¿Confirmas el nombre del campo "Contraseña"** o prefieres "PIN" en el front (sigue siendo password en el backend, solo cambia la etiqueta)?

