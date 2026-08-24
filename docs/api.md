# Sith API Client — Notes and Gaps

Reference notes for [`sith-api-client`](https://github.com/Mark436/sith-api-client)
(v2.2.0), the runtime dependency that talks to the academic API (SITH,
Instituto Tecnológico de Hermosillo). The client owns HTTP, parsing, and DTO
mapping; this PWA owns when to fetch, how to cache, and how to present data.

> ⚠️ Unofficial API. Usage restrictions, blocks, or changes are possible; see
> the package README for the full disclaimer.

## Public surface

```ts
import { SithClient } from "sith-api-client";

const client = new SithClient(); // takes no arguments

const datos = await client.fetchDatos({
  user: "usuario",
  pass: "contraseña",
});
// datos: { alumno: Alumno, avisos: Aviso[] }

// Static mapper for raw API payloads:
await SithClient.mapDatos(rawApiTodo); // Promise<{ alumno, avisos }>
```

- Keep `.js` extensions on package import paths; it ships as ES modules.
- The package `exports` map only exposes the root entry. Deep imports such as
  `sith-api-client/dist/dto/Alumno.js` are blocked — derive shared types from
  the public call signature instead (done in `src/lib/api/client.ts`).
- `VITE_API_URL` is currently unusable: endpoints are hardcoded inside the
  client (see Known gaps).

## Request lifecycle (stateless)

Every `fetchDatos()` call performs a complete one-shot cycle:

1. Validate `{ user, pass }` locally (throws `"Credenciales inválidas"`).
2. `POST http://sith.ith.mx/XTodo/wr/login` with JSON `{ user, pass }`.
3. Parse the response and require `al` (alumno payload) plus `tkn` (session
   token); otherwise throw, attaching the API's error avisos as `cause`.
4. Immediately `POST http://sith.ith.mx/XTodo/wr/logout` with `{ tkn }`.
5. Map the payload to DTOs and return `{ alumno, avisos }`.

Consequences:

- **There is no session.** The token is consumed internally and never exposed;
  every data refresh needs the credentials again.
- Endpoints are **plain HTTP and hardcoded**, which implies mixed-content risk
  when the PWA is served over HTTPS and unknown CORS behavior in browsers.

## Errors

All failures are generic `Error` throws; distinguish them through `cause`:

| `cause` shape                              | Meaning                                                        | App mapping        |
| ------------------------------------------ | -------------------------------------------------------------- | ------------------ |
| native `Error` (fetch rejection)           | network/DNS failure                                             | `connection`       |
| `{ status, statusText, url }`              | HTTP !ok — 401/403 means bad credentials, others service issues | `invalid-credentials` / `connection` |
| `string[]` of `"summary: detail"`          | login rejected by the API (wrong credentials)                   | `invalid-credentials` |

Known quirks:

- If login succeeds but the immediate logout fails (network blip),
  `fetchDatos` throws even though valid data was already downloaded — that
  data is lost.
- Error messages are Spanish, generic, and untyped. Never surface them raw;
  translate via `cause` inspection (centralized in `src/lib/api/client.ts`).

## Data model (as returned)

Reuse the package's types instead of duplicating them. Summary of the mapped
graph returned by `fetchDatos()`:

**`Alumno`**

- Identity: `numeroControl`, `nombre`, `carrera`, `correo`, `telefono`,
  `semestre`, `fechaReinscripcion`
- Academics: `promedioGeneral` (`number`), `promedioSemestral` (`number`),
  `boleta { periodo, promedio, materias: CalificacionMateria[] }`
- `CalificacionMateria`: `clave`, `nombre`, `calificacion` (**string**, may be
  empty or non-numeric), `claveOportunidad`, `oportunidad`, `creditos`
  (`number`)
- Progress: `progreso` (**plain number**) and `creditos { totales, faltantes }`
  — approved credits derive as `totales − faltantes`; there is no separate
  "in progress" count.
- Debts: `adeudos { tieneAdeudos, biblioteca, academico, escolar, financiero,
  administrativo }` where each area string describes the debt when one exists.
- Notices: `avisos: Aviso[] { titulo, mensaje, tipo }` with
  `tipo ∈ { "error", "warn", "info" }` (the `TIPO_AVISO` enum).

## Session decision (this app)

Because every call needs credentials, the app keeps them **in React memory
only** for the lifetime of a session (`features/auth/AuthContext.tsx`). They
are never written to `localStorage`, `sessionStorage`, IndexedDB, cookies, or
any other storage, and they are cleared on logout.

Consequence: refreshing data works while the app stays open; after a full
restart the student logs in again. Revisit this decision when the backend
offers a real session/token mechanism.

## Known gaps and future upgrades

1. **Missing schedule (`horario`).** The raw response contains enrolled-class
   entries (`gins[]`) with per-weekday schedule strings (`lu`, `ma`, `mi`,
   `ju`, `vi`, `sa`) plus grupo/materia fields, but the mapper drops them. The
   mapped `Alumno` has **no schedule field**, which blocks the Schedule
   feature until the client exposes it (preferred) or we gain access to the
   raw payload and map it locally (currently impossible through
   `fetchDatos`).
2. **No session/token mechanism.** Backend improvement candidate (TODO §3).
3. **Failed logout discards valid data** (see Errors).
4. **Hardcoded plain-HTTP endpoints** with no configurable base URL.
5. **Weakly typed errors** — untyped `cause`; classification lives in our
   `lib/api` layer.
6. **Type gotchas** — `calificacion` is a string; `progreso` is a bare number,
   not an object.
