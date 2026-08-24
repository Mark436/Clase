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

export interface DevConfig {
  clockOffsetMinutes: number | null;
  extraMaterias: DevMateria[];
  removedClaves: string[];
  gradeOverrides: Record<string, string>;
  adeudoOverride: boolean | null;
}

export const EMPTY_DEV_CONFIG: DevConfig = {
  clockOffsetMinutes: null,
  extraMaterias: [],
  removedClaves: [],
  gradeOverrides: {},
  adeudoOverride: null,
};
