# Revisión de armonía código ↔ documentación

**Fecha:** 2026-08-24 · **Alcance:** `src/`, `vite.config.ts`, `public/`, `netlify/` contra
[`docs/product.md`](docs/product.md), [`docs/architecture.md`](docs/architecture.md),
[`AGENTS.md`](AGENTS.md), [`ROADMAP.MD`](ROADMAP.MD) y [`docs/api.md`](docs/api.md).

## Resumen ejecutivo

El código respeta las reglas duras de arquitectura y seguridad (ver "Conformidades").
Los desvíos encontrados son casi todos **de documentación desactualizada**, no de
código fuera de norma: la PWA ya está configurada sin reflejarse en docs, quedaron
textos de fases tempranas obsoletos, y un ítem del roadmap quedó marcado como hecho
cuando el refactor lo retiró. Solo hay **un bug real de producto** (texto corrupto en
el manifest) y **una decisión pendiente** (indicador de datos antiguos).

| Severidad | Hallazgos |
| --------- | --------- |
| Alta      | 1 (H1)   |
| Media     | 5 (H2, H3, H5, H7, H9) |
| Baja      | 5 (H4, H6, H8, H10, H11/H12) |
| Informativa | 2 (H13, H14) |

---

## Hallazgos

### H1 · La PWA está configurada pero toda la documentación la trata como pendiente — **Alta (docs + roadmap)**

**Realidad del código:** `vite-plugin-pwa@^1.3.0` instalado; `VitePWA()` configurado en
`vite.config.ts` con manifest completo, `registerType: "autoUpdate"` y `devOptions.enabled`;
`registerSW()` en `src/main.tsx`; iconos PNG/SVG en `public/`; tipos
`vite-plugin-pwa/client` incluidos en `tsconfig.app.json`.

**Docs desfasadas:**

- `ROADMAP.MD §0`: sin marcar «Configurar vite-plugin-pwa», «Crear el manifest»,
  «Añadir iconos», «Configurar el service worker». También «Configurar TypeScript
  estricto» está sin marcar y `strict: true` lleva tiempo activo.
- `AGENTS.md` (línea ~16): «`vite-plugin-pwa` (planned)».
- `docs/architecture.md` (§ Configuration): «via `vite-plugin-pwa` (planned)».

**Propuesta:** marcar los 5 ítems en ROADMAP §0; eliminar "(planned)" en AGENTS y
architecture; mencionar el SW registrado en el bird's eye de architecture (explica
además por qué `notifyNewAdeudos` puede usar `navigator.serviceWorker.ready`).

### H2 · Texto corrupto en el manifest — **Media (bug de código)**

`vite.config.ts` → `manifest.description`:
`"Clase: aplicaciA3n mA3vil para consultar horario..."` (mojibake: `á` → `A3`).

**Propuesta:** reemplazar por `"Clase: aplicación móvil para consultar horario,
calificaciones y alumno."`. Es lo único que un instalador de la PWA ve roto.

### H3 · El indicador de datos antiguos desapareció pero el roadmap lo da por hecho — **Media (decisión)**

`ROADMAP.MD §4` marca `[x] «Mostrar claramente cuando los datos mostrados son
antiguos»`, y `product.md §13/§16` pide comunicar cuándo la información puede no ser
actual. Tras el commit `edea922` (se retiró la barra «Datos guardados») **no existe
ningún indicador visual de staleness**; la única señal indirecta es el recordatorio
diario de reingreso.

**Propuesta (elegir una):**
1. Implementar algo ligero: p. ej. «Actualizado hace X min» discreto en Alumno o bajo
   el header, usando `loadedAt` del cache.
2. Desmarcar el ítem en ROADMAP §4 y dejarlo explícito como pendiente.

La opción 1 es la que deja a la app en armonía con product.md sin cambios de fondo.

### H5 · Regla vieja de Home sobrevive en AGENTS.md — **Media (docs)**

`AGENTS.md` § Feature guidelines → Grades: «When grades exist, Grades becomes Home.»
La regla vigente (Fase C, ya correcta en otras secciones) es: solo con **cambios sin
ver** y promedio ≠ 0. Un agente futuro podría "corregir" el código hacia la regla vieja
leyendo esto.

**Propuesta:** sustituir por «Grades becomes Home only when local tracking reports
unseen changes and the period average is non-zero (`shouldOpenGradesFirst`).»

### H7 · `src/types/` con `AppData` descrito pero inexistente — **Media (docs)**

`architecture.md` dedica una sección a `src/types/` con la interfaz `AppData`
(`alumno/horario/calificaciones/…`) y `AGENTS.md` lista `types/` en su árbol y tabla.
En el código **no existe** `src/types/`; el snapshot real es `CachedAppData
{ alumno, avisos, loadedAt }` en `lib/storage/appDataStore.ts` y los tipos de dominio
se reutilizan de `sith-api-client` (correcto según la propia regla de no duplicar).

**Propuesta:** reescribir la sección de architecture: eliminar `src/types/`; explicar
que el "AppData" conceptual se materializa como `Alumno` (grafo completo del paquete)
+ `CachedAppData` para persistencia. Quitar la fila «Shared application types →
types/» de AGENTS (o redirigirla a «reutilizar tipos del paquete / types.ts por
feature»). Mismo ajuste en el árbol de estructura.

### H9 · El flujo de arranque documenta un auto-fetch que no existe — **Media (docs)**

`AGENTS.md` («Load cached AppData → Render immediately → Fetch fresh data → Replace
cache») y `architecture.md` bird's eye («A background fetch refreshes that data»)
describen actualización automática al abrir. Hoy el fetch ocurre **solo** en login y
pull-to-refresh; el auto-refresh al abrir figura como pendiente en ROADMAP §11.

