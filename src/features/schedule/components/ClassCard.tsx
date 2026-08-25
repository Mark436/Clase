import { useLongPress } from "../hooks/useLongPress";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { PencilIcon } from "@/components/ui/icons";
import type { ResolvedMeeting } from "../types";
import { formatMinutes } from "../utils";

export type ClassCardVariant = "current" | "next" | "upcoming" | "past";

interface ClassCardProps {
  meeting: ResolvedMeeting;
  variant: ClassCardVariant;
  progressPercent?: number;
  note?: string;
  /** Hold-to-edit gesture; undefined disables it. */
  longPressDurationMs?: number;
  onEditRequest?: () => void;
  /** Cycles the conflict swap: day → week → default. */
  onSwapRequest?: () => void;
}

const CONTAINER_CLASSES: Record<ClassCardVariant, string> = {
  current: "bg-primary text-on-primary ring-primary elevated",
  next: "bg-surface ring-primary/35 elevated",
  upcoming: "bg-surface ring-outline-variant",
  past: "bg-surface ring-outline-variant opacity-70",
};

function conflictLabel(
  conflicts: NonNullable<ResolvedMeeting["conflicts"]>,
): string {
  return conflicts
    .map((conflict) =>
      conflict.portionLabel === ""
        ? conflict.subjectName
        : `${conflict.portionLabel} ${conflict.subjectName}`,
    )
    .join(" · ");
}

export function ClassCard({
  meeting,
  variant,
  progressPercent,
  note,
  longPressDurationMs,
  onEditRequest,
  onSwapRequest,
}: ClassCardProps) {
  const isCurrent = variant === "current";
  const longPress = useLongPress({
    durationMs: longPressDurationMs ?? 0,
    onLongPress: () => onEditRequest?.(),
  });

  return (
    <article
      className={`relative rounded-2xl p-4 shadow-sm ring-1 select-none ${
        CONTAINER_CLASSES[variant]
      }`}
      {...(onEditRequest ? longPress : {})}
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          className={`min-w-0 font-display font-bold ${
            isCurrent ? "text-on-primary" : "text-on-surface"
          }`}
        >
          {meeting.subjectName}
        </h3>
        <span
          className={`shrink-0 text-sm tabular-nums ${
            isCurrent ? "text-on-primary/85" : "text-on-surface-variant"
          }`}
        >
          {formatMinutes(meeting.startMinutes)} –{" "}
          {formatMinutes(meeting.endMinutes)}
        </span>
        {onEditRequest ? (
          <button
            type="button"
            onClick={onEditRequest}
            aria-label={`Editar ${meeting.subjectName}`}
            className={`-my-1 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-primary-container/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${
              isCurrent
                ? "text-on-primary/80 hover:text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <PencilIcon size={16} />
          </button>
        ) : null}
      </div>

      <div
        className={`mt-1 flex flex-col gap-0.5 text-sm ${
          isCurrent ? "text-on-primary/85" : "text-on-surface-variant"
        }`}
      >
        {meeting.classroom ? <p>Salón {meeting.classroom}</p> : null}
        {meeting.professor ? <p>{meeting.professor}</p> : null}
      </div>

      {isCurrent && progressPercent !== undefined ? (
        <ProgressBar
          value={progressPercent}
          label={`Progreso de ${meeting.subjectName}`}
          className="mt-3"
        />
      ) : null}

      <div className="mt-2 flex items-center gap-2">
        {variant === "current" ? (
          <Badge className="bg-white/20 text-on-primary">En curso</Badge>
        ) : null}
        {variant === "next" ? <Badge variant="primary">Siguiente</Badge> : null}
        {note ? (
          <p
            className={`text-xs font-medium ${
              isCurrent ? "text-on-primary/90" : "text-primary-strong"
            }`}
          >
            {note}
          </p>
        ) : null}
        {meeting.conflicts?.length && onSwapRequest ? (
          <button
            type="button"
            onClick={onSwapRequest}
            aria-label={`Ver ${meeting.conflicts
              .map((conflict) => conflict.subjectName)
              .join(" o ")} en lugar de ${meeting.subjectName}`}
            title="Toca para alternar el orden: una vez solo hoy, dos veces toda la semana"
            className={`ml-auto rounded-lg px-1.5 py-0.5 text-xs font-semibold underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${
              isCurrent ? "text-on-primary/90" : "text-error"
            }`}
          >
            {meeting.swapped ? "↔ " : ""}
            {conflictLabel(meeting.conflicts)}
          </button>
        ) : null}
      </div>
    </article>
  );
}
