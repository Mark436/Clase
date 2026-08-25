import { useCallback, useEffect, useMemo, useState } from "react";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import { getNow } from "@/lib/devtools/clock";
import { useCurrentTime } from "@/lib/devtools/useCurrentTime";
import type { Alumno } from "@/lib/api/client";
import { CUSTOM_CLAVE_PREFIX } from "@/lib/storage/scheduleEditsStore";
import type { ResolvedMeeting } from "./types";
import { applyScheduleEdits, isCustomClave } from "./edits";
import {
  dailySwapKey,
  resolveConflicts,
} from "./conflicts";
import { mapHorario } from "./mapHorario";
import { useScheduleEdits } from "./hooks/useScheduleEdits";
import { DayNavigation } from "./components/DayNavigation";
import { ScheduleDayView } from "./components/ScheduleDayView";
import { SubjectEditorSheet } from "./components/SubjectEditorSheet";
import type { SubjectEditorSubmit } from "./components/SubjectEditorSheet";
import { getScheduleForDay, isSameDay } from "./utils";

interface SchedulePageProps {
  alumno: Alumno | null;
  /** Hold time before long-press opens the editor (dev-configurable). */
  longPressDurationMs?: number;
}

type EditorState =
  | { mode: "closed" }
  | { mode: "edit"; meeting: ResolvedMeeting }
  | { mode: "create" };

export function SchedulePage({
  alumno,
  longPressDurationMs,
}: SchedulePageProps) {
  const now = useCurrentTime();
  const [selectedDate, setSelectedDate] = useState<Date>(() => getNow());
  const scheduleEdits = useScheduleEdits();
  const [daySwaps, setDaySwaps] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

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
    [daySwaps, scheduleEdits],
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
      <PageHeader title="Horario" />
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
              <Button
                variant="ghost"
                onClick={() => setEditor({ mode: "create" })}
                className="h-9 px-3 text-xs"
              >
                <PlusIcon size={16} />
                Agregar materia
              </Button>
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
    </>
  );
}
