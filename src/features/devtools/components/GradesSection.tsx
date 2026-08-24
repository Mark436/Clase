import type { Alumno } from "@/lib/api/client";
import type { DevToolsController } from "../useDevConfig";

interface GradesSectionProps {
  alumno: Alumno | null;
  dev: DevToolsController;
}

export function GradesSection({ alumno, dev }: GradesSectionProps) {
  const materias = alumno?.boleta.materias ?? [];

  function setOverride(clave: string, calificacion: string) {
    dev.updateConfig((previous) => ({
      ...previous,
      gradeOverrides: { ...previous.gradeOverrides, [clave]: calificacion },
    }));
  }

  function clearOverride(clave: string) {
    dev.updateConfig((previous) => {
      const gradeOverrides = { ...previous.gradeOverrides };
      delete gradeOverrides[clave];
      return { ...previous, gradeOverrides };
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-on-surface">Calificaciones</h4>

      {materias.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {materias.map((materia) => {
            const override = dev.config.gradeOverrides[materia.clave];

            return (
              <li
                key={materia.clave}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-on-surface">
                    {materia.nombre}
                  </p>
                  {override !== undefined ? (
                    <button
                      type="button"
                      onClick={() => clearOverride(materia.clave)}
                      className="text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      Simulada: "{override}" · restaurar
                    </button>
                  ) : null}
                </div>
                <label className="sr-only" htmlFor={`grade-${materia.clave}`}>
                  Calificación simulada de {materia.nombre}
                </label>
                <input
                  id={`grade-${materia.clave}`}
                  value={override ?? materia.calificacion}
                  onChange={(event) =>
                    setOverride(materia.clave, event.target.value)
                  }
                  inputMode="numeric"
                  className="h-9 w-16 rounded-lg border border-outline bg-surface px-2 text-center text-sm tabular-nums text-on-surface focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary"
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-on-surface-variant">
          No hay materias con calificación.
        </p>
      )}
    </section>
  );
}
