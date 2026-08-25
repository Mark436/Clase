# App Flow

Runtime walkthrough of every flow in the app: startup, authentication,
credentials lifecycle, data refresh, the schedule rendering pipeline,
notifications, dev mode, and logout. Behavior is described as implemented
today; roadmap aspirations are not included.

Related documents:

| Document                                        | Scope                                   |
| ----------------------------------------------- | --------------------------------------- |
| [`docs/product.md`](product.md)                 | Product behavior and UX requirements    |
| [`docs/architecture.md`](architecture.md)       | Code organization and dependency rules  |
| [`docs/api.md`](api.md)                         | Academic API and `sith-api-client`      |

---

## 0. Conventions

Two invariants shape every flow below.

**Credentials are volatile.** The password exists only inside
`credentialsRef` (a React ref in `AuthProvider`) for the lifetime of the
session. It is never written to `localStorage`, `sessionStorage`, or
IndexedDB. Anything durable is non-sensitive: cached academic data, the
remembered username, feature flags, and user preferences.

**Persistence lives in three IndexedDB stores** (`lib/storage/db.ts`,
database `pwa-academica`):

| Store             | Key                  | Content                                            |
| ----------------- | -------------------- | -------------------------------------------------- |
| `app-data`        | `"current"`          | `{ alumno, avisos, loadedAt }` snapshot            |
| `grade-tracking`  | one entry per matter | `TrackedGrade` baseline used for change detection  |
| `settings`        | string keys          | Non-sensitive settings (see below)                 |

Settings keys (`lib/storage/settingsStore.ts`):

```text
rememberedUsername        last successful login's user
gradesSeen                "true" | "false" — whether tracked grades were seen
adeudoAlertsOptIn         "true" | "false" — system notification opt-in
lastReAuthPromptDate      "YYYY-MM-DD" — last daily re-auth prompt
devConfig                 JSON — simulated clock, toggles, UX timings
devModeEnabled            "true" | "false" — panel visibility
devUnlocked               legacy unlock flag (migration only)
scheduleEdits             JSON — subject edits, manual subjects, swap prefs
```

---

## 1. Startup and restore

The app renders a spinner while restoring, then either hydrates from cache
or shows the login screen. No network request happens during startup
(automatic refresh at launch is a pending roadmap item).

```text
App mount
  |
  v
AuthProvider effect (once)
  |-- loadAppData()          -> cached { alumno, avisos } | null
  |-- getSetting(rememberedUsername)
  |-- getSetting(gradesSeen)
  |
  v
cached data?
  |-- yes -> set alumno + avisos, status = "authenticated"
  |          (UI shows last snapshot; loadedAt marks its age)
  |
  |-- no  -> status = "unauthenticated" -> LoginPage
```

Notes:

- A missing/corrupt `gradesSeen` counts as *seen*; only an explicit
  `"false"` re-arms the conditional home for the next launch.
- Storage failures during restore degrade to "no cache" instead of
  crashing.
- While restoring, `AppContent` blocks all other UI behind a spinner.

## 2. First login

Both `LoginPage` and `ReAuthSheet` render the same `CredentialsForm`;
only labels differ. Validation is client-side first (non-empty fields),
then delegated to `AuthProvider.login`.

```text
User submits usuario + contrasena
  |
  v
login(user, pass)                       [AuthProvider]
  |-- status = "authenticating"         (button shows spinner)
  |-- fetchAppData({ user, pass })      -> SithClient -> API
  |
  |-- failure -> errorKind mapped to a friendly Spanish message,
  |              status = "unauthenticated", form stays filled
  |
  |-- success
       |-- credentialsRef.current = { user, pass }   (memory only!)
       |-- previousAlumno = loadAppData()?.alumno    (baseline for alerts)
       |-- state = authenticated; UI switches to shell
       |-- fire-and-forget persistSession(...)       (see section 4)
```

`persistSession` never blocks navigation; it merges grade tracking,
saves the snapshot with a fresh `loadedAt`, remembers the username, then
evaluates notifications:

```text
persistSession(previousAlumno, alumno, avisos, user)
  |-- mergeGradeTracking(tracking, materias)
  |      hasChanges = new subject OR changed grade after baseline
  |-- saveGradeTracking(merged)
  |-- saveAppData({ alumno, avisos, loadedAt })
  |-- setSetting(rememberedUsername, user)
  |-- notifyNewAdeudos(previousAlumno, alumno)     (section 7)
  |-- return { hasChanges, newAdeudo }
        |
        v
handlePersistResult
  |-- hasChanges -> unseenGradeChanges = true
  |                 gradesSeen = "false"
  |                 gradeChangeCount += 1        (drives green toast)
  |-- newAdeudo  -> adeudoAlertCount += 1        (drives red toast)
```

