# Architecture

## 1. Overview

The application uses a lightweight feature-based architecture built with:

- React
- TypeScript
- Vite
- `vite-plugin-pwa`
- `sith-api-client`

The architecture is intentionally simple.

It should make it easy to locate code by asking:

> "What part of the application does this belong to?"

rather than:

> "What kind of file is this?"

The architecture must not introduce layers, abstractions, or folders unless they provide a concrete benefit.

---

## 2. Project structure

The source tree is organized approximately as follows:

```text
src/
├── app/
│   ├── App.tsx
│   └── navigation.tsx
│
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   ├── auth/
│   ├── schedule/
│   ├── grades/
│   └── student/
│
├── lib/
│   ├── api/
│   ├── storage/
│   └── biometrics/
│
├── types/
│
├── styles/
│
└── main.tsx
```

This is the intended initial structure, not a requirement that every directory must exist immediately.

Directories and files should be created only when they are needed.

---

## 3. Application layers

The application can be understood as several levels:

```text
Pages
  ↓
Feature components
  ↓
Shared UI components
  ↓
React / browser APIs
```

Infrastructure used by features sits alongside this structure:

```text
Features
  ↓
lib/
  ├── api
  ├── storage
  └── biometrics
```

A simplified dependency direction is:

```text
┌─────────────────────────────┐
│            App              │
│       Pages / Routing       │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│          Features           │
│ auth / schedule / grades /  │
│ student                     │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       Shared UI / Lib       │
│ components / api / storage  │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│       Browser / API         │
└─────────────────────────────┘
```

This is a guideline rather than a strict framework.

---

## 4. `app/`

`src/app/` contains application-level composition.

It is responsible for assembling the application rather than implementing individual features.

Example:

```text
src/app/
├── App.tsx
└── navigation.tsx
```

### `App.tsx`

`App.tsx` is responsible for the high-level application structure.

It may coordinate:

- authentication state;
- routing;
- application shell;
- global providers;
- top-level loading/error states.

It should not contain the implementation of the schedule, grades, or student features.

For example, this is appropriate:

```tsx
<AppShell>
  <SchedulePage />
</AppShell>
```

while putting the schedule timeline logic directly into `App.tsx` is not.

### `navigation.tsx`

Navigation configuration belongs here.

It defines the relationship between application routes/screens and features.

The navigation layer may determine which feature is currently displayed.

Feature-specific UI should remain inside the corresponding feature.

---

## 5. `components/`

`src/components/` contains components that are shared across multiple features.

It has two conceptual groups:

```text
components/
├── ui/
└── layout/
```

---

## 6. `components/ui/`

`components/ui/` contains small, generic visual building blocks.

Examples:

```text
Button
IconButton
Card
Badge
ProgressBar
Spinner
Divider
Input
```

These components should not know about academic concepts.

For example:

```tsx
<Card>...</Card>
```

is appropriate.

A component such as:

```tsx
<StudentProgressCard />
```

does not belong here because it understands a specific domain concept.

### UI component rules

UI components should generally:

- be reusable;
- have small APIs;
- receive their data through props;
- avoid application-specific business logic;
- avoid direct API calls;
- avoid importing feature-specific modules.

For example:

```tsx
export interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  // presentation only
}
```

The `ProgressBar` should not know what the percentage represents.

---

## 7. `components/layout/`

`components/layout/` contains components responsible for the application's visual structure.

Examples:

```text
AppShell
Page
PageHeader
BottomNavigation
```

These components define how screens are arranged.

For example:

```tsx
<AppShell>
  <SchedulePage />
</AppShell>
```

`AppShell` may contain:

- the main content area;
- bottom navigation;
- safe-area handling;
- application-level layout;
- persistent navigation elements.

The layout should not contain feature-specific business logic.

---

## 8. `features/`

`src/features/` contains the application's main functionality.

Initial features:

```text
features/
├── auth/
├── schedule/
├── grades/
└── student/
```

A feature represents a meaningful area of the product.

Each feature owns the code that is specific to that functionality.

---

## 9. Feature structure

Features are intentionally flexible.

A feature may contain:

```text
feature/
├── components/
├── hooks/
├── types.ts
├── utils.ts
├── service.ts
└── FeaturePage.tsx
```

