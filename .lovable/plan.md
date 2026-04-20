

## Detección nativa de actualizaciones (sin Service Worker)

### Veredicto sobre tu plan
**Sí se puede aplicar tal cual, con 3 mejoras quirúrgicas** que lo hacen más robusto y evitan falsos positivos. Tu razonamiento es correcto: Vite ya hashea los bundles y el hosting sirve `index.html` con `no-cache`, así que basta con detectar si el `<script>` que ejecutamos sigue presente en el HTML del servidor.

### Mejoras al hook propuesto

1. **Comparar por hash del bundle, no por src completo**. El `src` puede venir con o sin query string / origin. Extraigo solo el nombre `index-A1b2C3.js` y verifico si aparece en el HTML remoto. Más resistente.

2. **Guard de iframe + preview de Lovable**. En el editor de Lovable la app corre en iframe y el `index.html` cambia constantemente — eso dispararía el toast cada minuto mientras editas. Tu plan no lo contempla. Lo desactivo en `lovable.app`/`lovableproject.com` y dentro de iframe, igual que recomienda la guía PWA. En producción (`id-ganadero.lovable.app` y dominio custom) sí corre.

3. **Throttle + flag para no spammear**. Una vez mostrado el toast, no volvemos a chequear hasta que el usuario recargue. Evita múltiples toasts apilados si vuelve y va de la app varias veces.

4. **Listener cleanup correcto**. Tu código tiene un bug sutil: `removeEventListener` recibe una función diferente a la que registró (porque usas un arrow inline en `addEventListener`). Lo extraigo a una constante.

### Estrategia final

| Trigger | Cuándo |
|---|---|
| Al montar | Una vez, 3s después de cargar (no bloquea TTI) |
| `visibilitychange` → visible | Cuando el usuario vuelve a la app |
| `setInterval` | Cada 2 horas como red de seguridad |
| Después de detectar update | Se desactivan todos los chequeos |

### UX del toast (sonner)

- Persistente (`duration: Infinity`).
- Acción "Actualizar" → `window.location.reload()` (recarga simple; el `no-cache` del HTML basta).
- Acción "Después" para descartar.
- Texto en español, alineado al tono de la app: "Nueva versión disponible — Actualiza para aplicar los últimos cambios."
- Posición: `top-center` para que no choque con el `BottomTabBar`.

### Mantener

- `VersionFooter` como botón de pánico manual (ya funciona).
- `public/sw.js` killer SW (sigue limpiando dispositivos viejos).
- Manifest `display: standalone` (instalable).
- Headers `no-cache` en `index.html`.
- **No** se reintroduce `vite-plugin-pwa`. Cero service workers nuevos.

### Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useAppUpdate.tsx` (nuevo) | Hook con polling + visibilitychange + guards de preview/iframe + extracción de hash del bundle |
| `src/App.tsx` | Llamar `useAppUpdate()` dentro de un componente interno (no se puede llamar en el componente que renderiza `<Sonner />` antes de montar; lo pongo en un wrapper `<AppUpdateWatcher />` que se renderiza junto al Sonner) |
| Toast position | Configurar `<Sonner position="top-center" />` solo si no estaba ya, o pasarlo como prop al toast |

### Detalle técnico clave del hash-check

```ts
// 1. Encontrar el script principal cargado en runtime
const currentSrc = document.querySelector('script[type="module"]')?.getAttribute('src') ?? '';
const currentHash = currentSrc.split('/').pop()?.split('?')[0]; // "index-A1b2C3.js"

// 2. Fetch del HTML root
const html = await fetch('/?_v=' + Date.now(), { cache: 'no-store' }).then(r => r.text());

// 3. Si el bundle actual no aparece en el HTML remoto → hay versión nueva
if (currentHash && !html.includes(currentHash)) {
  // mostrar toast persistente
}
```

En desarrollo el `src` es `/src/main.tsx` y siempre estará en el HTML local, así que el chequeo nunca dispara — comportamiento deseado.

### Pendiente / no incluido
- Filtro por finca en listas (lo dejamos para después).
- Modal de actualización modal-bloqueante (descartado, el toast es menos invasivo y suficiente).