The very first login sets the grade baseline: `mergeGradeTracking`
reports no changes when there was no previous tracking, so a fresh
install never toasts about "new" grades.

## 3. Credentials lifecycle and the daily re-auth reminder

Because the password dies with the page (refresh, close, OS reclaim), a
restored session has data but no way to refresh. The app surfaces this
honestly instead of failing silently on pull-to-refresh.

```text
Session restored from cache (hasCredentials = false)
  |
  v
AuthenticatedShell effect (runs whenever hasCredentials/alumno change)
  |
  |-- already has credentials? -> do nothing
  |
  |-- getSetting(lastReAuthPromptDate)
  |-- shouldPromptReAuth(lastPromptDate, today)?
  |      (compares local YYYY-MM-DD strings)
  |
  |-- no  -> done for today
  |
  |-- yes -> save today as lastReAuthPromptDate   (consumes the day
  |           even if the sheet is dismissed without logging in)
  |-- open ReAuthSheet + neutral toast:
       "Se recomienda volver a iniciar sesion para actualizar tus datos."
```

`ReAuthSheet` is a bottom sheet with the shared `CredentialsForm`
(`autoFocusPassword`, submit label "Actualizar datos"). A successful
submit runs the same `login()` path as section 2: credentials return to
memory, data refreshes, cache updates. Closing the backdrop just hides
the sheet until the next day.

The same sheet opens on demand when pull-to-refresh fires without
credentials (section 5).

## 4. Data refresh

Refresh is pull-to-refresh anywhere in the shell, plus a non-gesture
"Actualizar" action in the Student area. Both call the same handler.

```text
Pull-to-refresh (or Student "Actualizar")
  |
  v
hasCredentials?
  |-- no  -> open ReAuthSheet (accessible fallback; gesture is never
  |           the only path to fresh data)
  |
  |-- yes -> refresh()                     [AuthProvider]
              |-- guard: no concurrent refresh (refreshingRef)
              |-- refreshing = true         (spinner affordance)
              |-- fetchAppData(credentialsRef.current)
              |
              |-- failure -> return false; cached data untouched
              |              (a failed refresh NEVER deletes valid data)
              |
              |-- success -> replace alumno + avisos in state
                             persistSession(...).then(handlePersistResult)
```

Consequences of the shared pipeline: every screen updates together
(single source of truth), grade/debt toasts fire exactly once per real
change, and offline pulls leave the stale snapshot visible.

## 5. Schedule pipeline

The schedule screen derives everything from the authenticated `alumno`
prop through four pure stages. No stage performs I/O.

```text
alumno.horario                    [API DTO]
  |
  v  mapHorario(horario, boleta)          resolve subject names via boleta;
  |                                       emit ClassMeeting { clave, ... }
  v  applyScheduleEdits(meetings, edits)  [lib/storage/scheduleEditsStore]
  |      fieldEdits[clave]                rename / professor / classroom
  |      timeEdits["clave|weekday"]       move one occurrence
  |      customSubjects[]                 expand into meetings (USR-* claves)
  v  resolveConflicts(edited, prefs)      weekly: persisted swaps by groupKey
  |                                       daily : ephemeral same-day swaps
  v  getScheduleForDay(resolved, date)    filter + sort for the visible day
  |
  v  <ScheduleDayView>                    timeline cards + current-time line
```

### Conflict resolution (overlaps)

Meetings are clustered per weekday by interval overlap. Each cluster
collapses into **one card**: the highest-ranked member keeps its own full
time range; displaced classes become notices on that card.

```text
Ranking (deterministic):        Manual (USR-*) subjects first,
                                then earliest start, end, name.

Card for the winner:            [ Materia ganadora  10:00 - 11:00 ]
                                [ En curso ...      1/2 Matematicas ] <- notice
                                                     ^^^^^^^^^^^^^
                                  fraction of the loser's duration that
                                  was eaten; friendly fractions
                                  (1/4 1/3 1/2 2/3 3/4) within tolerance,
                                  else minutes ("20 min"); fully swallowed
                                  shows just the name.
```

Tapping the notice cycles the display order for that cluster:

```text
tap 1  -> swap for THIS weekday only      ephemeral Map keyed
                                          `${groupKey}#${weekday}`
