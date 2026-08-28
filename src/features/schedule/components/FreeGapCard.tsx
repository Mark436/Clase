import { formatFreeDuration } from "../utils";

interface FreeGapCardProps {
  freeMinutes: number;
}

export function FreeGapCard({ freeMinutes }: FreeGapCardProps) {
  return (
    <div className="flex justify-center">
      <span className="rounded-full bg-surface/70 px-3 py-1 text-center text-xs font-medium tabular-nums text-on-surface-variant ring-1 ring-outline-variant/70">
        {formatFreeDuration(freeMinutes)} libres
      </span>
    </div>
  );
}