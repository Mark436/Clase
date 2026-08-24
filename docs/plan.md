# Plan de trabajo — fases próximas

Especificación acordada de las fases pendientes. El checklist global vive en
[`ROADMAP.md`](../ROADMAP.MD); este documento registra las decisiones de diseño
para implementarlas. Cada fase se verifica con `pnpm lint` + `pnpm exec tsc -b`
y se integra en su propio commit.

## Estado

Las fases A–D están implementadas e integradas. Nota posterior: la barra
"Datos guardados · toca para actualizar" se retiró por decisión del dueño;
el refresh manual es pull-to-refresh y la alternativa accesible vive como
acción "Actualizar" en la sección Alumno (ver ROADMAP §11).

## Fase A — Salón en las tarjetas de clase

El tercer token del string diario del horario es el **código de salón**, no el
grupo. Formato observado: `"hh:mm-hh:mm SALÓN"`.

- `mapHorario.ts`
  - Regex: `/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(?:\s+([^\s,;]+))?/g`
  - `DaySlot` ya incluye `classroom`; capturarlo del grupo 5 (trim, opcional)
  - Construcción del meeting: `classroom: slot.classroom` (eliminar `subject.grupo`)
- `ClassCard.tsx`: mostrar `{meeting.classroom}` en lugar de la línea "Grupo …"
- `docs/api.md`: actualizar la descripción del formato de `dias`

Commit: `feat(schedule): show classroom code on class cards instead of group`

## Fase B — Pull-to-refresh

Gesto vertical para refrescar; cuando no hay credenciales en memoria abre el
formulario de reingreso (los datos frescos llegan con ese login).

Mecánica del gesto:

```text
touchstart (window.scrollY ≤ 0) → touchmove arrastra indicador
offset = deltaY × 0.5 (resistencia), tope 80px · umbral de disparo 64px
release ≥ umbral → onRefresh() ; si no, anima de vuelta
```

- Nuevo `src/components/layout/usePullToRefresh.ts`: hook genérico sin conceptos
  académicos; handlers táctiles, estado `offset/refreshing`, no-op sin touch
- `index.css`: `html { overscroll-behavior-y: contain }` para desactivar el
  pull-to-refresh nativo del navegador (que recargaría la página)
- `AppShell`/shell autenticado: contenido envuelto en div con
  `translateY(offset)` + indicador circular (Spinner) sobre el header
- `AuthProvider`:
  - nueva `refresh()` que reutiliza exactamente el camino de login
    (`fetchAppData` → persistir snapshot + merge calificaciones + alerta de
    adeudos), sin pasar por estado "authenticating"
  - guard contra refrescos concurrentes (`refreshing` expuesto en contexto)
  - `login()` pasa a devolver `Promise<boolean>`
- Reingreso:
  ```ts
  onRefresh = hasCredentials ? refresh() : setReAuthOpen(true)
  ```
  Tras login exitoso el sheet se auto-cierra (`CredentialsForm` gana callback
  `onSuccess`)
- La barra "Datos guardados · toca para actualizar" permanece como alternativa
  accesible (el gesto nunca es el único camino)
- Refresco fallido con credenciales válidas: caché intacta (invariante),
  indicador desaparece; sin toast por ahora

Commit: `feat(app): pull-to-refresh with credential-aware re-auth`

## Fase C — Home condicional

Calificaciones es Home **solo si** hay cambios nuevos por ver Y el promedio del
periodo no es 0. En cualquier otro caso, Horario.

Decisiones acordadas:

1. "Notificación" = materia nueva **o** calificación cambiada según el
   seguimiento local (`TrackedGrade`).
2. Se consumen **al abrir** Calificaciones: `GradesPage` marca visto al montar;
   siguientes aperturas vuelven a Horario hasta el próximo cambio.
3. Primer login = baseline (todo sería "nuevo"): **no dispara**.

Implementación:

- `lib/storage/gradeTracking.ts`: `mergeGradeTracking` devuelve
  `{ tracking, isBaseline, hasChanges }`; `isBaseline` = no había registros
  previos; `hasChanges` solo cuenta fuera del baseline
- `lib/storage/settingsStore.ts`: nueva setting `gradesSeen`
- `AuthProvider`: cuando un fetch produce cambios → `gradesSeen = "false"`;
  contexto expone `unseenGradeChanges: boolean` (restaurado al arrancar) y
  `markGradesSeen()` (escribe `"true"`)
- `features/grades/utils.ts`:
  ```ts
  shouldOpenGradesFirst(alumno, unseenChanges):
    unseenChanges && parseFloat(boleta.promedio) !== 0
  // promedio vacío o no numérico también ⇒ Horario
  ```
- `App.tsx`: `getHomeTab(shouldOpenGradesFirst(alumno, unseen))`;
  `hasGrades()` queda sin uso y se elimina
- Límite v1 aceptado: tras un re-login a mitad de sesión el tab no salta
  (el inicializador ya corrió); la regla aplica al abrir la app
- Docs: `product.md` §6 reescrito con la nueva regla; ROADMAP §5 ajustado

Commit: `feat(grades): conditional home based on unseen grade changes`

## Fase D — Recordatorio diario de reingreso

Una vez por día, al abrir la app con sesión restaurada desde caché **sin**
credenciales, abrir el formulario de reingreso con un toast recomendándolo.

```text
Abrir app → caché restaurada sin credenciales
  └─ ¿último recordatorio fue en un día anterior?
       ├─ sí → abre ReAuthSheet + toast
       │        "Se recomienda volver a iniciar sesión para actualizar tus datos."
       │        y guarda hoy como último recordatorio
       └─ no → nada
```

- Setting `lastReAuthPromptDate` (fecha local `YYYY-MM-DD`); se guarda **al
  disparar**, no al completar el login → cerrar el sheet sin hacer nada también
  consume el turno del día
- Solo aplica con caché restaurada sin credenciales; con credenciales en
  memoria el refresco es silencioso y el aviso sería ruido
- Comparación de día como función pura testeable en `features/auth/`
- Nuevo primitivo `src/components/ui/Toast.tsx`: snackbar mínimo,
  `role="status"`, auto-dismiss (~5 s), posicionado encima de la navegación

Commit: `feat(auth): daily re-auth reminder with toast`

## Verificación por fase

```bash
pnpm lint
pnpm exec tsc -b
```

La build de producción (`pnpm build`) la ejecuta el usuario.
