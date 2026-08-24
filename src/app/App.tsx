import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import type { ToastVariant } from "@/components/ui/Toast";
import { applyDevOverrides } from "@/features/devtools/applyDevOverrides";
import { useDevConfig } from "@/features/devtools/useDevConfig";
import { useAuth } from "@/features/auth/auth-context";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { ReAuthSheet } from "@/features/auth/components/ReAuthSheet";
import { shouldPromptReAuth, toDateKey } from "@/features/auth/utils";
import { GradesPage } from "@/features/grades/GradesPage";
import { shouldOpenGradesFirst } from "@/features/grades/utils";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { AdeudoAlertsCard } from "@/features/student/components/AdeudoAlertsCard";
import { DebtBanner } from "@/features/student/components/DebtBanner";
import { StudentPage } from "@/features/student/StudentPage";
import {
  getSetting,
  setSetting,
  SETTING_LAST_REAUTH_PROMPT_DATE,
} from "@/lib/storage/settingsStore";
import { getHomeTab, NAV_ITEMS } from "./navigation";
import type { TabId } from "./navigation";

interface ActiveToast {
  message: string;
  variant: ToastVariant;
}

function AuthenticatedShell() {
  const {
    alumno,
    hasCredentials,
    refresh,
    unseenGradeChanges,
    gradeChangeCount,
    adeudoAlertCount,
  } = useAuth();
  const dev = useDevConfig();
  const [tab, setTab] = useState<TabId>(() =>
    getHomeTab(shouldOpenGradesFirst(alumno, unseenGradeChanges)),
  );
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [toast, setToast] = useState<ActiveToast | null>(null);

  // Dev simulation is presentation-only: the virtual alumno feeds every
  // screen, while fetches and persistence keep using the real data.
  const effectiveAlumno = useMemo(
    () =>
      alumno && dev.loaded ? applyDevOverrides(alumno, dev.config) : alumno,
    [alumno, dev.loaded, dev.config],
  );

  // Daily re-auth reminder: with a session restored from cache and no
  // credentials in memory, suggest re-entering the password once per day.
  // The date is saved when the prompt fires, so closing the sheet without
  // logging in still consumes the day.
  useEffect(() => {
    if (hasCredentials || !alumno) return;

    let cancelled = false;

    void (async () => {
      let lastPromptDate: string | null = null;
      try {
        lastPromptDate = await getSetting(SETTING_LAST_REAUTH_PROMPT_DATE);
      } catch {
        lastPromptDate = null;
      }

      const today = new Date();
      if (!shouldPromptReAuth(lastPromptDate, today)) return;

      try {
        await setSetting(
          SETTING_LAST_REAUTH_PROMPT_DATE,
          toDateKey(today),
        );
      } catch {
        // A storage failure should not block the prompt itself.
      }

      if (cancelled) return;
      setReAuthOpen(true);
      setToast({
        message:
          "Se recomienda volver a iniciar sesión para actualizar tus datos.",
        variant: "neutral",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [alumno, hasCredentials]);

  // One-shot notifications from real fetch events. Counters start at zero and
  // only grow when a fetch detects the event after mount, so app startup,
  // cache restores, and baselines never trigger a toast.
  useEffect(() => {
    if (gradeChangeCount > 0) {
      setToast({
        message: "Tienes calificaciones nuevas o actualizadas.",
        variant: "success",
      });
    }
  }, [gradeChangeCount]);

  useEffect(() => {
    if (adeudoAlertCount > 0) {
      setToast({
        message: "Tienes un adeudo nuevo pendiente.",
        variant: "error",
      });
    }
  }, [adeudoAlertCount]);

  function handlePullToRefresh() {
    if (hasCredentials) return refresh();
    setReAuthOpen(true);
  }

  return (
    <>
      <AppShell
        navigation={
          <BottomNavigation
            items={NAV_ITEMS}
            activeId={tab}
            onSelect={setTab}
          />
        }
        onPullToRefresh={handlePullToRefresh}
      >
        {effectiveAlumno?.adeudos.tieneAdeudos ? (
          <DebtBanner adeudos={effectiveAlumno.adeudos} />
        ) : null}
        <AdeudoAlertsCard alumno={effectiveAlumno} />

        {tab === "schedule" ? (
          <SchedulePage alumno={effectiveAlumno} />
        ) : tab === "grades" ? (
          <GradesPage alumno={effectiveAlumno} />
        ) : (
          <StudentPage
            alumno={effectiveAlumno}
            onRequestRefresh={handlePullToRefresh}
            dev={dev}
          />
        )}
      </AppShell>

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}

      <ReAuthSheet
        open={reAuthOpen}
        onClose={() => setReAuthOpen(false)}
        onSuccess={() => setReAuthOpen(false)}
      />
    </>
  );
}

function AppContent() {
  const { status } = useAuth();

  if (status === "restoring") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner size={28} className="text-primary" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return <LoginPage />;
  }

  return <AuthenticatedShell />;
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
