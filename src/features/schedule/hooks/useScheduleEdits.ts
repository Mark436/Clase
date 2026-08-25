import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CustomSubject,
  MeetingTimeEdit,
  ScheduleEdits,
  SubjectFieldEdit,
} from "@/lib/storage/scheduleEditsStore";
import {
  EMPTY_SCHEDULE_EDITS,
  loadScheduleEdits,
  saveScheduleEdits,
} from "@/lib/storage/scheduleEditsStore";
import { timeEditKey } from "../edits";

export interface ScheduleEditsController {
  edits: ScheduleEdits;
  loaded: boolean;
  setFieldEdit: (clave: string, edit: SubjectFieldEdit) => void;
  setTimeEdit: (
    clave: string,
    weekday: number,
    time: MeetingTimeEdit | null,
  ) => void;
  addCustomSubject: (subject: CustomSubject) => void;
  removeCustomSubject: (clave: string) => void;
  setWeeklyPreference: (groupKey: string, clave: string | null) => void;
}

// Persistence is fire-and-forget: state updates optimistically and a storage
// failure never blocks the UI (mirrors the session persistence pattern).
export function useScheduleEdits(): ScheduleEditsController {
  const [edits, setEdits] = useState<ScheduleEdits>(EMPTY_SCHEDULE_EDITS);
  const [loaded, setLoaded] = useState(false);
  // Mirror for synchronous reads so consecutive mutations never race the
  // async state commit.
  const ref = useRef<ScheduleEdits>(EMPTY_SCHEDULE_EDITS);

  useEffect(() => {
    let cancelled = false;

    void loadScheduleEdits().then((loadedEdits) => {
      if (cancelled) return;
      ref.current = loadedEdits;
      setEdits(loadedEdits);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: ScheduleEdits) => {
    ref.current = next;
    setEdits(next);
    void saveScheduleEdits(next).catch((error: unknown) => {
      console.warn("No se pudieron guardar los cambios del horario.", error);
    });
  }, []);

  const setFieldEdit = useCallback(
    (clave: string, edit: SubjectFieldEdit) => {
      const fieldEdits = { ...ref.current.fieldEdits };
      // Empty fields mean "keep the original": only non-empty values persist.
      const clean: SubjectFieldEdit = {};
      if (edit.subjectName?.trim()) clean.subjectName = edit.subjectName.trim();
      if (edit.professor?.trim()) clean.professor = edit.professor.trim();
      if (edit.classroom?.trim()) clean.classroom = edit.classroom.trim();

      if (Object.keys(clean).length === 0) {
        delete fieldEdits[clave];
      } else {
        fieldEdits[clave] = clean;
      }
      commit({ ...ref.current, fieldEdits });
    },
    [commit],
  );

  const setTimeEdit = useCallback(
    (clave: string, weekday: number, time: MeetingTimeEdit | null) => {
      const timeEdits = { ...ref.current.timeEdits };
      const key = timeEditKey(clave, weekday);
      if (time === null || time.startMinutes >= time.endMinutes) {
        delete timeEdits[key];
      } else {
        timeEdits[key] = { startMinutes: time.startMinutes, endMinutes: time.endMinutes };
      }
      commit({ ...ref.current, timeEdits });
    },
    [commit],
  );

  const addCustomSubject = useCallback(
    (subject: CustomSubject) => {
      if (subject.slots.length === 0) return;
      commit({
        ...ref.current,
        customSubjects: [...ref.current.customSubjects, subject],
      });
    },
    [commit],
  );

  const removeCustomSubject = useCallback(
    (clave: string) => {
      const prefix = `${clave}|`;
      const timeEdits = Object.fromEntries(
        Object.entries(ref.current.timeEdits).filter(
          ([key]) => !key.startsWith(prefix),
        ),
      );
      commit({
        ...ref.current,
        customSubjects: ref.current.customSubjects.filter(
          (subject) => subject.clave !== clave,
        ),
        conflictOverrides: Object.fromEntries(
          Object.entries(ref.current.conflictOverrides).filter(
            ([key, value]) => value !== clave && key.split("|").includes(clave) === false,
          ),
        ),
        timeEdits,
      });
    },
    [commit],
  );

  const setWeeklyPreference = useCallback(
    (groupKey: string, clave: string | null) => {
      const conflictOverrides = { ...ref.current.conflictOverrides };
      if (clave === null) {
        delete conflictOverrides[groupKey];
      } else {
        conflictOverrides[groupKey] = clave;
      }
      commit({ ...ref.current, conflictOverrides });
    },
    [commit],
  );

  return {
    edits,
    loaded,
    setFieldEdit,
    setTimeEdit,
    addCustomSubject,
    removeCustomSubject,
    setWeeklyPreference,
  };
}
