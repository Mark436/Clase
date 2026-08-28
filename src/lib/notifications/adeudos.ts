import type { Alumno } from "@/lib/api/client";
import {
  getSetting,
  SETTING_ADEUDO_ALERTS_OPT_IN,
} from "@/lib/storage/settingsStore";

export type Adeudos = Alumno["adeudos"];

export interface AdeudoDetail {
  label: string;
  detail: string;
}

const ADEUDO_AREA_LABELS: ReadonlyArray<
  readonly [keyof Omit<Adeudos, "tieneAdeudos">, string]
> = [
  ["biblioteca", "Biblioteca"],
  ["academico", "Académico"],
  ["escolar", "Escolar"],
  ["financiero", "Financiero"],
  ["administrativo", "Administrativo"],
];

// The API marks a debt-free area with "N" (sith-api-client's mapper) while
// dev simulations use an empty string; both must count as absent.
function hasAdeudo(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.toUpperCase() !== "N";
}

/** Specific debts per area, in the canonical area order. */
export function listAdeudoDetails(adeudos: Adeudos): AdeudoDetail[] {
  return ADEUDO_AREA_LABELS.flatMap(([field, label]) => {
    const detail = adeudos[field].trim();
    return hasAdeudo(detail) ? [{ label, detail }] : [];
  });
}

export function listAdeudoAreas(adeudos: Adeudos): string[] {
  return listAdeudoDetails(adeudos).map(({ label }) => label);
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
