import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
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

function AuthenticatedShell() {
  const { alumno, hasCredentials, refresh, unseenGradeChanges } = useAuth();
  const [tab, setTab] = useState<TabId>(() =>
    getHomeTab(shouldOpenGradesFirst(alumno, unseenGradeChanges)),
  );
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);

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
      setReminderVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [alumno, hasCredentials]);

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
        {alumno?.adeudos.tieneAdeudos ? <DebtBanner adeudos={alumno.adeudos} /> : null}
        <AdeudoAlertsCard alumno={alumno} />

        {tab === "schedule" ? (
          <SchedulePage alumno={alumno} />
        ) : tab === "grades" ? (
          <GradesPage alumno={alumno} />
        ) : (
          <StudentPage onRequestRefresh={handlePullToRefresh} />
        )}
      </AppShell>

      {reminderVisible ? (
        <Toast
          message="Se recomienda volver a iniciar sesión para actualizar tus datos."
          onClose={() => setReminderVisible(false)}
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
