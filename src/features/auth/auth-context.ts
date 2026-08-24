import { createContext, useContext } from "react";
import type { Alumno, ApiErrorKind, Aviso } from "@/lib/api/client";

export type AuthStatus =
  | "restoring"
  | "unauthenticated"
  | "authenticating"
  | "authenticated";

export interface AuthContextValue {
  status: AuthStatus;
  alumno: Alumno | null;
  avisos: Aviso[];
  errorKind: ApiErrorKind | null;
  hasCredentials: boolean;
  rememberedUsername: string | null;
  login: (user: string, pass: string) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  refreshing: boolean;
  unseenGradeChanges: boolean;
  markGradesSeen: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider.");
  }
  return context;
}
