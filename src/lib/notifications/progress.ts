import type { Alumno } from "@/lib/api/client";
import {
  getSetting,
  SETTING_ADEUDO_ALERTS_OPT_IN,
} from "@/lib/storage/settingsStore";

/** Rounded percentage-point gain between two fetches; never negative. */
export function progressDelta(
  previousAlumno: Alumno | null,
  nextAlumno: Alumno,
): number {
  const before = previousAlumno?.progreso;
  if (typeof before !== "number" || typeof nextAlumno.progreso !== "number") {
    return 0;
  }
  return Math.max(0, Math.round((nextAlumno.progreso - before) * 10) / 10);
}

export function formatProgressDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded}%`;
}

/**
 * Career-progress system alert. Shares the debt-alerts opt-in and permission
 * gate: one switch covers all local system notifications. Fires only when
 * progress actually increased since the previous fetch.
 */
export async function notifyCareerProgress(deltaPercent: number): Promise<boolean> {
  if (deltaPercent <= 0) return false;

  try {
    const optedIn =
      (await getSetting(SETTING_ADEUDO_ALERTS_OPT_IN)) === "true";
    if (
      !optedIn ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Avanzaste en tu carrera", {
      body: `${formatProgressDelta(deltaPercent)} de avance académico.`,
      tag: "career-progress",
    });
    return true;
  } catch (error) {
    console.warn("No se pudo mostrar la notificación de progreso.", error);
    return false;
  }
}
