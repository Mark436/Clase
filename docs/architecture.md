# Architecture

Clase is a mobile-first academic PWA for students. It lets a logged-in student
see their schedule, grades, profile, notices, and debt alerts without navigating an
institutional portal. Data comes from the academic API through `sith-api-client`; the
frontend owns presentation, caching, and refresh orchestration.

The repository is in early setup: the Vite + React scaffold under `src/` is in place,
but feature directories, PWA configuration, the `@` import alias, and most product
functionality are not implemented yet. The structure below is the intended architecture.

## Bird's Eye View

The student opens the app. If a valid session exists, cached academic data loads from
local storage and renders immediately. A background fetch refreshes that data through
a single `AppData` load. If there is no session, the auth feature collects credentials
and triggers the first load.

```txt
Login → SithClient.fetchDatos → AppData → persist → Schedule / Grades / Student UI
                ↑
         pull-to-refresh (one operation for all screens)
```

All academic screens consume the same in-memory `AppData` snapshot. Schedule, Grades,
and Student do not each call the API independently. Notices and debts are part of
`AppData` and surface as alerts or inline content, not as separate top-level navigation
tabs.

Navigation picks the home screen once from loaded data: if grades exist, Grades is
Home; otherwise Schedule is Home.

## Code Map

This section describes the high-level structure of the codebase. Pay attention to
**Boundary** and **Invariant** callouts.

### `src/main.tsx`

Application entry point. Mounts React in strict mode and renders the root `App`
component.

**Invariant:** Contains no feature logic, routing rules, or API calls.

### `src/app/`

Application composition: routing, navigation config, global providers, and the
decision of which feature is Home. Key modules: `App.tsx`, `navigation.tsx`.

**Boundary:** Features are mounted here; `app/` coordinates them but does not
implement schedule calculations, grade formatting, or login form details.

**Invariant:** Home selection (`hasGrades()` → Grades or Schedule) is implemented
once here (or in a single shared helper consumed here), not duplicated in feature pages.

### `src/components/ui/`

Generic visual primitives with no academic domain knowledge. Examples: `Button`,
`Card`, `Badge`, `ProgressBar`, `Input`, `Spinner`.

**Boundary:** UI components speak in props (`value`, `label`, `onClick`), not in
`Alumno`, `Boleta`, or schedule concepts.

**Invariant:** No API calls, no IndexedDB access, no imports from `features/`.

### `src/components/layout/`

Application shell and page structure. Examples: `AppShell`, `Page`, `PageHeader`,
`BottomNavigation`.

Handles safe areas and mobile layout. Wires navigation slots; does not fetch data or
decide which class is current.

**Invariant:** Layout components never contain feature-specific business rules
(for example, hiding finished classes or computing grade averages).

### `src/features/auth/`

Login, logout, and session UX. Key concepts: authenticated vs unauthenticated state,
loading and error presentation for credential submission.

**Boundary:** Auth UI lives here; session infrastructure (how credentials reach
`SithClient`) lives in `lib/`.

**Invariant:** The user's password is never persisted in `localStorage`, `sessionStorage`,
IndexedDB, or cookies. Biometric shortcuts must not store the password, even encrypted.

### `src/features/schedule/`

Today's schedule as a vertical timeline: current class, next class, later classes.
Key pure helpers (planned): `getCurrentClass`, `getNextClass`, `getVisibleClasses`,
`getClassProgress`, `getScheduleForDay`. Key UI (planned): `SchedulePage`,
`ScheduleTimeline`, `ClassCard`, `CurrentTimeIndicator`.

**Invariant:** Date/time and "which class is active" logic lives in pure functions or
hooks, not scattered through JSX.

**Invariant:** Swipe between days is schedule-specific and must have a non-gesture
alternative (date picker or buttons).

**Invariant:** Completely finished classes do not appear in the contextual view of
the current day; the in-progress class stays visible with progress.

### `src/features/grades/`

Grade summary and per-subject listing. Key concepts: empty state when no grades exist,
loading/error/offline states. Helper (planned): `hasGrades`.

When grades exist, this feature becomes the default Home screen.

**Invariant:** Grades reads from shared `AppData`; it does not call `SithClient`
directly.

### `src/features/student/`

Student profile and academic progress: name, career, semester, credit progress.
Shows only fields with product value, not every API field.

**Invariant:** Reuses types from `sith-api-client` (`Alumno`, `Creditos`, etc.)
rather than duplicating DTO shapes.

### `src/lib/api/`

