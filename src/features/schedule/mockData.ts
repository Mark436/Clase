import type { WeekSchedule } from "./types";

// TEMPORAL: datos de ejemplo mientras `sith-api-client` no expone el horario.
// Punto único de reemplazo: mapear alumno.horario → ClassMeeting en lib/api.
// Ver docs/api.md ("Missing schedule").

export const MOCK_MEETINGS: WeekSchedule = [
  { subjectName: "Programación Orientada a Objetos", group: "1A · Lab. Cómputo 1", weekday: 1, startMinutes: 480, endMinutes: 570 },
  { subjectName: "Cálculo Diferencial", group: "1A · Aula 12", weekday: 1, startMinutes: 585, endMinutes: 675 },
  { subjectName: "Química", group: "1B · Lab. Química 2", weekday: 1, startMinutes: 690, endMinutes: 780 },
  { subjectName: "Física", group: "1A · Aula 8", weekday: 2, startMinutes: 600, endMinutes: 690 },
  { subjectName: "Base de Datos Relacionales", group: "2B · Lab. Cómputo 2", weekday: 2, startMinutes: 705, endMinutes: 795 },
  { subjectName: "Matemáticas Aplicadas", group: "1C · Aula 15", weekday: 3, startMinutes: 480, endMinutes: 570 },
  { subjectName: "Contabilidad Financiera", group: "2A · Aula 21", weekday: 3, startMinutes: 585, endMinutes: 675 },
  { subjectName: "Redes de Computadoras", group: "3A · Lab. Redes", weekday: 4, startMinutes: 600, endMinutes: 690 },
  { subjectName: "Inglés", group: "2C · Aula 9", weekday: 4, startMinutes: 705, endMinutes: 795 },
  { subjectName: "Taller de Ética", group: "1A · Aula 4", weekday: 5, startMinutes: 600, endMinutes: 675 },
  { subjectName: "Asesorías", group: "Lab. Cómputo 1", weekday: 6, startMinutes: 540, endMinutes: 660 },
];