but it does not have to contain all of these.

For example, a small feature may simply be:

```text
grades/
└── GradesPage.tsx
```

A larger feature such as schedule may eventually become:

```text
schedule/
├── components/
│   ├── ScheduleTimeline.tsx
│   ├── ClassCard.tsx
│   └── CurrentTimeIndicator.tsx
├── hooks/
│   ├── useSchedule.ts
│   └── useCurrentTime.ts
├── types.ts
├── schedule.utils.ts
└── SchedulePage.tsx
```

Do not create empty directories merely to follow a template.

---

## 10. Feature components

Components that understand a specific application domain belong to their feature.

For example:

```text
features/schedule/components/ClassCard.tsx
```

is appropriate because `ClassCard` represents an academic class.

Similarly:

```text
features/grades/components/GradeList.tsx
features/student/components/CareerProgress.tsx
```

belong to their respective features.

These components may use shared UI components.

For example:

```text
ClassCard
├── Card
├── Badge
└── ProgressBar
```

This allows domain-specific components to be composed from generic UI primitives.

---

## 11. When to extract a shared component

A component should not be moved to `components/ui` merely because it might be reusable in the future.

Keep a component inside its feature when it is specific to that feature.

For example:

```text
features/schedule/components/ClassCard.tsx
```

should remain there even if it is a relatively large component.

A component should generally become shared when:

1. multiple unrelated features use it;
2. its behavior is genuinely generic;
3. extracting it makes the consuming features clearer.

For example:

```text
features/schedule/components/ProgressBar.tsx
```

could eventually become:

```text
components/ui/ProgressBar.tsx
```

if it is also used by the student progress feature.

Do not prematurely generalize components.

---

## 12. Hooks

Hooks should live close to the functionality they serve.

Feature-specific hooks belong inside the feature:

```text
features/schedule/hooks/useSchedule.ts
features/schedule/hooks/useCurrentTime.ts
features/auth/hooks/useAuth.ts
```

A hook should be placed outside a feature only when it is genuinely shared.

For example:

```text
src/hooks/
```

may be introduced later for hooks used by multiple unrelated features.

Do not create a global `hooks/` directory preemptively.

---

## 13. Types

Types should live as close as possible to the code that owns them.

Feature-specific types belong inside the feature:

```text
features/schedule/types.ts
features/auth/types.ts
```

Shared application-level types may live in:

```text
src/types/
```

For example:

```text
src/types/app.ts
```

may contain types shared by multiple features.

Avoid creating a single giant global types file.

---

## 14. API types

The application consumes the types exposed by `sith-api-client` whenever appropriate.

Do not duplicate API types unnecessarily.

If the API package already exposes types such as:

```text
Student
Notice
Grade
Debt
```

the application should use those types directly when they represent the same concepts.

An application-specific type should only be introduced when there is a meaningful difference between:

- the API representation;
- the application's domain model;
- the application's UI state.

---

## 15. `lib/api/`

`src/lib/api/` contains the integration between the application and `sith-api-client`.

For example:

```text
lib/
└── api/
    └── client.ts
```

The application should centralize creation/configuration of the API client.

React components should not instantiate `SithClient` directly.

Avoid code such as:

```tsx
function SchedulePage() {
  const client = new SithClient(...);

  // ...
}
```

Instead, API configuration should be handled by the API layer.

Conceptually:

```text
SchedulePage
    ↓
useSchedule
    ↓
application API layer
    ↓
SithClient
    ↓
API
```

The exact implementation can evolve as the application grows.

---

## 16. `sith-api-client`

`sith-api-client` is a runtime dependency of the application.

It is not a development-only dependency because the application uses it while running.

The package is responsible for communicating with the academic API.

The application should not reimplement functionality already provided by the package.

The application is responsible for:

- deciding when data should be requested;
- managing application state;
- managing loading/error states;
- caching/persisting data;
- presenting the data to the user.

The package is responsible for communicating with the API.

---

## 17. API data flow

The general data flow is:

```text
User action
    ↓
Feature hook / service
    ↓
API layer
    ↓
SithClient
    ↓
Academic API
    ↓
SithClient response
    ↓
Application state
    ↓
Feature components
    ↓
UI
```

For example:

