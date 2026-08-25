import { useCallback, useEffect, useMemo, useState } from "react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { PlusIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import type { ToastVariant } from "@/components/ui/toastVariants";
import { getNow } from "@/lib/devtools/clock";
import { useCurrentTime } from "@/lib/devtools/useCurrentTime";
import type { Alumno } from "@/lib/api/client";
import { CUSTOM_CLAVE_PREFIX } from "@/lib/storage/scheduleEditsStore";
import type { EditedField } from "@/lib/storage/scheduleEditsStore";
import { SUBJECT_ADDED_TOAST } from "@/lib/toastMessages";
import type { ResolvedMeeting } from "./types";
import { isCustomClave } from "./edits";
import {
  collectSubjectFields,
  detectManualEditConflicts,
  sameStringMap,
} from "./drift";
import { dailySwapKey } from "./conflicts";
import { mapHorario } from "./mapHorario";
import { useScheduleState } from "./scheduleStateContext";
import { DayNavigation } from "./components/DayNavigation";
import { ScheduleDayView } from "./components/ScheduleDayView";
import { SubjectEditorSheet } from "./components/SubjectEditorSheet";
import type { SubjectEditorSubmit } from "./components/SubjectEditorSheet";
import { EditConflictsSheet } from "./components/EditConflictsSheet";
import { dateForWeekday, getScheduleForDay, isSameDay } from "./utils";

interface SchedulePageProps {
  alumno: Alumno | null;
  /** Hold time before long-press opens the editor (dev-configurable). */
  longPressDurationMs?: number;
  /** True while dev simulation feeds the screens: drift detection pauses. */
  simulated?: boolean;
  onShowToast?: (message: string, variant: ToastVariant) => void;
}

type EditorState =
  | { mode: "closed" }
  | { mode: "edit"; meeting: ResolvedMeeting }
  | { mode: "create" };

