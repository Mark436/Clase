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

// Developer/simulation overrides only. Always-on user preferences (capsule
// variant, notification channel, capsule collapse, long-press duration) moved
// to features/settings and no longer live here.
export interface DevConfig {
  clockOffsetMinutes: number | null;
  extraMaterias: DevMateria[];
  removedClaves: string[];
  gradeOverrides: Record<string, string>;
  adeudoOverride: boolean | null;
  // Dev-only toast test duration; applied only while the panel is enabled.
  toastDurationMs: number;
}

export const EMPTY_DEV_CONFIG: DevConfig = {
  clockOffsetMinutes: null,
  extraMaterias: [],
  removedClaves: [],
  gradeOverrides: {},
  adeudoOverride: null,
  toastDurationMs: DEFAULT_TOAST_DURATION_MS,
};
