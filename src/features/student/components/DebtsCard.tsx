import { Card } from "@/components/ui/Card";
import type { Alumno } from "@/lib/api/client";
import { listAdeudoDetails } from "@/lib/notifications/adeudos";

interface DebtsCardProps {
  adeudos: Alumno["adeudos"];
}

export function DebtsCard({ adeudos }: DebtsCardProps) {
  const details = listAdeudoDetails(adeudos);

  return (
    <Card className="flex flex-col gap-3 py-4">
      <p className="text-sm font-medium text-on-surface">Deudas</p>

      {details.length === 0 ? (
        <p className="text-xs text-on-surface-variant">
          Sin deudas por el momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {details.map(({ label, detail }) => (
            <li
              key={label}
              className="flex flex-col gap-0.5 rounded-xl bg-error-container/50 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-on-error-container">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-error"
                  aria-hidden="true"
                />
                {label}
              </span>
              <span className="text-sm text-on-error-container/80">{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}