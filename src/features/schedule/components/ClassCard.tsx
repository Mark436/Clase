import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ClassMeeting } from "../types";
import { formatMinutes } from "../utils";

export type ClassCardVariant = "current" | "next" | "upcoming" | "past";

interface ClassCardProps {
  meeting: ClassMeeting;
  variant: ClassCardVariant;
  progressPercent?: number;
  note?: string;
}

const CONTAINER_CLASSES: Record<ClassCardVariant, string> = {
  current: "bg-primary-container ring-primary",
  next: "bg-surface ring-outline-variant",
  upcoming: "bg-surface ring-outline-variant",
  past: "bg-surface ring-outline-variant opacity-70",
};

export function ClassCard({
  meeting,
  variant,
  progressPercent,
  note,
}: ClassCardProps) {
  const isCurrent = variant === "current";

  return (
    <article
      className={`rounded-2xl p-4 shadow-sm ring-1 ${
        CONTAINER_CLASSES[variant]
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={`font-semibold ${
            isCurrent ? "text-on-primary-container" : "text-on-surface"
          }`}
        >
          {meeting.subjectName}
        </h3>
        <span
          className={`shrink-0 text-sm tabular-nums ${
            isCurrent ? "text-on-primary-container/80" : "text-on-surface-variant"
          }`}
        >
          {formatMinutes(meeting.startMinutes)} –{" "}
          {formatMinutes(meeting.endMinutes)}
        </span>
      </div>

      <div
        className={`mt-1 flex flex-col gap-0.5 text-sm ${
          isCurrent ? "text-on-primary-container/80" : "text-on-surface-variant"
        }`}
      >
        {meeting.group ? <p>Grupo {meeting.group}</p> : null}
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
          <Badge>En curso</Badge>
        ) : null}
        {variant === "next" ? <Badge>Siguiente</Badge> : null}
        {note ? (
          <p
            className={`text-xs font-medium ${
              isCurrent ? "text-on-primary-container/80" : "text-primary"
            }`}
          >
            {note}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-on-primary">
      {children}
    </span>
  );
}
