import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Alumno, ApiErrorKind, Aviso, Credenciales } from "@/lib/api/client";
import { ApiError, fetchAppData } from "@/lib/api/client";
import type { AuthStatus } from "./auth-context";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unauthenticated");
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [errorKind, setErrorKind] = useState<ApiErrorKind | null>(null);

  // Session credentials live in volatile memory only (never in any storage),
  // so an in-session refresh can reuse them. Cleared on logout. See docs/api.md.
  const credentialsRef = useRef<Credenciales | null>(null);

  const login = useCallback(async (user: string, pass: string) => {
    setStatus("authenticating");
    setErrorKind(null);
    try {
      const data = await fetchAppData({ user, pass });
      credentialsRef.current = { user, pass };
      setAlumno(data.alumno);
      setAvisos(data.avisos);
      setStatus("authenticated");
    } catch (error) {
      setErrorKind(error instanceof ApiError ? error.kind : "unknown");
      setStatus("unauthenticated");
    }
  }, []);

  const logout = useCallback(() => {
    credentialsRef.current = null;
    setAlumno(null);
    setAvisos([]);
    setErrorKind(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ status, alumno, avisos, errorKind, login, logout }),
    [status, alumno, avisos, errorKind, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
