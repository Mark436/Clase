import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ToastVariant } from "@/components/ui/toastVariants";
import { DevPanel } from "@/features/devtools/DevPanel";
import { UNLOCK_TAP_COUNT } from "@/features/devtools/config";
import type { DevToolsController } from "@/features/devtools/useDevConfig";
import type { Alumno } from "@/lib/api/client";

interface StudentPageProps {
  alumno: Alumno | null;
  onRequestRefresh: () => void;
  onShowToast?: (message: string, variant: ToastVariant) => void;
  dev?: DevToolsController;
}

export function StudentPage({
  alumno,
  onRequestRefresh,
  onShowToast,
  dev,
}: StudentPageProps) {
  const nameTapsRef = useRef(0);

  const devEnabled = dev !== undefined && dev.enabled;

  function handleNameTap() {
    if (!dev || devEnabled) return;

    nameTapsRef.current += 1;
    if (nameTapsRef.current >= UNLOCK_TAP_COUNT) {
      nameTapsRef.current = 0;
      dev.enable();
    }
  }

  return (
    <>
      <PageHeader title="Alumno" subtitle="Tu información académica." />
      <Page>
        {alumno ? (
          <>
            <Card className="flex flex-col items-center gap-1 py-6 text-center">
              <button
                type="button"
                onClick={handleNameTap}
                className="rounded-lg text-lg font-semibold text-on-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                {alumno.nombre}
              </button>
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

            {devEnabled && dev ? (
              <DevPanel alumno={alumno} dev={dev} onShowToast={onShowToast} />
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
