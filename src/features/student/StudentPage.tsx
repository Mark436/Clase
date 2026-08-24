import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";

interface StudentPageProps {
  onRequestRefresh: () => void;
}

export function StudentPage({ onRequestRefresh }: StudentPageProps) {
  return (
    <>
      <PageHeader title="Alumno" subtitle="Tu información académica." />
      <Page>
        <Card className="flex flex-col items-center gap-1 py-10 text-center">
          <p className="font-medium text-on-surface">Próximamente</p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            Aquí verás tus datos, carrera y avance de créditos.
          </p>
        </Card>

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
