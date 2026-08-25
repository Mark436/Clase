import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ResolvedMeeting } from "./types";
import type { ScheduleEditsController } from "./hooks/useScheduleEdits";

// Single source of truth for the edited/resolved week schedule. Lives at the
// authenticated-shell level so the persistent context capsule and the
// schedule page read the exact same data without duplicate persistence loads.
export interface ScheduleStateValue {
  edits: ScheduleEditsController;
  /** Session-only conflict swap preferences ("solo hoy"). */
  daySwaps: Record<string, string>;
  setDaySwaps: Dispatch<SetStateAction<Record<string, string>>>;
  resolvedWeek: ResolvedMeeting[];
}

export const ScheduleStateContext = createContext<ScheduleStateValue | null>(
  null,
);

export function useScheduleState(): ScheduleStateValue {
  const value = useContext(ScheduleStateContext);
  if (value === null) {
    throw new Error(
      "useScheduleState debe usarse dentro de ScheduleStateProvider.",
    );
  }
  return value;
}
