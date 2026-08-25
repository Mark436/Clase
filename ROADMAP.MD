# Roadmap — Studia

## Pendientes inmediatos

Especificación completa de estas fases en [`docs/plan.md`](docs/plan.md):

- [x] **Fase A** — Mostrar el salón (código junto a la hora) en las tarjetas de clase en lugar del grupo.
- [x] **Fase B** — Pull-to-refresh; sin credenciales en memoria abre el formulario de reingreso.
- [x] **Fase C** — Home condicional: Calificaciones abre primero solo con cambios nuevos por ver y promedio del periodo ≠ 0.
- [x] **Fase D** — Recordatorio diario (una vez al día) para volver a iniciar sesión, con toast. _(Evolucionado: hoy es un nudge de datos obsoletos ≥ 23 h — solo toast sugiriendo pull-to-refresh; el sheet de reingreso ya no se abre solo.)_

## 0. Base del proyecto

- [x] Crear el proyecto con Vite + React + TypeScript.
- [x] Configurar TypeScript estricto.
- [x] Configurar el alias `@` para apuntar a `src`.
- [x] Configurar `vite-plugin-pwa`.
- [x] Crear el manifest de la PWA.
- [x] Añadir iconos de la aplicación.
- [x] Configurar el service worker.
- [x] Configurar estilos globales.
- [ ] Definir estrategia responsive mobile-first.
- [x] Configurar variables de entorno.
- [ ] Conectar el sitio de Netlify y definir `VITE_API_URL` en producción (apuntando a `/api/sith`).
- [x] Añadir `sith-api-client` como dependencia de runtime, no como `devDependency`.
- [x] Añadir función proxy de Netlify (`netlify/functions/sith-proxy.mts`) para evitar CORS/mixed-content — ver `docs/api.md`.
- [ ] Configurar el consumo del paquete local si se desarrolla junto con la PWA.
- [ ] Verificar compatibilidad de imports ES con extensión `.js`.

## 1. Arquitectura

### Estructura inicial

```text
src/
├── app/
│   ├── App.tsx
│   └── navigation.tsx
├── components/
│   └── ui/
├── features/
│   ├── auth/
│   ├── schedule/
│   ├── grades/
│   ├── student/
│   └── notifications/
├── lib/
│   ├── api/
│   ├── storage/
│   └── biometrics/
├── pages/
├── styles/
├── main.tsx
└── types/
```

- [ ] Mantener las features independientes entre sí.
- [ ] Evitar componentes React con lógica de negocio compleja.
- [ ] Mantener la lógica del horario separada de su representación visual.
- [ ] Mantener la lógica de autenticación separada de las pantallas.
- [ ] Utilizar named exports.
- [ ] Evitar default exports.
- [ ] Evitar `any`.
- [ ] Evitar abstracciones innecesarias.
- [ ] Mantener los componentes pequeños.
- [ ] Definir un flujo de dependencias claro: UI → Features → Domain/Services → `sith-api-client` → API.
- [ ] Los componentes no deben instanciar directamente `SithClient`.
- [ ] Centralizar la configuración del cliente API.
- [ ] Centralizar la carga y actualización de `AppData`.

## 2. Modelo de datos de la aplicación

- [ ] Crear un modelo de dominio independiente de la respuesta exacta de la API cuando sea necesario.
- [ ] Definir `AppData`.
- [ ] Definir estado de carga.
- [ ] Definir estado de error.
- [ ] Definir estado autenticado/no autenticado.
- [ ] Definir fecha y hora de última actualización.
- [ ] Definir estructura de datos para:
  - [ ] alumno
  - [ ] horario
  - [ ] calificaciones
  - [ ] avisos
  - [ ] adeudos
  - [ ] progreso
  - [ ] `loadedAt`
- [ ] Crear mapeadores solo si los tipos de la API y del dominio necesitan estar desacoplados.
- [ ] Evitar duplicar tipos que ya estén correctamente definidos en `sith-api-client`.

## 3. Autenticación

### Primer acceso

```text
Usuario + contraseña
↓
SithClient
↓
Datos del alumno
↓
Sesión de la aplicación
```

- [x] Crear pantalla de login.
- [x] Añadir campo de usuario.
- [x] Añadir campo de contraseña.
- [x] Implementar validación básica.
- [x] Definir estado de loading.
- [x] Mostrar errores de autenticación.
- [x] No persistir la contraseña en localStorage.
- [x] No persistir la contraseña en sessionStorage.
- [x] No persistir la contraseña en IndexedDB.
- [x] Definir logout.
- [ ] Definir expiración de sesión.
- [x] Definir comportamiento al recargar la PWA (se restauran los datos cacheados; sin contraseña guardada, se pide reingreso al actualizar).
- [x] Recordar el usuario (nunca la contraseña) para agilizar accesos posteriores.
- [x] Reingreso sin perder la sesión: un fallo durante la revalidación mantiene los datos en pantalla y reporta el error dentro del sheet (con usuario prellenado); el nudge de datos obsoletos (≥ 23 h) es solo un toast que sugiere pull-to-refresh, el sheet ya no se abre automáticamente.

