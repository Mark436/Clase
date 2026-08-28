import { useEffect, useRef, useState } from "react";
import { Capsule } from "@/components/ui/Capsule";
import type { CapsuleVariant } from "@/components/ui/Capsule";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CapsuleNotification } from "@/lib/notifications/capsuleEvents";
import type { ResolvedMeeting } from "../types";
import {
  autoCapsuleEvent,
  buildCapsuleState,
  toCapsuleTick,
} from "../capsuleState";
import type { UpcomingClassInfo } from "../capsuleState";
import {
  formatRelativeTime,
  formatTomorrowCapsuleLabel,
  minutesOf,
} from "../utils";

interface ScheduleCapsuleProps {
  meetings: readonly ResolvedMeeting[];
  /** Real clock instant driving every state (dev simulation included). */
  now: Date;
  /** First class of tomorrow, shown once today is over (or empty). */
  tomorrowFirst?: UpcomingClassInfo | null;
  /** Transient event (new grade, debt…) flashed before returning to classes. */
  notification?: CapsuleNotification | null;
  variant: CapsuleVariant;
  autoCollapseMs: number;
}

const DETAIL_STAGE_MS = 2200;
const FLASH_TOTAL_MS = 4200;

type FlashStage = "detail" | "followup" | null;

export function ScheduleCapsule({
  meetings,
  now,
  tomorrowFirst = null,
  notification = null,
  variant,
  autoCollapseMs,
}: ScheduleCapsuleProps) {
  const state = buildCapsuleState(meetings, minutesOf(now));

  // Important-event detection across minute ticks. Each event id fires once;
  // the first observation is silent by design (see capsuleState.ts).
  const previousTickRef = useRef<ReturnType<typeof toCapsuleTick> | null>(null);
  const firedEventsRef = useRef<Set<string>>(new Set());
  const [pulseKey, setPulseKey] = useState<string>("");

  const currentTick = toCapsuleTick(state);
  useEffect(() => {
    const event = autoCapsuleEvent(previousTickRef.current, currentTick);
    previousTickRef.current = currentTick;

    if (event === null) return;

    const eventKey = `${event}:${currentTick.clave ?? ""}`;
    if (firedEventsRef.current.has(eventKey)) return;

    firedEventsRef.current.add(eventKey);
    setPulseKey(`${eventKey}:${Date.now()}`);
  }, [currentTick]);

  // Notification sequence: detail first ("Redes · 9.5"), then the follow-up
  // ("Promedio del periodo · 8.75"), then back to classes.
  const [flashStage, setFlashStage] = useState<FlashStage>(null);
  const flashTimersRef = useRef<number[]>([]);

  useEffect(() => {
    for (const timer of flashTimersRef.current) window.clearTimeout(timer);
    flashTimersRef.current = [];

    if (notification === null) {
      setFlashStage(null);
      return;
    }

    setFlashStage("detail");
    flashTimersRef.current.push(
      window.setTimeout(() => setFlashStage("followup"), DETAIL_STAGE_MS),
      window.setTimeout(() => setFlashStage(null), FLASH_TOTAL_MS),
    );

    return () => {
      for (const timer of flashTimersRef.current) window.clearTimeout(timer);
      flashTimersRef.current = [];
    };
  }, [notification]);

  const flashing = flashStage !== null && notification !== null;
  const effectivePulse =
    notification !== null
      ? `flash:${notification.id}`
      : pulseKey === ""
        ? undefined
        : pulseKey;
  const effectiveCollapseMs = flashing ? FLASH_TOTAL_MS : autoCollapseMs;

  if (flashing && notification) {
    return (
      <Capsule
        variant={variant}
        autoCollapseMs={effectiveCollapseMs}
        pulseKey={effectivePulse}
        ariaLabel={`${notification.title}${notification.detail ? `: ${notification.detail}` : ""}`}
        minimized={
          <>
            <span className="text-sm font-semibold text-on-surface">
              {notification.title}
            </span>
            <span className="max-w-32 truncate text-sm font-medium tabular-nums text-primary-strong">
              {(flashStage === "followup"
                ? notification.followUpDetail
                : notification.detail) ?? ""}
            </span>
          </>
        }
        expanded={
          flashStage === "followup" && notification.followUpTitle ? (
            <>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                {notification.followUpTitle}
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-primary-strong">
                {notification.followUpDetail ?? ""}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                {notification.title}
              </span>
              {notification.detail ? (
                <span className="font-display text-xl font-bold leading-tight text-on-surface">
                  {notification.detail}
                </span>
              ) : null}
            </>
          )
        }
      />
    );
  }

  if (state.kind === "empty" || state.kind === "done") {
    const message =
      state.kind === "empty" ? "Sin clases hoy" : "Por hoy terminaste";
    const tomorrowLabel = tomorrowFirst
      ? formatTomorrowCapsuleLabel(
          tomorrowFirst.startsAt,
          now,
          tomorrowFirst.startsLabel,
        )
      : undefined;
    const hoursOnly = state.kind === "done" && tomorrowLabel !== undefined;
    return (
      <Capsule
        variant={variant}
        autoCollapseMs={autoCollapseMs}
        pulseKey={effectivePulse}
        ariaLabel={
          tomorrowFirst
            ? `${message}. Mañana: ${tomorrowFirst.subjectName} a las ${tomorrowFirst.startsLabel}`
            : message
        }
        minimized={
          hoursOnly ? (
            <span className="text-sm font-semibold tabular-nums text-primary-strong">
              {tomorrowLabel}
            </span>
          ) : (
            <>
              <span className="text-sm font-medium text-on-surface-variant">
                {message}
              </span>
              {tomorrowLabel !== undefined ? (
                <span className="text-sm font-semibold tabular-nums text-primary-strong">
                  {tomorrowLabel}
                </span>
              ) : null}
            </>
          )
        }
        expanded={
          <>
            <span className="font-display text-base font-bold text-on-surface">
              {message}
            </span>
            {tomorrowFirst ? (
              <span className="text-xs text-on-surface-variant">
                Mañana: {tomorrowFirst.subjectName} ·{" "}
                <span className="tabular-nums">
                  {tomorrowFirst.startsLabel}
                </span>
              </span>
            ) : (
              <span className="text-xs text-on-surface-variant">
                Consulta otro día desde tu horario.
              </span>
            )}
          </>
        }
      />
    );
  }

  if (state.kind === "in-class") {
    return (
      <Capsule
        variant={variant}
        tone="accent"
        autoCollapseMs={autoCollapseMs}
        pulseKey={effectivePulse}
        ariaLabel={`En clase: ${state.subjectName}, termina a las ${state.endsLabel}`}
        minimized={
          <>
            <span className="truncate text-sm font-semibold text-on-surface">
              {state.subjectName}
            </span>
            <span className="ml-1 shrink-0 text-sm font-semibold tabular-nums text-primary-strong">
              {state.remainingMinutes}′
            </span>
          </>
        }
        expanded={
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-display text-lg font-bold leading-tight text-on-surface">
                {state.subjectName}
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-primary-strong">
                {state.remainingMinutes}′ restantes
              </span>
            </div>
            <p className="text-sm text-on-surface-variant">
              Termina a las {state.endsLabel}
            </p>
            <ProgressBar
              value={state.progressPercent}
              label={`Progreso de ${state.subjectName}`}
              className="mt-1"
            />
          </>
        }
      />
    );
  }

  const relative = formatRelativeTime(state.minutesUntil);
  return (
    <Capsule
      variant={variant}
      autoCollapseMs={autoCollapseMs}
      pulseKey={effectivePulse}
      ariaLabel={`Siguiente clase: ${state.subjectName} a las ${state.startsLabel}`}
      minimized={
        <>
          <span className="text-sm font-medium tabular-nums text-on-surface-variant">
            {relative || state.startsLabel}
          </span>
          <span className="max-w-28 truncate text-sm font-medium text-on-surface">
            {state.subjectName}
          </span>
        </>
      }
      expanded={
        <>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            Luego
          </span>
          <span className="font-display text-lg font-bold leading-tight text-on-surface">
            {state.subjectName}
          </span>
          <p className="text-sm text-on-surface-variant">
            {state.classroom ? `Salón ${state.classroom} · ` : ""}
            {state.startsLabel}
            {relative ? ` · en ${relative}` : ""}
          </p>
        </>
      }
    />
  );
}
