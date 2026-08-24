import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Alumno } from "@/lib/api/client";
import { loadGradeTracking } from "@/lib/storage/gradeTracking";
import type { TrackedGrade } from "@/lib/storage/gradeTracking";
import { useAuth } from "@/features/auth/auth-context";
import type { GradeRow } from "./types";
import { buildGradeRows } from "./utils";

interface GradesPageProps {
  alumno: Alumno | null;
}

export function GradesPage({ alumno }: GradesPageProps) {
  const { markGradesSeen } = useAuth();
  const [tracking, setTracking] = useState<TrackedGrade[]>([]);

  useEffect(() => {
    markGradesSeen();
  }, [markGradesSeen]);

  useEffect(() => {
    let cancelled = false;

    void loadGradeTracking()
      .then((grades) => {
        if (!cancelled) setTracking(grades);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const materias = useMemo(() => alumno?.boleta.materias ?? [], [alumno]);
  const rows = useMemo(
    () => buildGradeRows(tracking, materias),
    [tracking, materias],
  );

  const periodo = alumno?.boleta.periodo.trim();

  return (
    <>
      <PageHeader
        title="Calificaciones"
        subtitle={periodo ? `Periodo ${periodo}` : "Tu rendimiento académico."}
      />
      <Page>
        {materias.length === 0 ? (
          <Card className="flex flex-col items-center gap-1 py-10 text-center">
            <p className="font-medium text-on-surface">Sin calificaciones</p>
            <p className="max-w-xs text-sm text-on-surface-variant">
              Cuando tengas calificaciones aparecerán aquí y esta sección será
              tu inicio.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center gap-1 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Promedio general
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatPromedio(alumno?.promedioGeneral)}
                </p>
              </Card>
              <Card className="flex flex-col items-center gap-1 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Del periodo
                </p>
                <p className="text-2xl font-bold text-primary">
                  {alumno?.boleta.promedio.trim() || "—"}
                </p>
              </Card>
            </div>

            <div className="divide-y divide-outline-variant overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-outline-variant">
              {rows.map((row) => (
                <div
                  key={row.clave}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">
                      {row.nombre}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {row.clave}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <GradeStatusBadge row={row} />
                    <span
                      className={`w-8 text-right text-base font-bold ${
                        row.status === "pendiente"
                          ? "text-on-surface-variant"
                          : "text-primary"
                      }`}
                    >
                      {row.status === "pendiente" ? "—" : row.calificacion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Page>
    </>
  );
}

function GradeStatusBadge({ row }: { row: GradeRow }) {
  if (row.status === "cambiada") {
    return (
      <Badge variant="primary">
        Cambió {row.previous}→{row.calificacion}
      </Badge>
    );
  }
  if (row.status === "nueva") {
    return <Badge variant="primary">Nueva</Badge>;
  }
  if (row.status === "pendiente") {
    return <Badge>Pendiente</Badge>;
  }
  return null;
}

function formatPromedio(promedio: number | undefined): string {
  return promedio === undefined ? "—" : String(promedio);
}
