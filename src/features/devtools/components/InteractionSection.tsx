import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { DEFAULT_CAPSULE_COLLAPSE_MS, DEFAULT_LONG_PRESS_MS } from "../types";
import type { CapsuleVariant } from "@/components/ui/Capsule";
import type { NotificationChannel } from "../types";
import type { DevToolsController } from "../useDevConfig";

const PRESS_MIN_MS = 200;
const PRESS_MAX_MS = 1500;
const PRESS_STEP_MS = 50;

const COLLAPSE_MIN_MS = 500;
const COLLAPSE_MAX_MS = 5000;
const COLLAPSE_STEP_MS = 250;

// Controls how long a subject card must be held before the editor opens,
// plus how the context capsule presents and collapses.
export function InteractionSection({
  dev,
  onSendTestNotification,
}: {
  dev: DevToolsController;
  onSendTestNotification?: () => void;
}) {
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

      <div className="mt-1 flex flex-col gap-2">
        <span className="text-sm font-medium text-on-surface">
          Variante de cápsula
        </span>
        <div
          role="group"
          aria-label="Variante de cápsula"
          className="flex gap-2"
        >
          {(
            [
              ["pill", "A · Píldora total"],
              ["morf", "B · Morf iOS"],
            ] as ReadonlyArray<[CapsuleVariant, string]>
          ).map(([value, label]) => {
            const isActive = dev.config.capsuleVariant === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  dev.updateConfig((previous) => ({
                    ...previous,
                    capsuleVariant: value,
                  }))
                }
                className={`h-9 flex-1 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-outline-variant/60 text-on-surface-variant"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Slider
        label="Colapso automático de cápsula"
        min={COLLAPSE_MIN_MS}
        max={COLLAPSE_MAX_MS}
        step={COLLAPSE_STEP_MS}
        value={dev.config.capsuleCollapseMs}
        displayValue={`${(dev.config.capsuleCollapseMs / 1000).toFixed(2)} s`}
        onChange={(capsuleCollapseMs) =>
          dev.updateConfig((previous) => ({
            ...previous,
            capsuleCollapseMs,
          }))
        }
      />
      <p className="text-xs text-on-surface-variant">
        La cápsula se expande sola en cambios importantes (inicio de clase,{" "}
        {"<"}1 h y {"<"}1 min) y colapsa sola. Referencia:{" "}
        {DEFAULT_CAPSULE_COLLAPSE_MS} ms por defecto.
      </p>

      <div className="mt-1 flex flex-col gap-2">
        <span className="text-sm font-medium text-on-surface">
          Avisos de eventos
        </span>
        <div
          role="group"
          aria-label="Canal de notificaciones"
          className="flex gap-2"
        >
          {(
            [
              ["capsule", "Cápsula"],
              ["toast", "Toast"],
            ] as ReadonlyArray<[NotificationChannel, string]>
          ).map(([value, label]) => {
            const isActive = dev.config.notificationChannel === value;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  dev.updateConfig((previous) => ({
                    ...previous,
                    notificationChannel: value,
                  }))
                }
                className={`h-9 flex-1 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-outline-variant/60 text-on-surface-variant"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-on-surface-variant">
          Define cómo se anuncian calificaciones nuevas, adeudos y progreso:
          la cápsula muestra el detalle y luego el promedio del periodo;
          {" "}el toast clásico aparece abajo. Por defecto: cápsula.
        </p>
      </div>

      {onSendTestNotification ? (
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={onSendTestNotification}
            className="w-full"
          >
            Enviar notificación de prueba
          </Button>
          <p className="text-xs text-on-surface-variant">
            Dispara un evento usando el canal seleccionado arriba: la cápsula
            se expande mostrando el detalle y luego el resumen; el toast
            aparece abajo.
          </p>
        </div>
      ) : null}
    </section>
  );
}
