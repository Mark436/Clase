import type { Alumno } from "@/lib/api/client";
import {
  getSetting,
  SETTING_ADEUDO_ALERTS_OPT_IN,
} from "@/lib/storage/settingsStore";

type Adeudos = Alumno["adeudos"];

const ADEUDO_AREA_LABELS: ReadonlyArray<
  readonly [keyof Omit<Adeudos, "tieneAdeudos">, string]
> = [
  ["biblioteca", "Biblioteca"],
  ["academico", "Académico"],
  ["escolar", "Escolar"],
  ["financiero", "Financiero"],
  ["administrativo", "Administrativo"],
];

export function listAdeudoAreas(adeudos: Adeudos): string[] {
  return ADEUDO_AREA_LABELS.filter(
    ([field]) => adeudos[field].trim() !== "",
  ).map(([, label]) => label);
}

export type AdeudoNotificationOutcome =
  | "none"
  | "known"
  | "notified"
  | "blocked";

// Single entry point for adeudo alerts: fires only on a clean→indebt
// transition (never repeats while the debt persists). Server push can later
// replace the local dispatch behind this same seam.
export async function notifyNewAdeudos(
  previousAlumno: Alumno | null,
  nextAlumno: Alumno,
): Promise<AdeudoNotificationOutcome> {
  if (!nextAlumno.adeudos.tieneAdeudos) return "none";
  if (previousAlumno?.adeudos.tieneAdeudos === true) return "known";

  const shown = await showLocalAdeudoNotification(
    listAdeudoAreas(nextAlumno.adeudos),
  );
  return shown ? "notified" : "blocked";
}

async function showLocalAdeudoNotification(areas: string[]): Promise<boolean> {
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
    await registration.showNotification("Tienes adeudos pendientes", {
      body:
        areas.length > 0
          ? `${areas.join(", ")}. Revisa tu información académica.`
          : "Revisa tu información académica.",
      tag: "adeudos",
    });
    return true;
  } catch (error) {
    console.warn("No se pudo mostrar la notificación de adeudos.", error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
