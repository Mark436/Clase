import { useMemo, useState } from "react";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { getNow } from "@/lib/devtools/clock";
import type { Alumno } from "@/lib/api/client";
import { useCurrentTime } from "./hooks/useCurrentTime";
import { mapHorario } from "./mapHorario";
import { DayNavigation } from "./components/DayNavigation";
import { ScheduleDayView } from "./components/ScheduleDayView";
import { getScheduleForDay, isSameDay } from "./utils";

interface SchedulePageProps {
  alumno: Alumno | null;
}

export function SchedulePage({ alumno }: SchedulePageProps) {
  const now = useCurrentTime();
  const [selectedDate, setSelectedDate] = useState<Date>(() => getNow());

  const weekMeetings = useMemo(
    () => (alumno ? mapHorario(alumno.horario, alumno.boleta) : []),
    [alumno],
  );

  const dayMeetings = useMemo(
    () => getScheduleForDay(weekMeetings, selectedDate),
    [weekMeetings, selectedDate],
  );

  const isToday = isSameDay(selectedDate, now);

  return (
    <>
      <PageHeader title="Horario" />
      <Page>
        {!alumno ? (
          <Card className="py-8 text-center text-sm text-on-surface-variant">
            No hay datos de horario disponibles.
          </Card>
        ) : (
          <>
            <DayNavigation
              selectedDate={selectedDate}
              now={now}
              onSelectDate={setSelectedDate}
            />
            <ScheduleDayView
              dayMeetings={dayMeetings}
              now={now}
              isToday={isToday}
            />
          </>
        )}
      </Page>
    </>
  );
}
