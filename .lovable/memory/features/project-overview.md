---
name: project-overview
description: App structure, theme, routes, auth model
type: feature
---
# JPS Ganadería — overview

PWA mobile-first de control genético de ganado.

## Tema visual
- Paleta: beige `#EDE9DD` (background), negro `#000000` (foreground/sidebar), dorado `#B79F60` (primary/accents), blanco para tarjetas.
- Tipografía única: **Fira Sans Condensed** (Google Fonts), peso base 400. 600 para títulos/banda dorada, 700 para nombres en listas.
- Componentes característicos: banda dorada horizontal con texto en mayúsculas tracking ancho, círculos con borde dorado 3px, pills doradas redondeadas, tab bar inferior negra con activa en blanco.

## Rutas
- `/` Login (hero `image-11` + Sheet modal negro con form)
- `/menu` Grid 2×3 de círculos: Fincas, Machos, Hembras, Crías, Embriones, Generalidades
- `/categoria/:tipo` Lista de animales por tipo (macho/hembra/cria/embrion)
- `/animal/:id` Hoja de vida con info general + 10 pills de eventos
- `/admin` Tabs: Animales (subir foto a bucket `animal-fotos`) + Usuarios (crear)
- `/fincas`, `/generalidades` placeholders

## Auth
- Cédula-only (login por display_name → email derivado `slug@yopmail.com` + password).
- Roles en `user_roles`: operario / admin / super_admin.
- Edge function `list-display-names` lista usuarios para el select del login.

## Storage
- Bucket público `animal-fotos`. Solo admin/super_admin sube; cualquier autenticado activo lista; URLs públicas para `<img>`.
- Cliente redimensiona a 800×800 JPEG antes de subir.

## Eventos (Fase B pendiente)
Pills en hoja de vida navegan a placeholders por ahora: calor, aspiraciones, embriones, palpaciones, cruces, dieta, peso, partos, chequeo, campeonatos.
