import { useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import type { Alumno } from "@/lib/api/client";
import { listAdeudoAreas } from "@/lib/notifications/adeudos";

interface DebtBannerProps {
  adeudos: Alumno["adeudos"];
}

export function DebtBanner({ adeudos }: DebtBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const areas = listAdeudoAreas(adeudos);

  return (
    <div
      role="alert"
      className="mx-4 mt-4 flex items-start gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container"
    >
      <p className="flex-1">
        <span className="font-semibold">Tienes adeudos pendientes.</span>{" "}
        {areas.length > 0
          ? `${areas.join(", ")}.`
          : "Revisa tu información académica."}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Descartar aviso de adeudos"
        className="-m-1 rounded-lg p-1 transition-colors hover:bg-error/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-on-error-container"
      >
        <CloseIcon size={18} />
      </button>
    </div>
  );
}
