import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

export function SchedulePage() {
  return (
    <>
      <PageHeader title="Horario" subtitle="Tus clases de hoy." />
      <Page>
        <Card className="flex flex-col items-center gap-1 py-10 text-center">
          <p className="font-medium text-on-surface">Próximamente</p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            La línea de tiempo del día estará disponible en la siguiente fase.
          </p>
        </Card>
      </Page>
    </>
  );
}
