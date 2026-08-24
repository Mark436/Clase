import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export function GradesPage() {
  return (
    <>
      <PageHeader title="Calificaciones" subtitle="Tu rendimiento académico." />
      <Page>
        <Card className="flex flex-col items-center gap-1 py-10 text-center">
          <p className="font-medium text-on-surface">Próximamente</p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            Cuando tengas calificaciones aparecerán aquí y esta sección será tu
            inicio.
          </p>
        </Card>
      </Page>
    </>
  );
}