```text
Pull to refresh
      ↓
useAppData()
      ↓
apiClient
      ↓
SithClient.fetchDatos(...)
      ↓
AppData
      ↓
Schedule / Grades / Student
```

The goal is to perform a coherent data load rather than having each screen independently request the same information.

---

## 18. Application data

The application should treat the student's academic information as a coherent data set.

Conceptually:

```ts
interface AppData {
  alumno: Student;
  horario: Schedule;
  calificaciones: Grades;
  avisos: Notice[];
  adeudos: Debt[];
  progreso: Progress;
  loadedAt: string;
}
```

The exact shape should follow the actual types exposed by `sith-api-client`.

This example represents the architectural concept and does not require duplicating API types.

---

## 19. Data ownership

The application should have a single source of truth for the currently loaded academic data.

Features should consume that state rather than independently fetching the same information.

For example:

```text
                 AppData
              /     |      \
             /      |       \
        Schedule  Grades   Student
```

This prevents:

- duplicated requests;
- inconsistent data between screens;
- unnecessary API calls;
- different loading states for the same data.

---

## 20. Authentication architecture

Authentication is treated separately from academic data.

Conceptually:

```text
Authentication
      ↓
Valid session / credentials
      ↓
Academic data
```

The application must never persist the user's password.

Passwords must not be stored in:

- `localStorage`;
- `sessionStorage`;
- IndexedDB;
- persistent cookies;
- custom browser storage.

The exact session mechanism depends on the authentication capabilities of the API/backend.

---

## 21. Biometric authentication

Biometric authentication should not be implemented by storing the user's password in the browser.

If biometric login is implemented, the preferred architecture is based on WebAuthn/passkeys or another appropriate authentication mechanism supported by the backend.

The frontend should store/use a credential designed for this purpose rather than attempting to turn the user's password into a persistent browser secret.

The implementation belongs in:

```text
lib/biometrics/
```

if a separate integration layer is needed.

Authentication-specific UI remains inside:

```text
features/auth/
```

---

## 22. Storage

`src/lib/storage/` contains persistence mechanisms such as IndexedDB.

Storage is infrastructure and should not be directly accessed by every component.

Prefer:

```text
Feature / application state
        ↓
Storage service
        ↓
IndexedDB
```

rather than:

```text
Component
    ↓
IndexedDB
```

The storage layer may be responsible for:

- saving academic data;
- loading cached data;
- saving metadata such as `loadedAt`;
- clearing application data;
- versioning stored data.

Passwords must never be stored by this layer.

---

## 23. Cached data

Cached academic data should allow the application to render quickly.

The intended startup flow is:

```text
Application starts
       ↓
Load cached AppData
       ↓
Render cached data immediately
       ↓
Check whether an update is appropriate
       ↓
Fetch fresh data
       ↓
Replace cached data
```

If the network request fails:

```text
Cached data
     ↓
Remain visible
     ↓
Show appropriate stale/offline state
```

A failed refresh must not delete valid previous data.

---

## 24. Refresh architecture

The application should have one coherent refresh operation.

The user triggers refresh through pull-to-refresh.

Conceptually:

```text
Pull to refresh
      ↓
Refresh AppData
      ↓
SithClient
      ↓
Update application state
      ↓
Persist new AppData
      ↓
All features re-render
```

Individual pages should not each implement their own refresh request.

Concurrent refresh operations should be prevented.

---

## 25. Schedule architecture

The schedule feature contains most of the application's domain-specific UI logic.

It should separate:

- raw schedule data;
- schedule calculations;
- current time;
- visual representation.

For example:

```text
Schedule data
     ↓
schedule.utils.ts
     ↓
Current class / next class / visible classes
     ↓
Schedule components
```

Functions such as these should remain pure where possible:

```text
getCurrentClass()
getNextClass()
getVisibleClasses()
getClassProgress()
getScheduleForDay()
```

The UI should not contain complicated date/time calculations.

---

## 26. Current time

Current time is dynamic UI state.

A hook such as:

```text
features/schedule/hooks/useCurrentTime.ts
```

may provide the current time to the schedule feature.

Time-dependent calculations should remain separate from rendering.

When the application returns from background, the current time should be recalculated.

---

## 27. Swipe navigation

Swipe interaction belongs to the schedule feature because changing days is schedule-specific behavior.

