import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  label: string;
  error?: string;
  trailing?: ReactNode;
  className?: string;
}

export function Input({
  label,
  error,
  trailing,
  className,
  disabled,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = `input-${autoId}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-on-surface disabled:opacity-40"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-xl border bg-surface px-3.5 text-base text-on-surface transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
            trailing ? "pr-11" : ""
          } ${error ? "border-error" : "border-outline"}`}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
