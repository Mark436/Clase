import type { CSSProperties } from "react";
import { useLongPress } from "../hooks/useLongPress";
import { PencilIcon } from "@/components/ui/icons";
import type { ResolvedMeeting } from "../types";
import { formatMinutes } from "../utils";

export type ClassCardVariant = "current" | "next" | "upcoming" | "past";

interface ClassCardProps {
  meeting: ResolvedMeeting;
  variant: ClassCardVariant;
  /** For the current class only: drives the border progress ring. */
  progressPercent?: number;
  /** Hold-to-edit gesture; undefined disables it. */
  longPressDurationMs?: number;
  onEditRequest?: () => void;
  /** Cycles the conflict swap: day → week → default. */
  onSwapRequest?: () => void;
}

const CONTAINER_CLASSES: Record<ClassCardVariant, string> = {
  current: "bg-surface ring-outline-variant elevated",
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
  longPressDurationMs,
  onEditRequest,
  onSwapRequest,
}: ClassCardProps) {
  const isCurrent = variant === "current";
  const hasRingProgress = isCurrent && progressPercent !== undefined;
  const longPress = useLongPress({
    durationMs: longPressDurationMs ?? 0,
    onLongPress: () => onEditRequest?.(),
  });

  return (
    <article
      className={`relative rounded-2xl p-4 shadow-sm ring-1 select-none ${
        CONTAINER_CLASSES[variant]
      } ${hasRingProgress ? "studia-ring-progress" : ""}`}
      style={
        hasRingProgress
          ? ({ "--p": progressPercent } as CSSProperties)
          : undefined
      }
      {...(onEditRequest ? longPress : {})}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 font-display font-bold text-on-surface">
          {meeting.subjectName}
        </h3>
        <span className="shrink-0 text-sm tabular-nums">
          <span className="font-semibold text-on-surface">
            {formatMinutes(meeting.startMinutes)}
          </span>
          {" – "}
          <span className="text-on-surface-variant">
            {formatMinutes(meeting.endMinutes)}
          </span>
        </span>
        {onEditRequest ? (
          <button
            type="button"
            onClick={onEditRequest}
            aria-label={`Editar ${meeting.subjectName}`}
            className="-my-1 shrink-0 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-primary-container/50 hover:text-on-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <PencilIcon size={16} />
          </button>
        ) : null}
      </div>

      <div className="mt-1 flex flex-col gap-0.5 text-sm text-on-surface-variant">
        {meeting.classroom ? <p>Salón {meeting.classroom}</p> : null}
        {meeting.professor ? <p>{meeting.professor}</p> : null}
      </div>

      {meeting.conflicts?.length && onSwapRequest ? (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onSwapRequest}
            aria-label={`Ver ${meeting.conflicts
              .map((conflict) => conflict.subjectName)
              .join(" o ")} en lugar de ${meeting.subjectName}`}
            title="Toca para alternar el orden: una vez solo hoy, dos veces toda la semana"
            className="ml-auto rounded-lg px-1.5 py-0.5 text-xs font-semibold text-error underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            {meeting.swapped ? "↔ " : ""}
            {conflictLabel(meeting.conflicts)}
          </button>
        </div>
      ) : null}
    </article>
  );
}