The gesture implementation should not be embedded inside individual class components.

Conceptually:

```text
SchedulePage
    ↓
day navigation state
    ↓
ScheduleTimeline
```

The swipe gesture changes the selected day.

The timeline remains responsible for rendering that day.

The same functionality should have an accessible non-gesture alternative.

---

## 28. Home selection

The choice between Schedule and Grades as the home screen is application-level behavior.

The rule is:

```text
Has grades?
   ├── yes → Grades is Home
   └── no  → Schedule is Home
```

The logic should be implemented once and consumed by navigation.

It should not be duplicated across individual pages.

---

## 29. Navigation dependencies

Navigation may depend on application state.

For example:

```text
AppData
   ↓
hasGrades()
   ↓
navigation configuration
   ↓
Home = Grades or Schedule
```

The navigation layer should not fetch data directly.

It should consume application state.

---

## 30. Styling

The application uses a mobile-first responsive approach.

Shared design decisions should be implemented through reusable styling primitives/tokens where useful.

Avoid creating feature-specific global CSS when a component-local or shared style is sufficient.

Global styles should remain limited to things such as:

- CSS reset;
- typography;
- colors/design tokens;
- global layout behavior;
- accessibility defaults;
- application-level variables.

---

## 31. Responsive behavior

The application should be designed for small screens first.

Components should adapt to larger screens without requiring separate desktop implementations unless the UX genuinely differs.

The layout layer is responsible for global responsive behavior.

Feature components are responsible for feature-specific responsive behavior.

---

## 32. PWA architecture

PWA configuration belongs to the Vite/build layer rather than to individual features.

`vite-plugin-pwa` is responsible for:

- manifest generation;
- service worker integration;
- asset caching configuration;
- installability.

Application features should not need to know whether the application was launched from:

- a browser tab;
- an installed PWA;
- another supported browser context.

---

## 33. Environment variables

Public frontend environment variables use Vite's `VITE_` prefix.

Example:

```text
VITE_API_URL=
```

Environment variables exposed to the frontend must be considered public.

They must never contain:

- passwords;
- API secrets;
- private keys;
- server-side credentials.

Environment variables are appropriate for configuration such as:

- API base URL;
- public feature flags;
- public application configuration.

They are not a security mechanism.

---

## 34. Imports

Use the `@` alias for internal source imports when configured.

Prefer:

```ts
import { Card } from "@/components/ui/Card";
import { SchedulePage } from "@/features/schedule/SchedulePage";
```

instead of:

```ts
import { Card } from "../../../components/ui/Card";
```

External packages should use normal package imports:

```ts
import { SithClient } from "sith-api-client";
```

The existing `.js` extensions used by the `sith-api-client` package must remain compatible with its ES module configuration.

Do not modify package imports solely to make them look like local TypeScript imports.

---

## 35. Exports

Use named exports throughout the application.

Prefer:

```ts
export function SchedulePage() {
  // ...
}
```

and:

```ts
export const apiClient = ...;
```

Avoid default exports unless a specific framework/tool integration requires one.

---

## 36. TypeScript

TypeScript should run in strict mode.

Avoid `any`.

Prefer explicit domain types and inferred types where appropriate.

Do not weaken TypeScript configuration merely to work around a type error.

When a type is difficult to model, fix the type rather than bypassing the compiler.

---

## 37. Components

Components should remain small and focused.

A component should ideally have one clear responsibility.

Avoid components that simultaneously:

- fetch API data;
- perform authentication;
- manage persistent storage;
- calculate complex schedule logic;
- render the entire screen.

Instead, separate responsibilities:

```text
Page
 ↓
Hook / application state
 ↓
Domain logic
 ↓
Components
 ↓
UI primitives
```

This does not mean every responsibility requires its own file.

Only introduce a new abstraction when it improves clarity.

---

## 38. Business logic

Business/domain logic should not be hidden inside JSX when it can be expressed independently.

For example, schedule calculations should preferably be implemented as pure functions.

Instead of:

```tsx
if (
  new Date() >= class.start &&
  new Date() <= class.end
) {
  ...
}
```

being repeated throughout the UI, prefer a reusable function:

```ts
const currentClass = getCurrentClass(classes, currentTime);
```

This makes the logic easier to test and prevents inconsistencies.

---

