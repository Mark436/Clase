import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/auth-context";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { ReAuthSheet } from "@/features/auth/components/ReAuthSheet";
import { GradesPage } from "@/features/grades/GradesPage";
import { hasGrades } from "@/features/grades/utils";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { AdeudoAlertsCard } from "@/features/student/components/AdeudoAlertsCard";
import { DebtBanner } from "@/features/student/components/DebtBanner";
import { StudentPage } from "@/features/student/StudentPage";
import { getHomeTab, NAV_ITEMS } from "./navigation";
import type { TabId } from "./navigation";

function AuthenticatedShell() {
  const { alumno, hasCredentials } = useAuth();
  const [tab, setTab] = useState<TabId>(() => getHomeTab(hasGrades(alumno)));
  const [reAuthOpen, setReAuthOpen] = useState(false);

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
      >
        {!hasCredentials ? (
          <button
            type="button"
            onClick={() => setReAuthOpen(true)}
            className="w-full bg-primary-container px-4 py-2.5 text-center text-sm font-medium text-on-primary-container transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            Datos guardados · toca para actualizar
          </button>
        ) : null}

        {alumno?.adeudos.tieneAdeudos ? <DebtBanner adeudos={alumno.adeudos} /> : null}
        <AdeudoAlertsCard alumno={alumno} />

        {tab === "schedule" ? (
          <SchedulePage alumno={alumno} />
        ) : tab === "grades" ? (
          <GradesPage alumno={alumno} />
        ) : (
          <StudentPage />
        )}
      </AppShell>

      <ReAuthSheet open={reAuthOpen} onClose={() => setReAuthOpen(false)} />
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
