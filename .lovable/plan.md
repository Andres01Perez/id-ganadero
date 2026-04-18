

## Plan: Modelo de datos completo + rediseño visual JPS Ganadería

### Decisiones aplicadas
- **Diseño visual**: cuero/roble oscuro + dorado, Playfair Display + Inter, imágenes profesionales generadas
- **Modelo de datos**: tabla `animales` central con `tipo` (enum), tablas separadas por dominio (reproductivo, sanitario, peso) cada una con `responsable_id` que se resuelve via JOIN al `display_name` del profile
- **Trazabilidad**: tabla `audit_log` genérica que registra cada INSERT/UPDATE/DELETE en tablas críticas (animales y eventos), via trigger Postgres. No reinventamos wheel: una sola tabla con `tabla`, `registro_id`, `accion`, `cambios_jsonb`, `usuario_id`, `created_at`.

### 1. Modelo de datos (migración Supabase)

**Enums:**
```sql
animal_tipo: 'macho' | 'hembra' | 'cria' | 'embrion' | 'otro'
animal_sexo: 'M' | 'H'
metodo_cruce: 'monta_directa' | 'inseminacion_artificial' | 'fiv' | 'transferencia_embrion'
parto_resultado: 'vivo' | 'muerto' | 'aborto'
palpacion_resultado: 'positivo' | 'negativo'
```

**Tablas principales:**

```text
fincas
  id, nombre, ubicacion, hectareas, activo, created_by, created_at

animales (hoja de identidad — datos del adjunto image-5)
  id, codigo (único), nombre, tipo (enum), sexo (nullable para embrión),
  fecha_nacimiento (nullable), numero_registro, color, raza,
  finca_id (fk), madre_id (self-fk), padre_id (self-fk),
  foto_principal_url, activo, created_by, created_at, updated_at

-- DATOS REPRODUCTIVOS (image-6) — una tabla por evento
ciclos_calor       (id, animal_id, fecha, fecha_proximo_estimado, notas, responsable_id, created_at)
aspiraciones       (id, animal_id, fecha, cantidad_ovocitos, notas, responsable_id, created_at)
embriones_recolectados (id, animal_id_donadora, fecha, cantidad, calidad, notas, responsable_id, created_at)
palpaciones        (id, animal_id, fecha, resultado (enum), tiempo_prenez_dias, notas, responsable_id, created_at)
inseminaciones     (id, animal_id, fecha, hora, metodo (enum), toro_id (fk nullable), toro_externo_nombre, notas, responsable_id, created_at)
partos             (id, animal_id_madre, fecha, sexo_cria (enum), numero_parto, resultado (enum), cria_id (fk nullable), notas, responsable_id, created_at)
chequeos_veterinarios (id, animal_id, fecha, estado, diagnostico, veterinario, notas, responsable_id, created_at)

-- CONTROL Y SOSTENIMIENTO
vacunaciones       (id, animal_id, fecha, vacuna, lote, proxima_dosis, notas, responsable_id, created_at)
medicaciones       (id, animal_id, fecha, medicamento, dosis, motivo, dias_tratamiento, notas, responsable_id, created_at)
dietas             (id, animal_id, fecha_inicio, fecha_fin (nullable), tipo_alimento, cantidad_kg_dia, notas, responsable_id, created_at)

-- PESO (histórico)
pesajes            (id, animal_id, fecha, peso_kg, ganancia_desde_anterior_kg (calculado), evidencia_url, responsable_id, created_at)

-- TRAZABILIDAD
audit_log          (id, tabla, registro_id, accion ('INSERT'|'UPDATE'|'DELETE'), cambios jsonb, usuario_id, usuario_display_name, created_at)
```

**Trazabilidad — recomendación:**
NO crear tabla "transaccional" manual. En su lugar:
- Trigger `audit_trigger()` genérico en Postgres que se aplica a tablas críticas (`animales`, todas las de eventos)
- Captura automáticamente: qué tabla, qué fila, qué cambió (diff JSON), quién (`auth.uid()`) y cuándo
- Snapshot del `display_name` al momento del cambio (por si el operario cambia nombre después)
- Una sola tabla `audit_log` que sirve como timeline completo de "quién hizo qué cuándo en cualquier animal"

