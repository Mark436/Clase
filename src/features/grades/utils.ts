import type { Alumno, CalificacionMateria } from "@/lib/api/client";
import type { TrackedGrade } from "@/lib/storage/gradeTracking";
import type { GradeRow } from "./types";

// Home opens on Grades only when there are unseen changes to review and the
// period average is a non-zero number; an empty or non-numeric average also
// means Schedule.
export function shouldOpenGradesFirst(
  alumno: Alumno | null,
  unseenChanges: boolean,
): boolean {
  if (!alumno || !unseenChanges) return false;

  const promedio = Number.parseFloat(alumno.boleta.promedio.trim());
  return !Number.isNaN(promedio) && promedio !== 0;
}

export function buildGradeRows(
  tracking: TrackedGrade[],
  materias: CalificacionMateria[],
): GradeRow[] {
  const byClave = new Map(tracking.map((grade) => [grade.clave, grade]));

  return materias.map((materia) => {
    const base = {
      clave: materia.clave,
      nombre: materia.nombre,
    };
    const calificacion = materia.calificacion.trim();
    const record = byClave.get(materia.clave);

    if (calificacion === "") {
      return { ...base, calificacion: "", previous: null, status: "pendiente" };
    }
    if (!record) {
      return { ...base, calificacion, previous: null, status: "nueva" };
    }
    if (record.previous !== null && record.previous !== record.current) {
      return {
        ...base,
        calificacion,
        previous: record.previous,
        status: "cambiada",
      };
    }
    return { ...base, calificacion, previous: record.previous, status: "igual" };
  });
}