**Propuesta:** ajustar ambos textos a «render inmediato desde cache; fetch al iniciar
sesión y vía pull-to-refresh; la actualización automática al abrir queda como trabajo
pendiente», o bien implementar el auto-refresh (decisión de producto separada).

### H4 · Párrafo «early setup» obsoleto en architecture.md — **Baja (docs)**

Líneas 8-10 repiten el estatus inicial que ya se corrigió en AGENTS.md.

### H6 · Árboles de estructura incompletos — **Baja (docs)**

Faltan en AGENTS/architecture: `features/devtools/`, `lib/devtools/` (reloj simulado),
`lib/notifications/`. Sobran: `types/`, `styles/` (no existen).

### H8 · Marcadores «(planned)» sobre código existente — **Baja (docs)**

`architecture.md` § schedule marca como *planned* helpers y UI ya implementados
(`getCurrentClass`, `ClassCard`, etc.).

### H10 · Tensión entre la regla anti-botón y la alternativa accesible — **Baja (docs)**

AGENTS prohíbe «un botón Actualizar prominente» mientras la accesibilidad exige que el
gesto no sea el único camino; la solución adoptada (acción discreta «Actualizar» en
Alumno, commit `edea922`) cumple ambas pero ningún texto lo autoriza explícitamente.
Un agente celoso podría eliminarla por la regla de prioridad.

**Propuesta:** añadir una línea en «Refresh behavior»: «Una alternativa accesible no
gestual y discreta (no prominente) es aceptable; vive en la sección Alumno.»

### H11 · Los nuevos toasts de eventos no están en product.md — **Baja (docs)**

Toast verde por calificaciones nuevas/cambiadas y rojo por adeudo nuevo (commits
`3f3c668`, `505116a`) solo están registrados en ROADMAP §7/§10. `product.md §17`
describe únicamente la notificación local del sistema.

**Propuesta:** añadir dos frases a §17 (aviso in-app al detectar eventos, colores por
tipo, independiente del opt-in del sistema operativo).

### H12 · Modo dev ausente del mapa de código — **Baja (docs)**

`features/devtools/` + `lib/devtools/` existen y persiste config en IndexedDB, pero ni
architecture ni AGENTS los mencionan (solo ROADMAP §13). Basta una fila en el Code Map
y en el árbol de estructura, marcados como herramienta de prueba gated.

### H13 · DebtBanner y AdeudoAlertsCard se renderizan en todas las áreas — **Informativa**

En `App.tsx` ambos viven fuera del switch de tabs, así que aparecen en Horario,
Calificaciones y Alumno. Es defendible para el banner (§10 «alerta principal») y hace
que el prompt de opt-in se vea una vez hasta resolverse. Confirmar que es intencional;
si se prefiere contextual, moverlos dentro de StudentPage.

### H14 · Trabajo en curso relacionado — **Informativa**

Queda planificado (aprobado, sin ejecutar) el commit 3 del feature de toasts:
previews en el panel dev y botón «Cerrar modo dev» con flag `enabled` único. Ese
cambio corrige además que hoy `applyDevOverrides` aplica simulaciones aunque el panel
esté bloqueado en producción (guardará por `dev.loaded && dev.enabled`).

---

## Conformidades verificadas

- **Regla de Home condicional**: decidida una sola vez (`shouldOpenGradesFirst` en
  `features/grades/utils.ts`), consumida por `app/App.tsx` vía `getHomeTab`.
- **Un solo camino de refresh**: pull-to-refresh en `AppShell` + guard concurrente
  (`refreshingRef`); sin botones por pantalla.
- **Seguridad de credenciales**: contraseña solo en `credentialsRef` (memoria);
  logout borra IndexedDB; nada sensible en settings store. Cumple product §12 y
  `api.md` § Session decision.
- **Capa API centralizada**: `SithClient` se instancia únicamente en
  `lib/api/client.ts`; errores traducidos a `ApiErrorKind` genéricos.
- **Tipos**: reutilización de `sith-api-client` (re-export en client.ts); cero
  `export default` y cero `any` en `src/`.
- **Storage**: tres stores (`app-data`, `grade-tracking`, `settings`) tal como
  documenta architecture; acceso solo vía servicios de `lib/storage/`.
- **Horario**: helpers puros exactamente los especificados; `useCurrentTime` pausa en
  background, recalcula al volver a foreground y evita ticks por segundo.
- **Adeudos**: banner global `role="alert"`, sin tab propio; `notifyNewAdeudos` como
  seam único con opt-in; transición sin→con adeudo idéntica a la del toast.
- **`docs/api.md`**: coincide con la implementación (proxy Netlify presente en
  `netlify/functions/sith-proxy.mts`, join boleta↔horario en `mapHorario`,
  formato `"hh:mm-hh:mm SALÓN"`).

## Acciones propuestas (orden sugerido)

1. **Código:** corregir `manifest.description` (H2).
2. **Decisión:** staleness indicator — implementar opción ligera o desmarcar ítem (H3).
3. **Roadmap:** marcar PWA×4 + TS estricto en §0 (H1); revisar §4 (H3).
4. **Docs:** actualizar AGENTS.md (regla Grades-Home H5, árbol/tabla H6/H7, refresh H10)
   y architecture.md (early setup H4, planned H8, src/types H7, startup flow H9,
   filas devtools/notifications H6/H12).
5. **Product:** añadir toasts in-app a §17 (H11); confirmar intención de banners
   globales (H13).
6. Retomar el commit 3 pendiente del feature de toasts (H14), que cierra la brecha
   de `applyDevOverrides` cuando el panel está cerrado.