Esto es más limpio que duplicar `responsable_id` + tabla separada de cambios. **`responsable_id` se mantiene en cada tabla** (es dato de negocio: "quién hizo esta vacunación") y **`audit_log` registra el evento técnico** (creación/edición/borrado del registro).

### 2. Storage buckets

```
animal-fotos     (público lectura, autenticados escriben — fotos de animales y evidencias de pesaje)
```

### 3. RLS (fase 1 simple)

- Todos los autenticados con role válido pueden SELECT/INSERT en todas las tablas
- UPDATE/DELETE solo por admin/super_admin o por el `responsable_id` original
- `audit_log`: solo SELECT para admin/super_admin (no se inserta manual, solo via trigger)
- Fincas: solo admin/super_admin escriben

### 4. Sistema de diseño + imágenes

**Tokens (`index.css` + `tailwind.config.ts`):**
- `--background` 25 15% 8%, `--card` 25 12% 12%, `--leather` 25 25% 18%
- `--primary` 38 55% 52% (dorado), `--gold-soft` 38 45% 65%
- `--border` 30 20% 22%

**Tipografía:** Playfair Display (titulares serif) + Inter (cuerpo) via Google Fonts en `index.html`

**Imágenes generadas (Nano Banana Pro):**
- Hero login: vaca brahman al atardecer
- 6 menú: fincas, machos, hembras, crías, embriones (lab elegante), otros
- Placeholder animal silueta dorada

### 5. Rutas y pantallas

```text
/                        → Login rediseñado (cédula + contraseña)
/menu                    → 6 cards con imágenes
/categoria/:tipo         → Lista animales (foto, código, nombre, raza, edad)
/animal/:id              → Hoja de vida con tabs
/animal/nuevo?tipo=X     → Form crear animal
/admin                   → Existente
```

**Hoja de vida — tabs:**
1. **Identidad**: campos del image-5 (nombre, edad, fecha nac, registro, color, raza, sexo, genealogía con padres clickeables)
2. **Reproductivo**: timeline + botones "+ Calor", "+ Inseminación", "+ Palpación", "+ Aspiración", "+ Embrión", "+ Parto"
3. **Sanitario**: timeline + "+ Vacuna", "+ Medicina", "+ Chequeo veterinario", "+ Dieta"
4. **Peso**: gráfico recharts + tabla histórica + "+ Registrar peso" con foto opcional
5. **Historial**: audit_log filtrado por este animal (quién cambió qué cuándo)

Cada item del timeline muestra: fecha, tipo, datos clave, **responsable (display_name)**.

### 6. Plan de ejecución por fases

**Fase A (este loop):**
1. Migración SQL: enums + 14 tablas + RLS + audit_trigger
2. Bucket `animal-fotos` con políticas
3. Sistema de diseño nuevo (tokens + fonts)
4. Generar 8 imágenes profesionales
5. Rediseñar Login + Menú con nueva estética e imágenes

**Fase B (siguiente loop, tras tu validación visual):**
6. Página `/categoria/:tipo` con lista
7. Hoja de vida con 5 tabs
8. Forms de creación animal + cada tipo de evento
9. Gráfico de peso + audit log viewer

### Confirmaciones necesarias

1. **`audit_log` automático via trigger** + `responsable_id` en cada tabla de evento — ¿confirmas este enfoque dual o prefieres solo una de las dos opciones?
2. **Embriones**: el animal con `tipo='embrion'` tendrá `sexo=null` y `fecha_nacimiento=null` hasta que nazca. ¿Quieres campos adicionales solo para embriones (donadora_id, receptora_id, fecha_transferencia, estado_implante)? Si sí, los agrego a la tabla `animales` como nullables o creo `embriones_detalle` separada.
3. **Datos seed**: ¿genero 4-5 animales de prueba para que veas la UI con datos, o arrancas vacío?

