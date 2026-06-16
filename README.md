# Dashboard Unificado · CNE / AE

Centro de mando único que fusiona los 10 dashboards en **una sola app Next.js**,
separados por vertical **CNE** y **Actores Electorales (AE)** mediante un **selector
desplegable**, con diseño **glassmorphism + neón oscuro** y acento de color por vertical.

## Arranque

```bash
npm install
npm run dev      # http://localhost:3000
```

Credenciales (ver `.env.local`):
- Admin: `custos-admin-2026`
- Viewer: `viewer2026`

## Arquitectura

- **Una app, rutas por vertical:** `/(shell)/cne/*`, `/(shell)/ae/*`, `/(shell)/shared/*`.
- **3 bases de datos Supabase separadas** vía *registry* (`src/lib/supabase/clients.ts`):
  | alias | proyecto | módulos |
  |-------|----------|---------|
  | `analytics`  | wwhmyqncxxurrcwqudxw | analytics GA4, parrillas, presidenciales |
  | `estrategia` | tqnobpyqtlmbmxfnhdft | prensa, rrss, eventos, soporte |
  | `content`    | klecvgchqqbkasedxtxj | parrilla genérica |
  Cada módulo pide su cliente con `getDb('estrategia')`.
- **Config declarativa de verticales** (`src/lib/verticals.ts`): único origen de verdad
  para menú, rutas, color de acento, DB y el cruce entre verticales.
- **Auth con Supabase Auth** (proyecto `estrategia`): login por usuario/email
  (`signInWithPassword`, server actions en `src/app/actions/auth.ts`), sesión por
  cookies (`@supabase/ssr`) y refresh en `middleware.ts`. Roles en la tabla
  `profiles` (`superadmin` | `admin` | `viewer`) y acceso por pantalla por usuario
  en `user_screen_access`. El superadmin gestiona usuarios en `/admin/usuarios`.
  Migración: `supabase_auth_rbac_setup.sql`.

## Selector CNE / AE

`VerticalSwitcher` (Topbar) cambia de vertical: persiste cookie, **re-tematiza** el acento
neón al instante, **filtra el menú** y **salta al módulo equivalente** (`/cne/rrss` →
`/ae/rrss`). Paleta de comandos con `Ctrl/Cmd + K`.

## Diseño

Tokens en `src/app/globals.css`. Superficies `.glass` / `.glass-strong`, utilidades
`.neon-border` / `.neon-text` / `.neon-glow`. Acento por `data-vertical` (CNE cian, AE magenta).

## Estado

- ✅ Fase 0 — Andamiaje (configs, registry 3 DBs, verticals)
- ✅ Fase 1 — Shell, diseño, auth, selector CNE/AE, paleta de comandos (build + smoke test OK)
- ✅ Fase 2 — Migración del contenido interno de **todos** los módulos. Build: 28 rutas OK.
  | Módulo | Ruta | DB | Tablas |
  |--------|------|----|--------|
  | RRSS | `/cne/rrss`, `/ae/rrss` | estrategia | estrategia_digital_metrics, listening_metrics, dashboard_images |
  | Analytics GA4 | `/ae/analytics` | analytics + GA4 API | manual_metrics + Google Analytics 4 |
  | Prensa | `/ae/prensa` | estrategia | monitoreo_medios, manual_metrics |
  | Eventos | `/cne/eventos` | estrategia | content_manager_metrics (+ reusa RRSS) |
  | Parrillas AE | `/ae/parrilla` | analytics | Presidenciales: parrilla_presidenciales_ae · Misión Obs.: parrilla_actores_electorales |
  | Parrillas CNE | `/cne/parrilla` | analytics + content | Presidenciales: parrilla_elecciones_presidenciales_cne · Misión Obs.: dashboard_content |
  | Mesa de Ayuda | `/shared/soporte` | estrategia | custos_metrics |

  Cada vertical tiene un módulo **Parrillas** con 2 pestañas: **Presidenciales** y
  **Misión de Observación Internacional**.

  Nota: la API en vivo de GA4 requiere salida a internet hacia `analyticsdata.googleapis.com`
  (falla en entornos sin DNS saliente; funciona en despliegue normal). El resto lee datos
  reales de Supabase ya verificados.

Cada ruta de módulo ya está creada y **conectada a su DB correcta** (con verificación de
conexión en vivo, `DbStatus`). Falta portar las vistas de datos (gráficas, formularios,
tablas y la API GA4) desde cada dashboard original al andamiaje `ModuleScaffold`.
