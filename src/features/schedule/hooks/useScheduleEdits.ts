import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CustomSubject,
  EditedField,
  MeetingTimeEdit,
  PendingEditConflict,
  ScheduleEdits,
  SubjectFieldEdit,
} from "@/lib/storage/scheduleEditsStore";
import {
  EMPTY_SCHEDULE_EDITS,
  loadScheduleEdits,
  saveScheduleEdits,
} from "@/lib/storage/scheduleEditsStore";
import { mergePendingConflicts } from "../drift";
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
  /** Records fresh raw values as the new baseline and queues any conflicts. */
  registerDrift: (
    conflicts: PendingEditConflict[],
    snapshots: Record<string, string>,
  ) => void;
  /**
   * Settles one pending conflict: `useNewValue` drops the manual override for
   * that field; otherwise the override stays and only the prompt is cleared.
   */
  resolvePendingConflict: (
    clave: string,
    field: EditedField,
    useNewValue: boolean,
  ) => void;
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
        timeEdits,
      });
    },
    [commit],
  );

  const registerDrift = useCallback(
    (conflicts: PendingEditConflict[], snapshots: Record<string, string>) => {
      commit({
        ...ref.current,
        fieldSnapshots: snapshots,
        pendingConflicts: mergePendingConflicts(
          ref.current.pendingConflicts,
          conflicts,
        ),
      });
    },
    [commit],
  );

  const resolvePendingConflict = useCallback(
    (clave: string, field: EditedField, useNewValue: boolean) => {
      const pendingConflicts = ref.current.pendingConflicts.filter(
        (pending) =>
          !(pending.clave === clave && pending.field === field),
      );

      let fieldEdits = ref.current.fieldEdits;
      if (useNewValue) {
        const edit = fieldEdits[clave];
        if (edit !== undefined) {
          const nextEdit = { ...edit };
          delete nextEdit[field];
          fieldEdits = { ...fieldEdits };
          if (Object.keys(nextEdit).length === 0) {
            delete fieldEdits[clave];
          } else {
            fieldEdits[clave] = nextEdit;
          }
        }
      }

      commit({ ...ref.current, fieldEdits, pendingConflicts });
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
    registerDrift,
    resolvePendingConflict,
  };
}
