interface CurrentTimeIndicatorProps {
  timeLabel: string;
}

export function CurrentTimeIndicator({ timeLabel }: CurrentTimeIndicatorProps) {
  return (
    <div aria-hidden="true" className="flex items-center gap-2 py-0.5 pl-1">
      <span className="text-xs font-semibold tabular-nums text-primary">
        {timeLabel}
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="h-px flex-1 bg-primary/50" />
    </div>
  );
}
