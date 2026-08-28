import type { ReactNode } from "react";
import type { ResolvedMeeting } from "../types";
import { ClassCard } from "./ClassCard";
import type { ClassCardVariant } from "./ClassCard";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { FreeGapCard } from "./FreeGapCard";
import {
  FREE_GAP_MIN_MINUTES,
  formatMinutes,
  freeMinutesBetween,
  getClassProgress,
  getCurrentClass,
  getNextClass,
  getNextClassNote,
  getVisibleClasses,
  minutesOf,
} from "../utils";

interface ScheduleDayViewProps {
  dayMeetings: ResolvedMeeting[];
  now: Date;
  isToday: boolean;
  longPressDurationMs?: number;
  onEditRequest?: (meeting: ResolvedMeeting) => void;
  onSwapToggle?: (meeting: ResolvedMeeting) => void;
}

export function ScheduleDayView({
  dayMeetings,
  now,
  isToday,
  longPressDurationMs,
  onEditRequest,
  onSwapToggle,
}: ScheduleDayViewProps) {
  if (dayMeetings.length === 0) {
    return <EmptyState message="Sin clases este día." />;
  }

  const visible = getVisibleClasses(dayMeetings, now, isToday);
  if (visible.length === 0) {
    return <EmptyState message="No hay más clases hoy." />;
  }

  const minutesNow = minutesOf(now);
  const current = isToday ? getCurrentClass(dayMeetings, now) : null;
  const next = isToday ? getNextClass(dayMeetings, now) : null;

  const items: ReactNode[] = [];
  let indicatorInserted = false;
  let nextAssigned = false;
  let previousMeeting: ResolvedMeeting | undefined;

  for (const meeting of dayMeetings) {
    if (previousMeeting) {
      const free = freeMinutesBetween(
        previousMeeting.endMinutes,
        meeting.startMinutes,
      );
      if (free >= FREE_GAP_MIN_MINUTES) {
        items.push(
          <FreeGapCard
            key={`free-${meeting.clave}-${meeting.weekday}-${meeting.startMinutes}`}
            freeMinutes={free}
          />,
        );
      }
    }

    if (isToday && !indicatorInserted && meeting.endMinutes > minutesNow) {
      items.push(
        <CurrentTimeIndicator
          key={`current-time-${meeting.clave}`}
          timeLabel={formatMinutes(minutesNow)}
        />,
      );
      indicatorInserted = true;
    }

    let variant: ClassCardVariant;
    let progressPercent: number | undefined;
    let note: string | undefined;

    if (isToday && meeting === current) {
      variant = "current";
      progressPercent = getClassProgress(meeting, now).percent;
      note = `Termina en ${getClassProgress(meeting, now).remainingMinutes} min`;
    } else if (!nextAssigned && meeting === next) {
      variant = "next";
      nextAssigned = true;
      note = getNextClassNote(meeting, minutesNow);
    } else if (meeting.endMinutes <= minutesNow && isToday) {
      variant = "past";
    } else {
      variant = "upcoming";
      note = `Empieza a las ${formatMinutes(meeting.startMinutes)}`;
    }

    items.push(
      <ClassCard
        key={`${meeting.clave}-${meeting.weekday}-${meeting.startMinutes}`}
        meeting={meeting}
        variant={variant}
        progressPercent={progressPercent}
        note={note}
        longPressDurationMs={longPressDurationMs}
        onEditRequest={
          onEditRequest ? () => onEditRequest(meeting) : undefined
        }
        onSwapRequest={
          onSwapToggle ? () => onSwapToggle(meeting) : undefined
        }
      />,
    );

    previousMeeting = meeting;
  }

  return (
    <div
      className="flex flex-col gap-3"
      role="list"
      aria-label="Clases del día"
    >
      {items}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-outline-variant">
      <p className="text-sm text-on-surface-variant">{message}</p>
    </div>
  );
}
