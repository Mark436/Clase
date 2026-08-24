import type { ReactNode } from "react";
import type { ClassMeeting } from "../types";
import {
  formatMinutes,
  getClassProgress,
  getCurrentClass,
  getNextClass,
  getVisibleClasses,
  minutesOf,
} from "../utils";
import { ClassCard } from "./ClassCard";
import type { ClassCardVariant } from "./ClassCard";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";

interface ScheduleDayViewProps {
  dayMeetings: ClassMeeting[];
  now: Date;
  isToday: boolean;
}

export function ScheduleDayView({
  dayMeetings,
  now,
  isToday,
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

  for (const meeting of dayMeetings) {
    if (isToday && !indicatorInserted && meeting.endMinutes > minutesNow) {
      items.push(
        <CurrentTimeIndicator
          key="current-time"
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
      const startsIn = meeting.startMinutes - minutesNow;
      note =
        startsIn > 0
          ? `${Math.floor(startsIn / 60)} ${Math.floor(startsIn / 60) === 1 ? "hr" : "hrs"} y ${startsIn % 60} min`
          : `Empieza a las ${formatMinutes(meeting.startMinutes)}`;
    } else if (meeting.endMinutes <= minutesNow && isToday) {
      variant = "past";
    } else {
      variant = "upcoming";
      note = `Empieza a las ${formatMinutes(meeting.startMinutes)}`;
    }

    items.push(
      <ClassCard
        key={`${meeting.subjectName}-${meeting.startMinutes}`}
        meeting={meeting}
        variant={variant}
        progressPercent={progressPercent}
        note={note}
      />,
    );
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
