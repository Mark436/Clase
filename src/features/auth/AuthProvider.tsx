import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  Alumno,
  ApiErrorKind,
  Aviso,
  Credenciales,
} from "@/lib/api/client";
import { ApiError, fetchAppData } from "@/lib/api/client";
import { notifyNewAdeudos } from "@/lib/notifications/adeudos";
import { loadAppData, saveAppData } from "@/lib/storage/appDataStore";
import {
  loadGradeTracking,
  mergeGradeTracking,
  saveGradeTracking,
} from "@/lib/storage/gradeTracking";
import { clearAllStores } from "@/lib/storage/db";
import {
  getSetting,
  setSetting,
  SETTING_REMEMBERED_USERNAME,
} from "@/lib/storage/settingsStore";
import type { AuthStatus } from "./auth-context";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [errorKind, setErrorKind] = useState<ApiErrorKind | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [rememberedUsername, setRememberedUsername] = useState<string | null>(
    null,
  );

  // Session credentials live in volatile memory only (never in any storage),
  // so an in-session refresh can reuse them. Cleared on logout. See docs/api.md.
  const credentialsRef = useRef<Credenciales | null>(null);

  // Restore the last valid snapshot and the remembered username before any
  // network activity. Cached data hydrates the session; without it we fall
  // back to the login screen.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let cached: Awaited<ReturnType<typeof loadAppData>> = null;
      let username: string | null = null;

      try {
        cached = await loadAppData();
      } catch {
        cached = null;
      }
      try {
        username = await getSetting(SETTING_REMEMBERED_USERNAME);
      } catch {
        username = null;
      }

      if (cancelled) return;

      if (cached) {
        setAlumno(cached.alumno);
        setAvisos(cached.avisos);
      }
      setRememberedUsername(username);
      setStatus((current) =>
        current === "restoring"
          ? cached
            ? "authenticated"
            : "unauthenticated"
          : current,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (user: string, pass: string) => {
    setStatus("authenticating");
    setErrorKind(null);
    try {
      const data = await fetchAppData({ user, pass });
      credentialsRef.current = { user, pass };
      const previousAlumno = await loadPreviousAlumno();
      setHasCredentials(true);
      setAlumno(data.alumno);
      setAvisos(data.avisos);
      setStatus("authenticated");
      void persistSession(previousAlumno, data.alumno, data.avisos, user);
    } catch (error) {
      setErrorKind(error instanceof ApiError ? error.kind : "unknown");
      setStatus("unauthenticated");
    }
  }, []);

  const logout = useCallback(() => {
    credentialsRef.current = null;
    setHasCredentials(false);
    setAlumno(null);
    setAvisos([]);
    setErrorKind(null);
    setRememberedUsername(null);
    setStatus("unauthenticated");
    void clearAllStores().catch((error: unknown) => {
      console.warn("No se pudo borrar el almacenamiento local.", error);
    });
  }, []);

  const value = useMemo(
    () => ({
      status,
      alumno,
      avisos,
      errorKind,
      hasCredentials,
      rememberedUsername,
      login,
      logout,
    }),
    [
      status,
      alumno,
      avisos,
      errorKind,
      hasCredentials,
      rememberedUsername,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function loadPreviousAlumno(): Promise<Alumno | null> {
  try {
    return (await loadAppData())?.alumno ?? null;
  } catch {
    return null;
  }
}

// Persistence is fire-and-forget: a storage failure never blocks the session,
// and adeudo alerts compare against what was known before this fetch.
async function persistSession(
  previousAlumno: Alumno | null,
  alumno: Alumno,
  avisos: Aviso[],
  user: string,
): Promise<void> {
  try {
    const tracking = await loadGradeTracking();
    await saveGradeTracking(
      mergeGradeTracking(tracking, alumno.boleta.materias),
    );
    await saveAppData({
      alumno,
      avisos,
      loadedAt: new Date().toISOString(),
    });
    await setSetting(SETTING_REMEMBERED_USERNAME, user);
  } catch (error) {
    console.warn("No se pudieron guardar los datos localmente.", error);
  }
  await notifyNewAdeudos(previousAlumno, alumno);
}
