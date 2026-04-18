

## Plan: Botón de actualización forzada en VersionFooter

### Problema actual
El SW antiguo instalado en tu celular probablemente no tiene la lógica de `PwaUpdatePrompt`, por eso no aparece el modal. Necesitamos un mecanismo manual para forzar la actualización desde la UI.

### Solución
Convertir `VersionFooter` en un botón clickeable que:
1. Al tocarlo → fuerza chequeo de updates del SW
2. Si encuentra update → recarga la app con la nueva versión
3. Si no encuentra → limpia caches y recarga de todos modos (nuclear option, garantiza traer lo último del servidor)

### Cambios

**1. `src/components/VersionFooter.tsx`** — convertir a botón interactivo
- Importar `registerSW` de `virtual:pwa-register` para tener acceso al control del SW
- Estado local: `checking` (mostrar "Buscando..." mientras chequea)
- Al hacer clic:
  - Llamar `registration.update()` para forzar chequeo
  - Esperar ~1.5s
  - Si hay nueva versión disponible (waiting worker) → `skipWaiting` + recargar
  - Si no → ejecutar "hard refresh": desregistrar todos los SW + borrar todos los caches (`caches.delete`) + `window.location.reload()`
- Mostrar toast con `sonner` indicando el resultado: "Buscando actualizaciones...", "Actualizando a nueva versión", o "Ya tienes la última versión"
- Mantener el aspecto visual actual (texto pequeño dorado) pero con `cursor-pointer`, `hover:text-gold` y `active:scale-95` para feedback táctil
- Agregar ícono pequeño `RefreshCw` de lucide-react (12px) al lado de la versión

**2. Verificar que `VersionFooter` esté visible debajo del BottomTabBar en Menu**
Revisar `src/pages/Menu.tsx` para confirmar dónde se renderiza. Si está dentro del scroll, moverlo a posición fija debajo del tab bar para que siempre se vea.

### Detalle técnico del "hard refresh"
```typescript
// 1. Desregistrar todos los SW
const regs = await navigator.serviceWorker.getRegistrations();
await Promise.all(regs.map(r => r.unregister()));

// 2. Borrar todos los caches
const cacheNames = await caches.keys();
await Promise.all(cacheNames.map(n => caches.delete(n)));

// 3. Recargar desde servidor (no caché)
window.location.reload();
```

Esto garantiza que aunque el SW viejo esté roto, el siguiente reload traiga TODO desde el servidor y registre el SW nuevo con la lógica de `PwaUpdatePrompt`. Una vez hecho esto una vez, los updates futuros sí funcionarán automáticamente con el modal.

### Archivos
| Archivo | Cambio |
|---|---|
| `src/components/VersionFooter.tsx` | Convertir a botón con lógica de update forzada + hard refresh |
| `src/pages/Menu.tsx` | Verificar/ajustar posición del footer debajo del BottomTabBar |

### Notas importantes
- En el **preview de Lovable** el botón hará el hard refresh pero no registrará SW nuevo (porque está bloqueado por el guard en `main.tsx`). Esto es correcto.
- En **producción (`id-ganadero.lovable.app`)** funcionará completo: chequeo + activación de SW nuevo + recarga.
- Después de usar el botón **una vez** en producción, tu PWA tendrá el SW nuevo con `PwaUpdatePrompt`, y de ahí en adelante los updates futuros mostrarán el modal automáticamente cada 60s sin necesidad del botón.

