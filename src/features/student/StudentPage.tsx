import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export function StudentPage() {
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
      </Page>
    </>
  );
}
