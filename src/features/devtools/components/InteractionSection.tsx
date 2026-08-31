import { Button } from "@/components/ui/Button";

// Dev-only test affordances. The always-on interaction preferences (long-press
// duration, capsule variant, capsule auto-collapse, notification channel)
// moved to the Settings sheet in features/settings.
export function InteractionSection({
  onSendTestNotification,
}: {
  onSendTestNotification?: () => void;
}) {
  if (!onSendTestNotification) return null;

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold text-on-surface">Notificaciones</h4>
      <Button
        variant="secondary"
        onClick={onSendTestNotification}
        className="w-full"
      >
        Enviar notificación de prueba
      </Button>
      <p className="text-xs text-on-surface-variant">
        Pide permiso y muestra una notificación push de prueba (la misma vía
        que usará un push real), además del canal seleccionado en Ajustes.
      </p>
    </section>
  );
}
