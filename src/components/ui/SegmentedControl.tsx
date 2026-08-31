import { useId } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  const autoId = useId();
  const groupId = `segment-${autoId}`;

  return (
    <div className="flex flex-col gap-2">
      <span id={groupId} className="text-sm font-medium text-on-surface">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={groupId}
        className="flex gap-2"
      >
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`h-9 flex-1 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "bg-outline-variant/60 text-on-surface-variant hover:bg-outline-variant"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