tap 2  -> promote to EVERY occurrence     saved into edits.conflictOverrides
                                          (persists across restarts)
tap 3  -> back to default ranking         preference removed everywhere
```

Stale weekly preferences are pruned automatically: if an edit or a fresh
fetch removes the overlap, the stored override is deleted so the default
order always wins once the conflict no longer exists.

### Editing subjects

```text
Long-press card (>= configured ms)  OR  tap pencil icon
  |
  v
SubjectEditorSheet
  |-- edit mode: rename / professor / classroom (whole subject),
  |              time range for THIS occurrence only
  |-- create mode ("Agregar materia"): days checkboxes + time range;
  |              clave generated as `USR-<base36 timestamp>`
  |-- remove mode: only for manually added subjects
  |
  v
useScheduleEdits.commit     optimistic setState + fire-and-forget
                            saveScheduleEdits (IndexedDB)
```

Empty text fields mean "revert to fetched value"; clearing a time edit
deletes the override. Logout wipes everything (section 9), so edits are
per-installation, not portable.

### Minute-boundary timing

`useCurrentTime` (shared with the dev clock section) chains timeouts to
the exact next minute boundary, recalculates on foreground return and on
dev-clock changes, so class transitions, progress bars, countdowns, and
the current-time indicator move precisely when the displayed minute
changes — not on arbitrary polling intervals.

Countdown copy on the next class: `"1 hr y 30 min"` style (zero units
omitted, `" y "` between parts), `"Empieza pronto"` at the exact start
minute, and `"Empieza a las HH:MM"` once the start minute has passed.

## 6. Home tab decision

Computed once per session start in `App.tsx`; navigation merely consumes
it.

```text
unseen grade changes AND period average != 0?
  |-- yes -> Calificaciones opens as Home
  |-- no  -> Horario opens as Home (default)
```

`shouldOpenGradesFirst()` (`features/grades/utils.ts`) owns the rule;
nothing else duplicates it.

## 7. Notifications

Three channels, all local today; server push would slot in behind the
same seams later.

**Toasts (in-app).** One toast at a time, hosted in `AuthenticatedShell`.
Each notification gets an incrementing id used as the React key, so
back-to-back toasts remount cleanly instead of restarting timers mid-
flight. Timers are two-phase: hide at `durationMs`, unmount 200 ms later
(fade-out). Host re-renders cannot reset them (latest callback kept in a
ref).

```text
Trigger                              Variant   Message
-----------------------------------  --------  ------------------------------
fetch detects grade changes          success   calificaciones nuevas...
fetch detects clean->debt            error     adeudo nuevo pendiente
daily reminder fired                 neutral   se recomienda volver a...
dev panel test buttons               any       arbitrary message
```

**Debt system notification (opt-in).** `notifyNewAdeudos` fires only on
the clean→indebt transition, never while the debt persists. Requires the
stored opt-in **and** granted `Notification.permission`; dispatches via
the service worker registration with `tag: "adeudos"` so repeats
coalesce.

**Conditional home.** Not a notification per se, but the third way grade
changes surface (section 6).

## 8. Dev mode

Entry: 7 taps on the student name in the Student area (auto-open in dev
builds). State machine: hidden → unlocked → enabled → closed, persisted
in `devModeEnabled` / `devConfig`.

While the panel is **open and enabled**, `applyDevOverrides` wraps the
real `alumno` into a virtual one consumed by every screen (clock offset,
fake grades, debt toggles, added schedule items) and the UX timings take
their slider values (toast 1–10 s, long-press 200–1500 ms). Fetches and
persistence keep using real data — simulation is presentation-only.

Closing the panel pauses everything: overrides vanish, timings revert to
built-in defaults (`DEFAULT_TOAST_DURATION_MS` = 3500 ms,
`DEFAULT_LONG_PRESS_MS` = 500 ms). Configuration survives; "Restaurar
datos reales" clears it.

## 9. Logout and data lifecycle

```text
Logout (Student area)
  |-- credentialsRef.current = null      password gone immediately
  |-- state reset (alumno, avisos, errors, remembered username)
  |-- clearAllStores()                   wipes ALL THREE stores:
  |                                      cached data, grade tracking
  |                                      (baseline!), settings, and
  |                                      schedule edits
  v
status = "unauthenticated" -> LoginPage
```

Everything user-specific is per-installation and dies here: cached
academic data, the grade baseline (so a future login re-baselines
instead of toasting), the remembered username, notification opt-in, dev
configuration, and all schedule customizations.

Storage failures during logout are logged, never fatal — the session is
already gone from memory.
