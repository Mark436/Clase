import type { Boleta, HorarioMateria } from "sith-api-client";
import type { ClassMeeting, WeekSchedule } from "./types";

const TIME_RANGE_PATTERN =
  /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(?:\s+([^\s,;]+))?/g;

const WEEKDAY_FIELDS = [
  { field: "lunes", weekday: 1 },
  { field: "martes", weekday: 2 },
  { field: "miercoles", weekday: 3 },
  { field: "jueves", weekday: 4 },
  { field: "viernes", weekday: 5 },
  { field: "sabado", weekday: 6 },
] as const;

interface DaySlot {
  startMinutes: number;
  endMinutes: number;
  classroom: string;
}

export function mapHorario(
  horario: HorarioMateria[],
  boleta: Boleta,
): WeekSchedule {
  const meetings: WeekSchedule = [];
  const seen = new Set<string>();

  for (const subject of horario) {
    const subjectName = resolveSubjectName(subject, boleta);

    for (const { field, weekday } of WEEKDAY_FIELDS) {
      const dayValue = subject.dias[field];
      if (!dayValue) continue;

      for (const slot of parseDaySlots(dayValue)) {
        const key = `${subject.clave}|${weekday}|${slot.startMinutes}|${slot.endMinutes}`;
        if (seen.has(key)) continue;
        seen.add(key);

        meetings.push({
          clave: subject.clave,
          subjectName,
          classroom: slot.classroom,
          professor: subject.docente.trim(),
          weekday,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
        });
      }
    }
  }

  return meetings.sort(compareMeetings);
}

// El nombre de la materia no viene en `horario`; se resuelve con la boleta
// por clave y, si no existe coincidencia, se muestra la clave. Ver docs/api.md.
function resolveSubjectName(
  subject: HorarioMateria,
  boleta: Boleta,
): string {
  const match = boleta.materias.find(
    (materia) => materia.clave === subject.clave,
  );

  return match?.nombre.trim() || subject.clave;
}

// Formato observado por día: "hh:mm-hh:mm GGG" (rango + salón). Se extraen
// todos los rangos presentes, junto con el código de salón que los sigue,
// para tolerar variaciones del API.
function parseDaySlots(value: string): DaySlot[] {
  const slots: DaySlot[] = [];
  TIME_RANGE_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TIME_RANGE_PATTERN.exec(value)) !== null) {
    const startMinutes = toMinutes(Number(match[1]), Number(match[2]));
    const endMinutes = toMinutes(Number(match[3]), Number(match[4]));
    if (startMinutes === null || endMinutes === null) continue;
    if (endMinutes <= startMinutes) continue;

    slots.push({
      startMinutes,
      endMinutes,
      classroom: (match[5] ?? "").trim(),
    });
  }

  return slots;
}

function toMinutes(hours: number, minutes: number): number | null {
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function compareMeetings(a: ClassMeeting, b: ClassMeeting): number {
  return (
    a.weekday - b.weekday ||
    a.startMinutes - b.startMinutes ||
    a.subjectName.localeCompare(b.subjectName)
  );
}
