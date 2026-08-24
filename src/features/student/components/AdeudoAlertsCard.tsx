import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Alumno } from "@/lib/api/client";
import { useAdeudoAlertsOptIn } from "@/lib/notifications/useAdeudoAlertsOptIn";

interface AdeudoAlertsCardProps {
  alumno: Alumno | null;
}

export function AdeudoAlertsCard({ alumno }: AdeudoAlertsCardProps) {
  const { state, enable, decline } = useAdeudoAlertsOptIn();

  if (state !== "unset" || !alumno) return null;

  return (
    <Card className="mx-4 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-medium text-on-surface">
          Alertas de adeudos
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          Te avisamos en cuanto aparezca un adeudo nuevo.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={enable} className="flex-1 sm:flex-none">
          Activar
        </Button>
        <Button variant="ghost" onClick={decline} className="flex-1 sm:flex-none">
          No, gracias
        </Button>
      </div>
    </Card>
  );
}