### Accesos posteriores

- [ ] Investigar WebAuthn/passkeys.
- [ ] Diseñar flujo de acceso mediante biometría.
- [ ] Determinar cómo se relacionará la credencial biométrica con la autenticación de la API.
- [ ] Si la API requiere actualmente `user + pass` para cada consulta, evaluar una sesión/token como mejora del backend.
- [ ] No intentar almacenar la contraseña cifrada en el frontend como sustituto de una sesión segura.

## 4. Persistencia local

### Objetivo

```text
Abrir aplicación
↓
¿Hay datos locales?
↙          ↘
Sí          No
↓          ↓
Mostrar datos locales   Mostrar Login
↓
Intentar actualizar
```

- [x] Evaluar IndexedDB para persistencia.
- [x] Persistir datos académicos.
- [x] Persistir `loadedAt`.
- [x] No persistir credenciales.
- [x] Mostrar inmediatamente los últimos datos disponibles.
- [x] Intentar actualizar cuando corresponda (pull-to-refresh).
- [ ] Manejar aplicación offline.
- [ ] Mostrar claramente cuando los datos mostrados son antiguos (el indicador previo se retiró; pendiente decidir reemplazo ligero).
- [x] Invalidar datos locales cuando sea necesario (logout borra todo el almacenamiento).

## 5. Navegación

### Áreas principales

- Horario
- Calificaciones
- Alumno

- [x] Crear bottom navigation mobile-first.
- [x] Crear navegación entre las tres áreas.
- [x] Utilizar iconos coherentes.
- [x] Mantener la navegación accesible.
- [x] Añadir estados activo/inactivo.
- [x] Respetar safe areas de dispositivos móviles.
- [x] Definir pantalla principal dinámica.
- [x] Horario es el Home por defecto.
- [x] Calificaciones abre como Home solo con cambios nuevos por ver y promedio del periodo ≠ 0.
- [x] Crear una función o lógica independiente para determinar el Home.
- [ ] Intercambiar también icono y etiqueta según el estado de Home.
- [x] Mantener acceso al resto de las áreas.
- [ ] No duplicar la lógica de navegación dentro de cada pantalla.

## 6. Horario

### Vista diaria

- [x] Bloqueo resuelto: `sith-api-client` ≥2.3 expone el horario (`Alumno.horario`); el nombre de materia se resuelve con la boleta — ver `docs/api.md`.
- [x] La pantalla principal del horario debe representar el día como una timeline vertical.
- [x] Mostrar el día actual inicialmente.
- [x] Mostrar las clases del día.
- [x] Mostrar hora de inicio.
- [x] Mostrar hora de finalización.
- [x] Ocultar clases completamente terminadas.
- [x] Mantener visible la clase actualmente en curso.
- [x] Mostrar la siguiente clase.
- [x] Destacar visualmente la clase actual.
- [x] Reducir prioridad visual de las clases futuras.
- [x] Mostrar ubicación/aula si existe.
- [x] Mostrar profesor si existe.

### Hora actual

- [x] Mostrar indicador de hora actual.
- [x] Posicionar la línea según la hora real.
- [x] Actualizar la posición periódicamente.
- [x] No actualizar cada segundo si no es necesario.
- [x] Alinear el temporizador al borde del minuto real (recalcula exactamente cuando cambia el minuto relevante).
- [x] Pausar actualizaciones innecesarias cuando la aplicación esté en background.
- [x] Recalcular al volver a foreground.
- [x] Mantener la clase actual correctamente aunque la hora cambie.

### Cuenta regresiva de la siguiente clase

- [x] Mostrar tiempo relativo ("20 min", "1 hr y 30 min"; se omiten los valores en cero).
- [x] Mostrar "Empieza pronto" en el minuto exacto de inicio.

### Progreso de clase

- [x] Calcular porcentaje de progreso.
- [x] Representar visualmente el progreso.
- [x] Mostrar tiempo restante.
- [x] Evitar errores en clases que cruzan cambios de hora/día.

### Edición y personalización del horario

