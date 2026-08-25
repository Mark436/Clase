import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface TimeInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type"> {
  label: string;
  error?: string;
  className?: string;
}

// Native HH:MM entry primitive. Kept as a standalone ui component so a future
// custom picker (styled or animated) can replace the internals without
// touching call sites.
export function TimeInput({
  label,
  error,
  className,
  disabled,
  ...rest
}: TimeInputProps) {
  const autoId = useId();
  const inputId = `time-${autoId}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-on-surface disabled:opacity-40"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="time"
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 w-full rounded-xl border bg-surface px-3.5 text-base text-on-surface transition-colors focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
          error ? "border-error" : "border-outline"
        }`}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
