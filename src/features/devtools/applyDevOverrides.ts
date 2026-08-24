import type { Adeudos, Alumno, HorarioDia, HorarioMateria } from "sith-api-client";
import type { CalificacionMateria } from "@/lib/api/client";
import type { DevConfig, DevMateria } from "./types";

const WEEKDAY_FIELD_BY_DAY: Partial<Record<number, keyof HorarioDia>> = {
  1: "lunes",
  2: "martes",
  3: "miercoles",
  4: "jueves",
  5: "viernes",
  6: "sabado",
};

function buildDias(materia: DevMateria): HorarioDia {
  const salon = materia.salon.trim();
  const slot = `${materia.inicio}-${materia.fin}${salon !== "" ? ` ${salon}` : ""}`;
  const dias: HorarioDia = {};

  for (const day of materia.dias) {
    const field = WEEKDAY_FIELD_BY_DAY[day];
    if (field) dias[field] = slot;
  }

  return dias;
}

function toHorarioMateria(materia: DevMateria): HorarioMateria {
  return {
    clave: materia.clave,
    creditos: undefined,
    grupo: "*",
    docente: materia.docente,
    dias: buildDias(materia),
  };
}

function toCalificacionMateria(materia: DevMateria): CalificacionMateria {
  return {
    clave: materia.clave,
    nombre: materia.nombre,
    calificacion: materia.calificacion.trim(),
    claveOportunidad: "",
    oportunidad: "",
    creditos: 0,
  };
}

// The banner lists areas from non-empty string fields; a simulated debt needs
// at least one so the alert reads naturally.
function simulateAdeudos(adeudos: Adeudos, present: boolean): Adeudos {
  if (!present) {
    return {
      biblioteca: "",
      academico: "",
      escolar: "",
      financiero: "",
      administrativo: "",
      tieneAdeudos: false,
    };
  }
  return {
    ...adeudos,
    financiero:
      adeudos.financiero.trim() !== "" ? adeudos.financiero : "simulado",
    tieneAdeudos: true,
  };
}

// Presentation-only transform: builds a virtual alumno for rendering. Real
// fetches, persistence and grade tracking keep using the untouched data.
export function applyDevOverrides(alumno: Alumno, config: DevConfig): Alumno {
  const hasHorarioChanges =
    config.extraMaterias.length > 0 || config.removedClaves.length > 0;
  const hasGradeChanges = Object.keys(config.gradeOverrides).length > 0;

  if (!hasHorarioChanges && !hasGradeChanges && config.adeudoOverride === null) {
    return alumno;
  }

  const materias = alumno.boleta.materias
    .filter((materia) => !config.removedClaves.includes(materia.clave))
    .map((materia) =>
      hasGradeChanges && materia.clave in config.gradeOverrides
        ? { ...materia, calificacion: config.gradeOverrides[materia.clave] }
        : materia,
    );

  return {
    ...alumno,
    horario: alumno.horario
      .filter((materia) => !config.removedClaves.includes(materia.clave))
      .concat(config.extraMaterias.map(toHorarioMateria)),
    boleta: {
      ...alumno.boleta,
      materias: hasHorarioChanges
        ? [...materias, ...config.extraMaterias.map(toCalificacionMateria)]
        : materias,
    },
    adeudos:
      config.adeudoOverride === null
        ? alumno.adeudos
        : simulateAdeudos(alumno.adeudos, config.adeudoOverride),
  };
}
