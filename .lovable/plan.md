

## Plan final: Rediseño visual JPS con tipografía Fira Sans Condensed

### Cambio tipográfico (aplica a TODO el proyecto)
- **Única fuente**: `Fira Sans Condensed` (Google Fonts) — peso base 400 (Regular)
- Pesos disponibles para jerarquía: 400 (cuerpo, labels), 600 (títulos de sección, banda dorada), 700 (nombres de animales en listas, código en hoja de vida)
- Eliminar `Playfair Display` e `Inter` del proyecto
- En `index.html`: reemplazar el `<link>` actual de Google Fonts por el embed code que enviaste
- En `tailwind.config.ts`: `fontFamily.sans = ['"Fira Sans Condensed"', 'system-ui', 'sans-serif']` y eliminar `fontFamily.serif`
- En `src/index.css`: cambiar `font-family` de `html, body` y de los `h1-h4` a Fira Sans Condensed; eliminar la clase `.font-mono-num` (ya no aplica, Fira Condensed tiene buenos numerales)

### Resumen consolidado del rediseño completo

**Assets que tengo:**
- `user-uploads://ID_GANADERO-06_HIERRO.webp` → `src/assets/jps-logo.webp`
- `user-uploads://image-11.png` → `src/assets/jps-login-hero.png`

**Assets que generaré con IA:**
- `src/assets/menu-header.webp` (1200×600, <120KB) — vacas Brahman en pradera
- `src/assets/lista-header.webp` (1200×500, <100KB) — pradera con vacas

**Paleta:**
```text
--background: 45 25% 90%   #EDE9DD beige
--foreground: 0 0% 0%      #000000 negro
--primary:   41 35% 55%    #B79F60 dorado
--card:      0 0% 100%     blanco
```

**Pantallas:**
1. `/` Login: hero `image-11` ocupa 80% + banda dorada inferior "INICIAR SESIÓN" → abre `Sheet` negro con formulario actual (select + password)
2. `/menu`: header foto + logo, banda dorada "CONTROL GENÉTICO JPS", grid 2×3 de círculos con borde dorado y label en arco SVG, tab bar inferior
3. `/categoria/:tipo`: header foto, banda dorada con título, lista de filas (avatar circular + nombre bold), FAB "+", tab bar
4. `/animal/:id`: foto grande, banda dorada con código, info general en 2 columnas, grid 2 cols de pills doradas (Calor, Aspiraciones, Embriones, Palpaciones, Cruces, Dieta, Peso, Partos, Chequeo, Campeonatos), tab bar
5. `BottomTabBar` componente: fondo negro, 4 categorías, activa con fondo blanco
6. `/admin` tab "Animales": upload de foto por animal a bucket `animal-fotos`, redimensiona a 800×800 en cliente

**Estándares de carga:**
- Todas las imágenes en WebP, `loading="lazy"` excepto hero del login
- Target <300KB de imágenes por pantalla

**Pills de eventos**: por ahora navegan a placeholder "Próximamente" — los formularios reales son Fase B.

**Memoria a actualizar**: paleta cambia a beige/dorado/negro; tipografía única Fira Sans Condensed.

### Orden de ejecución (un solo loop al aprobar)
1. Copiar assets del usuario a `src/assets/`
2. Actualizar `index.html` con el embed de Fira Sans Condensed (eliminar Playfair/Inter)
3. Reescribir tokens y tipografía en `src/index.css` y `tailwind.config.ts`
4. Generar `menu-header.webp` y `lista-header.webp` con IA
5. Reescribir `src/pages/Index.tsx` (login con hero + sheet modal)
6. Reescribir `src/pages/Menu.tsx` (grid círculos + texto curvado SVG + tab bar)
7. Crear `src/components/BottomTabBar.tsx`
8. Crear `src/pages/CategoriaAnimales.tsx` y registrar ruta `/categoria/:tipo`
9. Crear `src/pages/HojaVidaAnimal.tsx` y registrar ruta `/animal/:id`
10. Agregar tab "Animales" en `src/pages/Admin.tsx` con upload de fotos
11. Crear bucket `animal-fotos` (público, RLS: insert/update solo admin) vía migración
12. Actualizar memoria del proyecto

