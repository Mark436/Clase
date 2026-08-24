import type { Alumno, CalificacionMateria } from "@/lib/api/client";
import type { TrackedGrade } from "@/lib/storage/gradeTracking";
import type { GradeRow } from "./types";

// The app considers grades present only when at least one subject carries an
// actual (non-empty) calificacion; pending subjects do not flip the Home.
export function hasGrades(alumno: Alumno | null): boolean {
  return (
    alumno?.boleta.materias.some(
      (materia) => materia.calificacion.trim() !== "",
    ) ?? false
  );
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