- [x] Editar materia (nombre, profesor, salón) manteniendo presionada la tarjeta o con el botón de lápiz; duración de la presión larga configurable desde modo dev.
- [x] Editar el horario de una ocurrencia específica (día) sin afectar las demás.
- [x] Agregar materias manuales (p. ej. Inglés) con días y rango horario.
- [x] Eliminar materias agregadas manualmente.
- [x] Persistir ediciones y materias manuales en IndexedDB (sobreviven recargas; se borran con logout).
- [x] Resolver empalmes con una sola tarjeta por intervalo: la clase ganadora conserva su rango completo y muestra un aviso con las clases desplazadas ("Matemáticas" o "1/4 Matemáticas").
- [x] Fracciones amigables en el aviso (1/4, 1/3, 1/2, 2/3, 3/4) con respaldo en minutos.
- [x] Prioridad: materias manuales sobre las consultadas; entre iguales, el horario más temprano.
- [x] Alternar el orden con un toque en el aviso: primer toque solo hoy (efímero), segundo toque toda la semana (persistente), tercer toque restaura el orden original.
- [x] Limpiar preferencias de empalme obsoletas al desaparecer el empalme (por edición o datos nuevos).
- [x] Botón circular "+" (solo icono) para agregar materia, reemplazando el botón con texto.
- [x] Validación por campo en el editor (nombre vacío, rango inválido, sin días) con mensajes junto a cada campo y `TimeInput` dedicado; al corregir el error desaparece al instante.
- [x] Al crear una materia, el horario salta al primer día seleccionado y muestra un toast de éxito.
- [x] Presión larga con umbral por defecto de 550 ms (`DEFAULT_LONG_PRESS_MS`); la web no puede leer el umbral del sistema operativo (limitación documentada en `docs/app-flow.md`).
- [x] Reconciliación de ediciones manuales vs. cambios de la escuela (drift): tras cada fetch real se comparan los campos de texto contra la línea base guardada; los choques con ediciones vivas persisten como conflictos pendientes y se resuelven en un sheet ("Usar el nuevo" / "Conservar el mío"). Pausado durante simulación dev.

### Navegación entre días

- [ ] Implementar swipe horizontal.
- [ ] Swipe hacia izquierda → siguiente día.
- [ ] Swipe hacia derecha → día anterior.
- [ ] Añadir selector de fecha.
- [ ] Mantener navegación táctil fluida.
- [ ] Animar la transición entre días de forma sutil.
- [x] Permitir navegar a otros días disponibles.

### Vista de dos días

- [ ] Diseñar modo de dos días.
- [ ] Mostrar ambos días completos.
- [ ] Evaluar si funciona correctamente en pantallas pequeñas.
- [ ] Considerar scroll horizontal.
- [ ] Mantener la vista diaria como modo predeterminado.
- [ ] Añadir selector para cambiar entre 1 día y 2 días.

## 7. Calificaciones

- [x] Crear pantalla de calificaciones.
- [x] Mostrar promedio.
- [x] Mostrar materias.
- [x] Mostrar calificación por materia.
- [x] Mostrar período/semestre cuando esté disponible.
- [ ] Mostrar créditos relacionados cuando estén disponibles.
- [x] Crear state sin calificaciones.
- [ ] Crear loading state.
- [ ] Crear error state.
- [ ] Evaluar historial de calificaciones si la API lo permite.
- [x] Detectar cambios entre consultas (materia nueva o calificación modificada) mediante seguimiento local (`TrackedGrade`, sin fechas).
- [x] Aviso tipo toast (verde) cuando una actualización real detecta calificaciones nuevas o modificadas.
- [x] Abrir Calificaciones como Home solo con cambios nuevos por ver y promedio del periodo ≠ 0.
- [ ] Intercambiar posición, icono y etiqueta de navegación.
- [x] No mostrar una pantalla vacía cuando todavía no existan calificaciones.

## 8. Alumno

### Información general

- [x] Crear pantalla de alumno.
- [x] Mostrar nombre.
- [ ] Mostrar matrícula.
- [x] Mostrar carrera.
- [x] Mostrar semestre.
- [ ] Mostrar campus.
- [ ] Mostrar otros datos relevantes disponibles.

### Progreso académico

- [x] Mostrar progreso total de la carrera.
- [x] Mostrar porcentaje.
- [ ] Mostrar créditos aprobados.
- [ ] Mostrar créditos en curso.
- [ ] Mostrar créditos restantes.
- [x] Mostrar semestre actual.
- [ ] Mostrar progreso por semestre si la información lo permite.
- [x] Crear componente visual de progreso.
- [x] Notificar avance de carrera: toast in-app y notificación local opcional (mismo opt-in que adeudos) cuando `progreso` aumenta entre fetchs reales, indicando cuánto subió.
- [ ] Evitar presentar información académica redundante.

## 9. Avisos

- [ ] Mostrar avisos relevantes en Home.
- [ ] Diferenciar avisos importantes de informativos si existe esa información.
- [ ] Crear estado sin avisos.
- [ ] Evitar que los avisos dominen la interfaz.
- [ ] Evaluar posteriormente notificaciones push.