## 39. Error handling

Errors should be handled at the appropriate layer.

API errors should not cause low-level implementation details to leak directly into the UI.

The application should translate failures into states such as:

```text
loading
success
error
offline
stale
empty
```

Features should determine how those states are presented.

---

## 40. Loading and empty states

Every major feature should consider:

- loading;
- loaded;
- empty;
- error;
- stale/offline where relevant.

For example, Grades may have:

```text
Loading
    ↓
No grades yet
    ↓
Grades available
    ↓
Error
```

The UI should not assume that data is always available.

---

## 41. Feature boundaries

Features should own their domain-specific behavior.

For example:

```text
schedule/
```

may know about:

- classes;
- days;
- current time;
- next class;
- schedule navigation.

But it should not know how the authentication screen works.

Similarly:

```text
grades/
```

should not directly manipulate schedule state.

Cross-feature state should be coordinated at the application level when necessary.

---

## 42. Avoid circular dependencies

Avoid dependencies such as:

```text
schedule → grades → schedule
```

Features should preferably depend on:

- shared UI;
- shared infrastructure;
- application-level state;
- their own internal modules.

If two features require the same domain concept, consider whether it belongs in a shared application type/model rather than importing one feature into another.

---

## 43. No premature abstraction

Do not create abstractions merely because they are theoretically reusable.

Avoid:

- generic service layers with no real need;
- universal data-fetching abstractions;
- excessive repository patterns;
- unnecessary dependency injection;
- large global stores before application state requires them;
- empty architectural folders.

Prefer the simplest implementation that keeps responsibilities clear.

---

## 44. Growth of a feature

Features are allowed to grow organically.

A feature may begin as:

```text
schedule/
└── SchedulePage.tsx
```

and later become:

```text
schedule/
├── components/
├── hooks/
├── types.ts
├── schedule.utils.ts
└── SchedulePage.tsx
```

This is expected.

Do not create the final structure before the code requires it.

---

## 45. Testing boundaries

Pure business logic should be easy to test without rendering React.

Examples:

```text
getCurrentClass()
getNextClass()
getClassProgress()
getVisibleClasses()
hasGrades()
```

UI behavior should be tested separately.

API integration should be tested separately from pure schedule calculations where practical.

The goal is to avoid requiring the entire application to run just to test a small piece of business logic.

---

## 46. Decision rule for new files

When creating a new file, use the following questions.

### Is it specific to one feature?

Put it inside that feature.

```text
features/schedule/...
```

### Is it a generic visual component used by multiple features?

Put it in:

```text
components/ui/
```

### Is it application layout?

Put it in:

```text
components/layout/
```

### Is it shared infrastructure?

Put it in:

```text
lib/
```

### Is it a shared application type?

Put it in:

```text
types/
```

### Is it only used by one feature?

Keep it inside that feature.

---

## 47. Example dependency tree

A typical schedule screen may look like:

```text
SchedulePage
│
├── useSchedule
│   └── application data
│
├── useCurrentTime
│
└── ScheduleTimeline
    │
    ├── CurrentTimeIndicator
    │
    └── ClassCard
        ├── Card
        ├── Badge
        └── ProgressBar
```

The data path is approximately:

```text
SithClient
    ↓
API layer
    ↓
Application data
    ↓
useSchedule
    ↓
SchedulePage
    ↓
ScheduleTimeline
    ↓
ClassCard
    ↓
UI primitives
```

---

## 48. Summary

The architecture follows a few simple rules:

1. Organize application code by feature.
2. Keep feature-specific components inside their feature.
3. Keep generic visual primitives in `components/ui`.
4. Keep application structure in `components/layout`.
5. Keep infrastructure in `lib`.
6. Keep shared types in `types`.
7. Keep logic close to the feature that owns it.
8. Do not create folders until they are needed.
9. Do not prematurely generalize components.
10. Do not duplicate API types unnecessarily.
11. Keep API access outside React presentation components.
12. Keep schedule calculations separate from schedule rendering.
13. Keep passwords out of persistent browser storage.
14. Use named exports.
15. Use `@` for internal imports.
16. Keep TypeScript strict.
17. Prefer simple solutions over unnecessary architectural abstractions.

The architecture should evolve with the application rather than forcing the application into a rigid structure.
