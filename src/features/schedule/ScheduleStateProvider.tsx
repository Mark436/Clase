import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Alumno } from "@/lib/api/client";
import { applyScheduleEdits } from "./edits";
import { mapHorario } from "./mapHorario";
import { resolveConflicts } from "./conflicts";
import { useScheduleEdits } from "./hooks/useScheduleEdits";
import { ScheduleStateContext } from "./scheduleStateContext";

interface ScheduleStateProviderProps {
  alumno: Alumno | null;
  children: ReactNode;
}

export function ScheduleStateProvider({
  alumno,
  children,
}: ScheduleStateProviderProps) {
  const scheduleEdits = useScheduleEdits();
  const [daySwaps, setDaySwaps] = useState<Record<string, string>>({});

  const weekMeetings = useMemo(
    () =>
      alumno && scheduleEdits.loaded
        ? applyScheduleEdits(
            mapHorario(alumno.horario, alumno.boleta),
            scheduleEdits.edits,
          )
        : [],
    [alumno, scheduleEdits.loaded, scheduleEdits.edits],
  );

  // Deterministic resolution: one card per conflicting interval, honoring
  // weekly preferences and this-session day swaps.
  const resolvedWeek = useMemo(
    () =>
      resolveConflicts(weekMeetings, {
        weekly: scheduleEdits.edits.conflictOverrides,
        daily: daySwaps,
      }),
    [weekMeetings, scheduleEdits.edits.conflictOverrides, daySwaps],
  );

  return (
    <ScheduleStateContext
      value={{
        edits: scheduleEdits,
        daySwaps,
        setDaySwaps,
        resolvedWeek,
      }}
    >
      {children}
    </ScheduleStateContext>
  );
}
