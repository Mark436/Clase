import type { CalificacionMateria } from "@/lib/api/client";
import { getAllValues, putAllValues, STORE_GRADE_TRACKING } from "./db";

export interface TrackedGrade {
  clave: string;
  nombre: string;
  current: string;
  previous: string | null;
}

export async function loadGradeTracking(): Promise<TrackedGrade[]> {
  return getAllValues<TrackedGrade>(STORE_GRADE_TRACKING);
}

export async function saveGradeTracking(grades: TrackedGrade[]): Promise<void> {
  await putAllValues(
    STORE_GRADE_TRACKING,
    grades.map((grade) => ({ key: grade.clave, value: grade })),
  );
}

// Folds a fresh boleta into the tracking records so the UI can tell whether a
// grade is new or changed. Subjects whose calificacion is empty carry no
// signal yet and are skipped; subjects missing from the boleta are dropped.
export function mergeGradeTracking(
  previous: TrackedGrade[],
  materias: CalificacionMateria[],
): TrackedGrade[] {
  const byClave = new Map(previous.map((grade) => [grade.clave, grade]));
  const merged: TrackedGrade[] = [];

  for (const materia of materias) {
    const calificacion = materia.calificacion.trim();
    if (calificacion === "") continue;

    const record = byClave.get(materia.clave);

    if (!record) {
      merged.push({
        clave: materia.clave,
        nombre: materia.nombre,
        current: calificacion,
        previous: null,
      });
      continue;
    }

    if (record.current === calificacion) {
      merged.push({ ...record, nombre: materia.nombre });
      continue;
    }

    merged.push({
      clave: materia.clave,
      nombre: materia.nombre,
      current: calificacion,
      previous: record.current,
    });
  }

  return merged;
}
