import { useId } from "react";

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({
  label,
  min,
  max,
  step,
  value,
  displayValue,
  onChange,
  disabled,
}: SliderProps) {
  const autoId = useId();
  const sliderId = `slider-${autoId}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={sliderId}
          className="text-sm font-medium text-on-surface disabled:opacity-40"
        >
          {label}
        </label>
        <span className="text-sm font-semibold text-primary tabular-nums">
          {displayValue}
        </span>
      </div>
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={displayValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  );
}