## 10. Adeudos

- [x] Tratar los adeudos como una alerta principal, no como una sección central.
- [x] Detectar adeudos al cargar `AppData`.
- [x] Mostrar alerta si existen.
- [x] No añadir Adeudos como tab principal.
- [ ] Permitir acceder a detalles si es necesario.
- [x] Ocultar completamente la alerta cuando no existan adeudos.
- [x] Alerta local opcional al aparecer un adeudo nuevo (opt-in, solo transición sin→con adeudo).
- [x] Aviso tipo toast in-app (rojo) en la misma transición sin→con adeudo, independiente del opt-in de notificaciones del sistema.
- [ ] Evaluar posteriormente notificaciones push para adeudos (requiere backend con sesión/token; ver `docs/api.md`).

## 11. Actualización de datos

- [ ] Definir política de actualización manual y automática.
- [x] La actualización manual es mediante pull-to-refresh (gesto principal).
- [x] Alternativa accesible no-gesto: acción "Actualizar" en la sección Alumno (el gesto no es el único camino).
- [ ] La actualización automática se activará al abrir la app, al hacer login y cuando haya datos vencidos.
- [ ] Definir la estrategia de invalidación de caché cuando cambien los datos.
- [ ] Mostrar claramente el estado de última actualización.
- [ ] Definir cooldown o throttling para evitar solicitudes repetidas.
- [ ] Manejar errores de red y tiempos de espera.
- [ ] Cuando no haya conectividad, mostrar datos locales con una advertencia visual.
- [ ] Completar la lógica de reintento cuando la conexión vuelva.

## 12. Calidad y UX

- [ ] Revisar accesibilidad básica: contraste, foco, tamaños de toque, lectura por pantalla.
- [ ] Validar experiencia mobile-first y evitar layouts frágiles en pantallas pequeñas.
- [ ] Revisar estados vacíos, loading y error en cada pantalla.
- [ ] Probar navegación con teclado y gesto táctil.
- [ ] Revisar rendimiento y evitar renders innecesarios.
- [ ] Documentar decisiones de arquitectura y flujo de datos.

## 13. Modo dev (herramientas de prueba)

- [x] Panel en Alumno activado con 7 taps sobre el nombre (en builds dev visible por defecto). Sin chequeo de dueño: las credenciales del API son la única barrera real; el panel solo oculta UI.
- [x] Botón «Cerrar modo dev»: oculta el panel hasta repetir los 7 taps, pausa la simulación y conserva la configuración guardada.
- [x] Reloj simulado (offset/datetime) que alimenta hora, día, clase en curso y progreso.
- [x] Agregar/quitar materias del horario (solo presentación).
- [x] Editar calificaciones simuladas por materia.
- [x] Toggle de adeudos (banner y alertas).
- [x] Config persistida en settings store con botón "Restaurar datos reales".
- [x] Sección de pruebas de toast: variante y mensaje arbitrarios (los estados nuevos aparecen solos al registrarse en `TOAST_VARIANTS`).
- [x] Slider de duración del toast (1–10 s) y de duración de presión larga (200–1500 ms); aplican solo con el panel abierto (pausa al cerrar, igual que el resto de overrides).
- [x] Toast con desvanecimiento de salida y temporizadores que no se reinician con re-renders del host.
- [x] Los toggles de calificaciones y adeudos disparan los toasts reales de producción (mismo texto y variante que un fetch real), a través del mismo `onShowToast` del shell.
- [ ] Evaluar retirar el panel antes de compartir la app con otros alumnos.

## 13.1 Pruebas

- [x] Configurar vitest (`pnpm test`).
- [x] Pruebas de lógica pura del horario: cuenta regresiva, selección de clase actual/siguiente en el minuto exacto, `parseMinutes`/`formatMinutes`.
- [x] Pruebas de resolución de empalmes: agrupamiento, prioridad, fracciones amigables y preferencias de alternancia.
- [x] Pruebas de aplicación de ediciones y validación de la persistencia del horario.
- [x] Pruebas de reconciliación de drift (`collectSubjectFields`, `detectManualEditConflicts`, fusión de conflictos) y de las nuevas formas persistidas (snapshots, conflictos pendientes).
- [x] Pruebas de sincronización del temporizador por minuto (`msUntilNextMinute`, independiente de zona horaria).

## 14. Criterio de finalización

- [ ] La app puede iniciar en modo PWA.
- [ ] El usuario puede iniciar sesión correctamente.
- [ ] El horario se muestra y actualiza según la hora real.
- [ ] Las calificaciones aparecen con estado vacío y error definidos.
- [ ] La navegación principal funciona en mobile.
- [ ] Los datos se guardan y restauran localmente sin exponer credenciales.
- [ ] El flujo offline/online está definido y es visible para el usuario.
