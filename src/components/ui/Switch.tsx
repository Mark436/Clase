import { useId } from "react";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export function Switch({
  label,
  checked,
  onChange,
  disabled,
  description,
}: SwitchProps) {
  const autoId = useId();
  const switchId = `switch-${autoId}`;

  return (
    <label
      htmlFor={switchId}
      className={`flex w-full items-start justify-between gap-3 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-on-surface">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-on-surface-variant">
            {description}
          </span>
        ) : null}
      </span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${
          checked ? "bg-primary" : "bg-outline-variant"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
