import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ToastVariant } from "@/components/ui/toastVariants";
import { TOAST_VARIANTS } from "@/components/ui/toastVariants";

const VARIANT_LABELS: Record<ToastVariant, string> = {
  neutral: "Neutral",
  success: "Éxito",
  error: "Error",
};

// Example copy per state, used when the message field is left empty.
const PLACEHOLDERS: Record<ToastVariant, string> = {
  neutral: "Recordatorio de sesión.",
  success: "Tienes calificaciones nuevas o actualizadas.",
  error: "Tienes un adeudo nuevo pendiente.",
};

interface ToastsSectionProps {
  onShowToast?: (message: string, variant: ToastVariant) => void;
}

// Generic preview playground: any message combined with any registered
// variant. New toast states appear here automatically once added to
// TOAST_VARIANTS; nothing in this section is variant-specific.
export function ToastsSection({ onShowToast }: ToastsSectionProps) {
  const [variant, setVariant] = useState<ToastVariant>("neutral");
  const [message, setMessage] = useState("");

  function show() {
    const text = message.trim() === "" ? PLACEHOLDERS[variant] : message.trim();
    onShowToast?.(text, variant);
  }

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-on-surface">Toasts</h4>
      <div role="group" aria-label="Variante del toast" className="flex gap-2">
        {TOAST_VARIANTS.map((value) => {
          const selected = value === variant;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setVariant(value)}
              className={`h-9 flex-1 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                selected
                  ? "bg-primary text-on-primary"
                  : "bg-primary-container/60 text-on-primary-container hover:bg-primary-container"
              }`}
            >
              {VARIANT_LABELS[value]}
            </button>
          );
        })}
      </div>
      <Input
        label="Mensaje"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={PLACEHOLDERS[variant]}
      />
      <Button variant="secondary" onClick={show} className="h-9 text-xs">
        Mostrar toast
      </Button>
      <p className="text-xs text-on-surface-variant">
        Con el mensaje vacío se usa el ejemplo de la variante.
      </p>
    </section>
  );
}
