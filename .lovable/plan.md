## Diagnóstico

La PWA instalada en el celular sigue mostrando la versión vieja aunque la recarga ocurra. El Service Worker (`public/sw.js`) está bien — sólo cachea imágenes, nunca HTML/JS/CSS. La causa real es una combinación de:

1. **Tap corto en el footer no limpia nada.** Sólo hace `location.href = path + "?v=timestamp"`. En PWA standalone (iOS sobre todo), el shell instalado y el SW siguen activos y el bundle JS hasheado anterior puede seguir sirviéndose desde el HTTP cache del WebView.
2. **`index.html` tiene meta tags `Cache-Control` / `Pragma` / `Expires`.** Estos meta tags no controlan el caché HTTP real (el proxy de Lovable ya envía `no-cache` correctamente) y pueden confundir el comportamiento del WebView en PWA. La guía oficial de Lovable indica explícitamente no agregarlos.
3. **No hay forma de saber rápido si el HTML que recibe la PWA ya es el nuevo.** El footer muestra el `BUILD_ID` del bundle actualmente cargado, no del último publicado, así que el usuario no puede confirmar si "ya bajó la nueva".

El comportamiento esperado tras este plan: el tap corto basta para traer la última versión publicada en cualquier dispositivo, sin necesidad de mantener pulsado.

## Cambios

### 1. `index.html` — quitar meta cache-control
Eliminar las tres líneas:
```
<meta http-equiv="Cache-Control" ... />
<meta http-equiv="Pragma" ... />
<meta http-equiv="Expires" ... />
```
El proxy de Lovable ya manda los headers HTTP correctos.

### 2. `src/components/VersionFooter.tsx` — tap corto = limpieza completa
Unificar comportamiento: cualquier tap (corto o largo) hace lo que hoy hace el long-press, es decir:
- `unregister()` de todos los Service Workers
- borrar todos los `caches`
- recargar con cache-bust

Resultado: un solo tap garantiza traer la última versión. El long-press se elimina (deja de ser necesario y evita que un tap accidental "no limpie").

Visualmente seguimos mostrando `vX.Y.Z · BUILD_ID` para que el usuario vea cambiar el build después de actualizar.

### 3. `src/hooks/useAppUpdate.tsx` — auto-recarga al detectar versión nueva
Hoy muestra un toast "Nueva versión disponible" con botón Actualizar. El usuario reporta baja literacidad técnica — muchos no van a tocar el toast. Cambiar a:
- Cuando se detecta nueva versión Y la app vuelve a estar visible (`visibilitychange → visible`), recargar automáticamente con limpieza de SW/caches.
- En la primera detección durante la sesión activa, mantener el toast (no recargar bajo los pies del usuario mientras escribe), pero hacerlo no descartable hasta que toque "Actualizar".

### 4. Verificación
Tras desplegar:
- Abrir la PWA → tocar versión en footer una vez → debe mostrar el nuevo BUILD_ID.
- Cerrar y volver a abrir la PWA → si hay versión nueva publicada, se actualiza sola.

## Notas técnicas

- No tocamos `public/sw.js` — su comportamiento (sólo imágenes) es correcto.
- No agregamos `vite-plugin-pwa` ni cambios al manifest. `start_url`/`scope` quedan congelados desde la instalación de cada usuario, no se pueden cambiar para PWAs ya instaladas.
- El `useAppUpdate` sigue desactivado en iframe/preview de Lovable — sólo corre en producción.
- Aclarar al usuario: los cambios de **frontend** sólo salen en vivo después de tocar "Update" en el diálogo de Publicar. Los cambios de **backend** (migraciones, edge functions) salen automáticos.
