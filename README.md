# Clase

Clase es una PWA móvil para que estudiantes consulten rápidamente su información
académica. Reúne el horario, las calificaciones y los datos del alumno en una
experiencia enfocada en las tareas cotidianas, en lugar de reproducir un portal
administrativo institucional.

## Funcionalidades

- Inicio de sesión contra el servicio académico SITH.
- Horario del día en una línea de tiempo, con clase actual y próximas clases.
- Consulta de calificaciones.
- Perfil del alumno y progreso académico.
- Navegación inferior optimizada para dispositivos móviles.
- Diseño responsive para móvil, tablet y escritorio.
- Proxy opcional de Netlify para evitar CORS y mixed content en producción.

El proyecto se encuentra en desarrollo activo. Algunas capacidades previstas, como
persistencia de datos, actualización pull-to-refresh y passkeys, aún no están
completamente implementadas.

## Tecnologías

- React 19 y TypeScript.
- Vite 8.
- Tailwind CSS 4.
- `sith-api-client` para el acceso a la API académica.
- `vite-plugin-pwa` para el manifest y el service worker.
- Oxlint para linting.

## Requisitos

- Node.js compatible con las versiones actuales de Vite y TypeScript.
- [pnpm](https://pnpm.io/).

Instala las dependencias desde la raíz del repositorio:

```bash
pnpm install
```

## Desarrollo local

Copia `.env.example` como `.env` y configura `VITE_API_URL` cuando sea necesario:

```env
VITE_API_URL=
```

Con `VITE_API_URL` vacío, el cliente usa directamente el endpoint oficial de SITH.
Para un entorno HTTPS o una configuración local con proxy, usa una URL como:

```env
VITE_API_URL=http://localhost:8888/api/sith
```

Inicia el frontend con:

```bash
pnpm dev
```

Para probar la función de Netlify localmente, utiliza `netlify dev` y configura la
URL anterior. En producción, `VITE_API_URL` normalmente apunta a
`https://tu-sitio.netlify.app/api/sith`.

## Comandos

| `pnpm preview` | Sirve localmente el build de producción. |

## Seguridad y datos

Las contraseñas no se guardan en `localStorage`, `sessionStorage`, IndexedDB,
cookies ni variables de entorno. El login conserva las credenciales únicamente en
memoria durante la sesión activa, porque el servicio actual requiere credenciales
para cada consulta.

Las variables `VITE_*` son públicas y quedan incluidas en el bundle del frontend;
nunca deben contener secretos.

## Documentación

- [Producto](docs/PRODUCT.MD): objetivos, navegación y comportamiento esperado.
- [Arquitectura](docs/ARCHITECTURE.MD): límites entre aplicación, features e infraestructura.
- [Diseño](docs/design.md): tokens visuales y reglas de interfaz.
- [API](docs/api.md): cliente SITH, proxy, datos y limitaciones conocidas.
- [TODO](TODO.MD): trabajo pendiente y estado del proyecto.