Central place to configure and expose the academic API client. Key concept: a shared
`SithClient` instance (or thin wrapper) used by application-level data loading.

**Boundary:** This is the only layer that instantiates `SithClient`. React components
and feature pages call hooks or services above this layer.

**Invariant:** Feature components never construct `SithClient` inline.

### `src/lib/storage/`

IndexedDB persistence for the app cache and small settings. Three stores:

- `app-data` — last valid academic snapshot (`CachedAppData`: `alumno`, `avisos`, `loadedAt`);
- `grade-tracking` — per-subject `TrackedGrade` (`current` vs `previous`) so the grades feature can mark new or changed grades;
- `settings` — non-sensitive preferences: remembered username and adeudo-alerts opt-in.

The restore flow lives in `features/auth/AuthProvider.tsx`: cached data hydrates
the session before any network activity, and a successful login overwrites the
snapshot atomically.

**Boundary:** Components and features go through a storage service, not raw
IndexedDB APIs.

**Invariant:** A failed network refresh does not delete previously valid cached data.

**Invariant:** Passwords and long-lived credential secrets are never written here;
only the username is remembered.

### `src/lib/notifications/`

Local notification infrastructure. Owns permission management and exposes a single
entry point, `notifyNewAdeudos(previousAlumno, nextAlumno)`, which fires an adeudo
alert only on a clean→indebt transition and only when the stored opt-in allows it.
Future server-push support implements the same seam without touching features.

**Invariant:** Features never touch the Notification or ServiceWorker APIs directly.

### `src/lib/biometrics/`

Future WebAuthn/passkey integration for returning users. Separate from auth UI in
`features/auth/`.

**Invariant:** Does not implement "remember password" or encrypted password storage.

### `src/types/`

Shared application types that cross feature boundaries. Key concept: `AppData` — a
single coherent snapshot of loaded academic information:

```ts
interface AppData {
  alumno: Alumno;
  horario: Schedule;
  calificaciones: Grades;
  avisos: Aviso[];
  adeudos: Debt[];
  progreso: Progress;
  loadedAt: string;
}
```

Exact field types should follow `sith-api-client` exports (`Alumno`, `Aviso`, etc.).
As of `sith-api-client` 2.3.0, `progreso` is a plain `number` and `horario` carries
raw per-day time strings that the schedule feature parses — see [`api.md`](api.md).

**Invariant:** Prefer API package types over local duplicates unless the UI model
genuinely differs.

### `sith-api-client` (external)

Runtime dependency that talks to the academic API. Key type: `SithClient`. Primary
method: `fetchDatos(credenciales)` returning `DatosAlumno` (`alumno` + `avisos`);
grades, debts, progress, and the weekly schedule (`horario`) are mapped into the
alumno graph — see [`api.md`](api.md).

**Boundary:** The package owns HTTP, parsing, and DTO mapping. The PWA owns when to
fetch, how to cache, and how to present data.

**Invariant:** Do not reimplement API communication that the package already provides.
Keep `.js` extensions in package import paths as required by its ESM build.

See [`api.md`](api.md) for the request lifecycle, error `cause` shapes, and known gaps.

## Cross-Cutting Concerns

### Error Handling

API and storage failures are translated into UI states: `loading`, `success`, `empty`,
`error`, `offline`, `stale`. Raw API errors are not shown to users. When refresh fails
but cache exists, cached data stays visible with a stale/offline indicator.

### Testing

No test runner is configured yet. When added, pure domain logic should be testable
without React:

- `getCurrentClass`, `getNextClass`, `getVisibleClasses`, `getClassProgress`
- `hasGrades`, home-selection logic

API integration and UI behavior should be tested separately from schedule math.

### Configuration

Public frontend config uses Vite `VITE_` variables (for example, `VITE_API_URL`).
These values are visible in the bundle and must not hold secrets.

Build tooling: Vite, TypeScript (strict), Oxlint. PWA manifest and service worker will
live at the Vite/build layer via `vite-plugin-pwa` (planned), not inside features.

### Refresh and Concurrency

One application-level refresh updates all of `AppData`, persists the result, and
lets every screen re-render. Pull-to-refresh is the primary manual refresh mechanism.
Concurrent refresh operations are prevented.

Startup flow: load cache → render → fetch fresh data → replace cache on success.

### Styling and Responsiveness

Mobile-first. Global tokens, reset, and typography in shared styles; feature components
handle feature-specific layout. The layout layer owns shell-level responsive behavior.
