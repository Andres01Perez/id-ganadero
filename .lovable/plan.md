

## Plan: Versionado de PWA + auto-actualización sin reinstalar

### Problema actual
- La PWA ya tiene `registerType: "autoUpdate"` y existe `PwaUpdatePrompt.tsx`, pero:
  - No hay versión visible en ningún lado (no sabes qué versión corre el celular)
  - El service worker cachea `index.html` y assets — al publicar nuevas versiones el celular puede seguir mostrando la vieja hasta que el SW detecte el cambio
  - El prompt de actualización solo aparece si se dispara `onNeedRefresh`, pero nunca verificas activamente si hay update
- Necesitas: ver cambios de login/usuarios en el celular sin desinstalar

### Estrategia

**1. Versionado automático desde Git**
- Inyectar versión + hash de commit en build time vía `vite.config.ts` usando `define`
- Fuente: variables de entorno (`__APP_VERSION__`, `__APP_COMMIT__`, `__APP_BUILD_DATE__`)
- En local/Lovable: usa `package.json` version + timestamp
- En GitHub Actions / build de producción: usa `git rev-parse --short HEAD`
- Sin scripts externos: todo dentro de `vite.config.ts` con `child_process.execSync` (con try/catch fallback a "dev")

**2. Footer de versión visible**
- Crear `src/components/VersionFooter.tsx` — pequeño texto al pie en `/menu` y `/admin`
- Formato: `v0.1.0 · a3f8485` (versión · commit corto)
- Discreto, color tenue, no estorba diseño negro+dorado

**3. Auto-update agresivo (lo más importante)**
- Mejorar `PwaUpdatePrompt.tsx`:
  - Llamar `registerSW` con `onNeedRefresh` Y `onOfflineReady`
  - Agregar `immediate: true` y polling cada 60s (`updateInterval`) para que detecte actualizaciones sin esperar a que el usuario reinicie la app
  - Al hacer clic en "Actualizar": llama `updateServiceWorker(true)` que hace skipWaiting + reload completo
- Ajustar `vite.config.ts` workbox:
  - `skipWaiting: true` y `clientsClaim: true` — el nuevo SW toma control inmediatamente
  - `cleanupOutdatedCaches: true` — borra caches viejos
  - Mantener `navigateFallbackDenylist: [/^\/~oauth/]`

**4. Modal de actualización (mejor UX que el toast actual)**
- Reemplazar el banner inferior por un `AlertDialog` (ya existe `src/components/ui/alert-dialog.tsx`) centrado:
  - Título: "Nueva versión disponible"
  - Descripción: "Versión X.X.X lista. Actualiza para ver los últimos cambios."
  - Botón principal: "Actualizar ahora" (dorado)
  - Botón secundario: "Después" (cierra modal, vuelve a aparecer en próximo polling)

### Archivos a tocar

**Modificar:**
1. `vite.config.ts`
   - Agregar `define` con `__APP_VERSION__`, `__APP_COMMIT__`, `__APP_BUILD_DATE__` (lee de `package.json` + `git rev-parse`)
   - Workbox: `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`
   - VitePWA: agregar versión en el manifest description

2. `src/vite-env.d.ts`
   - Declarar las globals `__APP_VERSION__: string`, `__APP_COMMIT__: string`, `__APP_BUILD_DATE__: string`

3. `src/components/PwaUpdatePrompt.tsx`
   - Refactor a modal `AlertDialog`
   - Polling cada 60s con `updateInterval`
   - Mostrar versión nueva en el modal
   - Manejo correcto de `onRegisteredSW` para chequeo periódico

4. `src/pages/Menu.tsx` y `src/pages/Admin.tsx`
   - Agregar `<VersionFooter />` al final

**Crear:**
5. `src/components/VersionFooter.tsx`
   - Componente simple que lee las globals y muestra `v{version} · {commit}`

### Flujo end-to-end
1. Haces cambios → push a GitHub (ya conectado vía Lovable)
2. Lovable publica → build inyecta versión nueva + commit hash en el bundle
3. Tu celular (con la PWA instalada) hace polling cada 60s al `/sw.js`
4. Detecta versión nueva → muestra modal "Nueva versión disponible"
5. Tocas "Actualizar ahora" → SW skipWaiting + reload → ves los cambios sin reinstalar
6. Footer ahora muestra la versión nueva

### Notas técnicas
- `git rev-parse` en `vite.config.ts` se ejecuta en build server. Si falla (no hay git), fallback a `"local"`.
- Bumps de versión: por ahora manual en `package.json`. Si quieres automatizarlo después con `standard-version` o tags de git, lo agregamos en otra fase.
- El polling de 60s solo corre cuando la app está abierta — no consume batería en background.

### Pregunta antes de implementar
¿Bumpeamos `package.json` a `0.1.0` ahora como punto de partida, o lo dejas en `0.0.0` y subes manualmente cuando quieras marcar releases?

