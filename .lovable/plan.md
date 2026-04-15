

## JPS Ganadería - App de Control Ganadero

### Diseño
- **Tema**: Negro y dorado, inspirado en la imagen de referencia
- **Paleta**: Fondo negro (#0a0a0a), dorado (#c9a84c / #b8963e), blanco para textos
- **Mobile-first**, totalmente responsive

### Vista 1 - Pantalla de Inicio / Login
- Pantalla dividida en dos secciones (70/30 vertical)
- **70% superior**: Hero con la imagen del toro y logo JPS Ganadería (fondo negro, imagen de alta resolución - por ahora placeholder oscuro hasta que adjuntes la imagen final)
- **30% inferior**: Fondo dorado con botón "INICIAR SESIÓN"
- **Interacción**: Al hacer clic en el botón, se transforma con animación en un input con placeholder "Digite su cédula" + botón de confirmar
- **Autenticación simple**: Solo cédula, sin correo ni contraseña
- Pantalla fija (sin scroll), `height: 100dvh`

### Rutas (placeholder por ahora)
- `/` → Pantalla de login (Vista 1)
- `/menu` → Menú principal
- `/machos` → Gestión de machos
- `/hembras` → Gestión de hembras
- `/crias` → Gestión de crías
- `/embriones` → Gestión de embriones
- `/generalidades` → Generalidades

### Notas técnicas
- Se copiará la imagen del logo subida al proyecto
- Las demás vistas tendrán un layout base con navegación, contenido placeholder
- No se usa Supabase Auth — la autenticación será custom con cédula

