import { DEFAULT_TOAST_DURATION_MS } from "@/components/ui/toastVariants";

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
export const DEFAULT_LONG_PRESS_MS = 500;

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
}

export const EMPTY_DEV_CONFIG: DevConfig = {
  clockOffsetMinutes: null,
  extraMaterias: [],
  removedClaves: [],
  gradeOverrides: {},
  adeudoOverride: null,
  toastDurationMs: DEFAULT_TOAST_DURATION_MS,
  longPressDurationMs: DEFAULT_LONG_PRESS_MS,
};