export function SchedulePage({
  alumno,
  longPressDurationMs,
  simulated = false,
  onShowToast,
}: SchedulePageProps) {
  const now = useCurrentTime();
  const { edits: scheduleEdits, daySwaps, setDaySwaps, resolvedWeek } =
    useScheduleState();
  const [selectedDate, setSelectedDate] = useState<Date>(() => getNow());
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

  const dayMeetings = useMemo(
    () => getScheduleForDay(resolvedWeek, selectedDate),
    [resolvedWeek, selectedDate],
  );

  const isToday = isSameDay(selectedDate, now);

  const { loaded: editsLoaded, edits, setWeeklyPreference } = scheduleEdits;

  // Conflicts can disappear after edits; stale weekly preferences are pruned
  // so removing an overlap always restores the default order (§12).
  useEffect(() => {
    if (!editsLoaded) return;

    const validKeys = new Set(
      resolvedWeek
        .map((meeting) => meeting.conflictKey)
        .filter((key): key is string => key !== undefined),
    );
    const staleKeys = Object.keys(edits.conflictOverrides).filter(
      (key) => !validKeys.has(key),
    );

    for (const key of staleKeys) {
      setWeeklyPreference(key, null);
    }
  }, [resolvedWeek, editsLoaded, edits.conflictOverrides, setWeeklyPreference]);

  // Manual-edit drift: after each real fetch, compare the fresh raw values
  // against the stored baseline. School changes colliding with a live manual
  // override become pending conflicts the user must settle. Paused while dev
  // simulation feeds the screens so virtual data never pollutes baselines.
  const { registerDrift } = scheduleEdits;
  useEffect(() => {
    if (simulated || !alumno || !editsLoaded) return;

    const rawFields = collectSubjectFields(
      mapHorario(alumno.horario, alumno.boleta),
    );
    const conflicts = detectManualEditConflicts(
      rawFields,
      edits.fieldSnapshots,
      edits.fieldEdits,
    );
    const snapshotsChanged = !sameStringMap(rawFields, edits.fieldSnapshots);

    if (conflicts.length > 0 || snapshotsChanged) {
      registerDrift(conflicts, rawFields);
    }
  }, [
    alumno,
    simulated,
    editsLoaded,
    edits.fieldSnapshots,
    edits.fieldEdits,
    registerDrift,
  ]);

  function handleResolveConflict(
    clave: string,
    field: EditedField,
    useNewValue: boolean,
  ) {
    scheduleEdits.resolvePendingConflict(clave, field, useNewValue);
  }

  const subjectNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const meeting of resolvedWeek) {
      if (names[meeting.clave] === undefined) {
        names[meeting.clave] = meeting.subjectName;
      }
    }
    return names;
  }, [resolvedWeek]);

  const handleSwapToggle = useCallback(
    (target: ResolvedMeeting) => {
      if (target.conflictKey === undefined || !target.conflicts?.length) return;

      const key = target.conflictKey;
      const dKey = dailySwapKey(key, target.weekday);
      const dailyClave = daySwaps[dKey];
      const weeklyClave = scheduleEdits.edits.conflictOverrides[key];

      if (dailyClave !== undefined) {
        // Second tap: promote the choice to every occurrence of the conflict.
        setDaySwaps((previous) => {
          const next = { ...previous };
          delete next[dKey];
          return next;
        });
        scheduleEdits.setWeeklyPreference(key, dailyClave);
        return;
      }

      if (weeklyClave !== undefined) {
        // Already swapped for the whole week: reset to the default order.
        scheduleEdits.setWeeklyPreference(key, null);
        return;
      }

      // First tap: swap just for this day (ephemeral).
      const displaced = target.conflicts[0];
      if (displaced !== undefined) {
        setDaySwaps((previous) => ({ ...previous, [dKey]: displaced.clave }));
      }
    },
    [daySwaps, scheduleEdits, setDaySwaps],
  );

  function handleEditorSubmit(submit: SubjectEditorSubmit) {
    if (editor.mode === "edit") {
      const meeting = editor.meeting;
      scheduleEdits.setFieldEdit(meeting.clave, {
        subjectName: submit.subjectName,
        professor: submit.professor,
        classroom: submit.classroom,
      });
      const timesChanged =
        submit.startMinutes !== meeting.startMinutes ||
        submit.endMinutes !== meeting.endMinutes;
      scheduleEdits.setTimeEdit(
        meeting.clave,
        meeting.weekday,
        timesChanged
          ? { startMinutes: submit.startMinutes, endMinutes: submit.endMinutes }
          : null,
      );
    } else {
      scheduleEdits.addCustomSubject({
        clave: `${CUSTOM_CLAVE_PREFIX}${Date.now().toString(36)}`,
        subjectName: submit.subjectName,
        classroom: submit.classroom,
        professor: submit.professor,
        slots: submit.days.map((weekday) => ({
          weekday,
          startMinutes: submit.startMinutes,
          endMinutes: submit.endMinutes,
        })),
      });
      // Jump to the first scheduled day so the new subject is visible
      // immediately, even when it does not meet today.
      const firstDay = Math.min(...submit.days);
      setSelectedDate(dateForWeekday(now, firstDay));
      onShowToast?.(SUBJECT_ADDED_TOAST, "success");
    }
    setEditor({ mode: "closed" });
  }

  function handleRemoveSubject() {
    if (editor.mode !== "edit") return;
    if (!isCustomClave(editor.meeting.clave)) return;
    scheduleEdits.removeCustomSubject(editor.meeting.clave);
    setEditor({ mode: "closed" });
  }

  return (
    <>
      <Page>
        {!alumno ? (
          <Card className="py-8 text-center text-sm text-on-surface-variant">
            No hay datos de horario disponibles.
          </Card>
        ) : !scheduleEdits.loaded ? (
          <div className="flex justify-center py-10">
            <Spinner size={28} className="text-primary" />
          </div>
        ) : (
          <>
            <DayNavigation
              selectedDate={selectedDate}
              now={now}
              onSelectDate={setSelectedDate}
            />
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
                aria-label="Agregar materia"
                title="Agregar materia"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition-colors hover:bg-primary-container/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <PlusIcon size={20} />
              </button>
            </div>
            <ScheduleDayView
              dayMeetings={dayMeetings}
              now={now}
              isToday={isToday}
              longPressDurationMs={longPressDurationMs}
              onEditRequest={(meeting) =>
                setEditor({ mode: "edit", meeting })
              }
              onSwapToggle={handleSwapToggle}
            />
          </>
        )}
      </Page>

      {editor.mode !== "closed" ? (
        <SubjectEditorSheet
          meeting={editor.mode === "edit" ? editor.meeting : null}
          onSubmit={handleEditorSubmit}
          onRemove={
            editor.mode === "edit" && isCustomClave(editor.meeting.clave)
              ? handleRemoveSubject
              : undefined
          }
          onClose={() => setEditor({ mode: "closed" })}
        />
      ) : null}

      {edits.pendingConflicts.length > 0 ? (
        <EditConflictsSheet
          conflicts={edits.pendingConflicts}
          subjectNames={subjectNames}
          onResolve={handleResolveConflict}
          onClose={() => undefined}
        />
      ) : null}
    </>
  );
}
