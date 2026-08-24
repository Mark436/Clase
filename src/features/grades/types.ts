export type GradeStatus = "nueva" | "cambiada" | "igual" | "pendiente";

export interface GradeRow {
  clave: string;
  nombre: string;
  calificacion: string;
  previous: string | null;
  status: GradeStatus;
}
