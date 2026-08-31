import { DEFAULT_TOAST_DURATION_MS } from "@/components/ui/toastVariants";
import type { CapsuleVariant } from "@/components/ui/Capsule";

export interface DevMateria {
  clave: string;
  nombre: string;
  docente: string;
  salon: string;
  // Weekdays following mapHorario's convention: 1 = lunes … 6 = sábado.
  dias: number[];
  inicio: string;
  fin: string;
  calificacion: string;
}

// Built-in hold time before a long-press activates subject-card editing.
// The web platform exposes no OS-specific long-press threshold (Android's
// ViewConfiguration timeout is not reachable from browsers), so one value
// rules every device. 550 ms sits close to common native defaults.
export const DEFAULT_LONG_PRESS_MS = 550;

// How long the context capsule stays expanded after an automatic pulse.
export const DEFAULT_CAPSULE_COLLAPSE_MS = 1500;

// Where one-shot academic events surface: through the persistent context
// capsule or as classic toasts.
export type NotificationChannel = "capsule" | "toast";
export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = "capsule";

const CAPSULE_VARIANTS: readonly CapsuleVariant[] = ["pill", "morf"];

export function toCapsuleVariant(
  value: unknown,
  fallback: CapsuleVariant,
): CapsuleVariant {
  return typeof value === "string" &&
    (CAPSULE_VARIANTS as readonly string[]).includes(value)
    ? (value as CapsuleVariant)
    : fallback;
}

const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  "capsule",
  "toast",
];

export function toNotificationChannel(
  value: unknown,
  fallback: NotificationChannel,
): NotificationChannel {
  return typeof value === "string" &&
    (NOTIFICATION_CHANNELS as readonly string[]).includes(value)
    ? (value as NotificationChannel)
    : fallback;
}

export interface DevConfig {
  clockOffsetMinutes: number | null;
  extraMaterias: DevMateria[];
  removedClaves: string[];
  gradeOverrides: Record<string, string>;
  adeudoOverride: boolean | null;
  // UX timings: persisted like the rest of the config but applied only while
  // the panel is enabled, matching how every other override behaves.
  toastDurationMs: number;
  longPressDurationMs: number;
  capsuleVariant: CapsuleVariant;
  capsuleCollapseMs: number;
  notificationChannel: NotificationChannel;
}

export const EMPTY_DEV_CONFIG: DevConfig = {
  clockOffsetMinutes: null,
  extraMaterias: [],
  removedClaves: [],
  gradeOverrides: {},
  adeudoOverride: null,
  toastDurationMs: DEFAULT_TOAST_DURATION_MS,
  longPressDurationMs: DEFAULT_LONG_PRESS_MS,
  capsuleVariant: "morf",
  capsuleCollapseMs: DEFAULT_CAPSULE_COLLAPSE_MS,
  notificationChannel: DEFAULT_NOTIFICATION_CHANNEL,
};
