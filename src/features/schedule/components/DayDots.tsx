import { addDays, isSameDay } from "../utils";

interface DayDotsProps {
  selectedDate: Date;
  now: Date;
  onSelectDate: (date: Date) => void;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
});
const DATE_FORMATTER = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/**
 * Infinite day navigation rendered as three dots: [previous, selected, next].
 * The window always centers the selected day, so swiping or tapping a dot
 * moves the whole window (the center becomes the newly chosen day).
 */
export function DayDots({
  selectedDate,
  now,
  onSelectDate,
}: DayDotsProps) {
  const days = [-1, 0, 1].map((offset) => addDays(selectedDate, offset));

  return (
    <div
      className="flex items-center justify-center gap-3"
      role="group"
      aria-label="Cambiar día del horario"
    >
      {days.map((date, index) => {
        const isSelected = index === 1;
        const isToday = isSameDay(date, now);
        const ariaLabel = formatAria(date, isSelected, isToday);
        return (
          <button
            key={date.toDateString()}
            type="button"
            aria-label={ariaLabel}
            aria-pressed={isSelected}
            onClick={() => onSelectDate(date)}
            className={`flex h-12 w-12 flex-col items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              isSelected
                ? "bg-primary text-on-primary"
                : "bg-primary-container/60 text-on-surface-variant hover:bg-primary-container"
            }`}
          >
            <span className="text-[10px] font-semibold uppercase leading-none">
              {weekdayShort(date)}
            </span>
            <span className="text-base font-bold leading-tight tabular-nums">
              {date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function weekdayShort(date: Date): string {
  return capitalize(WEEKDAY_FORMATTER.format(date).replace(".", ""));
}

function formatAria(date: Date, isSelected: boolean, isToday: boolean): string {
  const label = capitalize(DATE_FORMATTER.format(date));
  const todayNote = isToday ? " hoy" : "";
  return isSelected
    ? `${label}, día seleccionado${todayNote}.`
    : `${label}${todayNote}. Toque para ver este día.`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
