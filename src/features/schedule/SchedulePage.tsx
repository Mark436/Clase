import { useMemo, useState } from "react";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCurrentTime } from "./hooks/useCurrentTime";
import { MOCK_MEETINGS } from "./mockData";
import { DayNavigation } from "./components/DayNavigation";
import { ScheduleDayView } from "./components/ScheduleDayView";
import { getScheduleForDay, isSameDay } from "./utils";

export function SchedulePage() {
  const now = useCurrentTime();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const dayMeetings = useMemo(
    () => getScheduleForDay(MOCK_MEETINGS, selectedDate),
    [selectedDate],
  );
  const isToday = isSameDay(selectedDate, now);

  return (
    <>
      <PageHeader title="Horario" />
      <Page>
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
      </Page>
    </>
  );
}
