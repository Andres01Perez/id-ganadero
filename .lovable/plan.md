

## Plan: Reorganizar logo JPS y acceso a Admin

### 1. Eliminar logo del header en Menu (`src/pages/Menu.tsx`)
- Quitar el `<img src={jpsLogo} ... />` del header (línea ~92)
- Quitar el import de `jpsLogo`
- El botón de Admin (Shield) sigue ahí mientras lo movemos al BottomTabBar
- Mantener el botón de logout a la izquierda

### 2. Eliminar logo del header en Admin (`src/pages/Admin.tsx`)
- Quitar el `<img src={jpsLogo} ... />` del header negro (línea ~178)
- Mantener el import porque sigue usándose como placeholder en `AnimalPhotoRow` (cuando un animal no tiene foto)

### 3. Agregar tab "Admin" al BottomTabBar (`src/components/BottomTabBar.tsx`)
Convertir la barra de 4 a 5 columnas, con el tab Admin **condicional** (solo visible para usuarios con rol `admin` o `super_admin`).

**Nuevo layout:**
```text
┌─────────┬─────────┬─────────┬───────────┬────────┐
│ Machos  │ Hembras │  Crías  │ Embriones │ Admin* │
└─────────┴─────────┴─────────┴───────────┴────────┘
                                          *solo admin
```

**Cambios técnicos:**
- Importar `useAuth` para leer `roles`
- Importar ícono `Shield` de lucide-react
- Construir `tabs` dinámicamente: si `isAdmin` agregar `{ label: "Admin", to: "/admin", icon: Shield }`
- Cambiar `grid-cols-4` a `grid-cols-5` (cuando es admin) o mantener `grid-cols-4` (cuando no)
- Usar clase dinámica: `grid-cols-${tabs.length}` no funciona con Tailwind JIT, así que usar condicional explícito: `isAdmin ? "grid-cols-5" : "grid-cols-4"`

### 4. Quitar botón Shield del header de Menu
Ya que Admin ahora vive en el BottomTabBar, eliminar el botón flotante Shield del header de `Menu.tsx` (líneas ~84-90) para evitar duplicación. Quitar también el `useNavigate` y la lógica `isAdmin` si no se usan en otro lado del componente.

### Resumen de archivos
| Archivo | Cambio |
|---|---|
| `src/pages/Menu.tsx` | Eliminar logo header + botón Shield admin |
| `src/pages/Admin.tsx` | Eliminar logo del header negro |
| `src/components/BottomTabBar.tsx` | Agregar tab Admin condicional (solo admin/super_admin) |

### Notas
- El logo sigue mostrándose en: Login, headers de otras páginas (CategoriaAnimales, HojaVidaAnimal, etc.) y como placeholder en `AnimalPhotoRow`
- El acceso a Admin queda protegido a nivel de UI (solo visible para admins) y a nivel de ruta (ya existe `ProtectedRoute`)

