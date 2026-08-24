import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Alumno } from "@/lib/api/client";

interface StudentPageProps {
  alumno: Alumno | null;
  onRequestRefresh: () => void;
}

export function StudentPage({ alumno, onRequestRefresh }: StudentPageProps) {
  return (
    <>
      <PageHeader title="Alumno" subtitle="Tu información académica." />
      <Page>
        {alumno ? (
          <>
            <Card className="flex flex-col items-center gap-1 py-6 text-center">
              <p className="text-lg font-semibold text-on-surface">
                {alumno.nombre}
              </p>
              <p className="text-sm text-on-surface-variant">{alumno.carrera}</p>
              <p className="text-xs text-on-surface-variant">
                Semestre {alumno.semestre}
              </p>
            </Card>

            {Number.isFinite(alumno.progreso) ? (
              <Card className="flex flex-col gap-3 py-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-on-surface">
                    Progreso de la carrera
                  </p>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {Math.round(alumno.progreso)}%
                  </span>
                </div>
                <ProgressBar
                  value={alumno.progreso}
                  label="Progreso de la carrera"
                />
              </Card>
            ) : null}
          </>
        ) : (
          <Card className="py-8 text-center text-sm text-on-surface-variant">
            No hay datos del alumno disponibles.
          </Card>
        )}

        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface">
              Actualizar datos
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              También puedes deslizar hacia abajo en cualquier pantalla.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onRequestRefresh}
            className="shrink-0"
          >
            Actualizar
          </Button>
        </Card>
      </Page>
    </>
  );
}
