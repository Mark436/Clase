import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { addDays, isSameDay } from "../utils";

interface DayNavigationProps {
  selectedDate: Date;
  now: Date;
  onSelectDate: (date: Date) => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function DayNavigation({
  selectedDate,
  now,
  onSelectDate,
}: DayNavigationProps) {
  const isToday = isSameDay(selectedDate, now);
  const label = capitalize(DATE_FORMATTER.format(selectedDate));

  return (
    <div className="flex items-center gap-1">
      <NavButton
        label="Día anterior"
        onClick={() => onSelectDate(addDays(selectedDate, -1))}
      >
        <ChevronLeftIcon size={20} />
      </NavButton>

      <p
        aria-live="polite"
        className="flex-1 text-center text-sm font-semibold capitalize text-on-surface"
      >
        {label}
      </p>

      {!isToday ? (
        <button
          type="button"
          onClick={() => onSelectDate(new Date())}
          className="h-10 rounded-full px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-container/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Hoy
        </button>
      ) : null}

      <NavButton
        label="Día siguiente"
        onClick={() => onSelectDate(addDays(selectedDate, 1))}
      >
        <ChevronRightIcon size={20} />
      </NavButton>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-primary-container/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
