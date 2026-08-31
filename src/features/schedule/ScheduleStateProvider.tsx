import { useMemo } from "react";
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

  // Deterministic resolution: every overlapping member becomes its own card
  // carrying an "Encimada …" note.
  const resolvedWeek = useMemo(
    () => resolveConflicts(weekMeetings),
    [weekMeetings],
  );

  return (
    <ScheduleStateContext
      value={{
        edits: scheduleEdits,
        resolvedWeek,
      }}
    >
      {children}
    </ScheduleStateContext>
  );
}
