import { Slider } from "@/components/ui/Slider";
import { DEFAULT_LONG_PRESS_MS } from "../types";
import type { DevToolsController } from "../useDevConfig";

const PRESS_MIN_MS = 200;
const PRESS_MAX_MS = 1500;
const PRESS_STEP_MS = 50;

// Controls how long a subject card must be held before the editor opens.
export function InteractionSection({ dev }: { dev: DevToolsController }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-on-surface">Interacción</h4>
      <Slider
        label="Duración de presión larga"
        min={PRESS_MIN_MS}
        max={PRESS_MAX_MS}
        step={PRESS_STEP_MS}
        value={dev.config.longPressDurationMs}
        displayValue={`${dev.config.longPressDurationMs} ms`}
        onChange={(longPressDurationMs) =>
          dev.updateConfig((previous) => ({
            ...previous,
            longPressDurationMs,
          }))
        }
      />
      <p className="text-xs text-on-surface-variant">
        Mantén presionada una tarjeta de clase para editarla. Referencia:{" "}
        {DEFAULT_LONG_PRESS_MS} ms por defecto; aplica con el modo dev activo.
      </p>
    </section>
  );
}
