import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useAuth } from "@/features/auth/auth-context";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { GradesPage } from "@/features/grades/GradesPage";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { StudentPage } from "@/features/student/StudentPage";
import { getHomeTab, NAV_ITEMS } from "./navigation";
import type { TabId } from "./navigation";

function AuthenticatedShell() {
  const [tab, setTab] = useState<TabId>(getHomeTab());

  return (
    <AppShell
      navigation={
        <BottomNavigation items={NAV_ITEMS} activeId={tab} onSelect={setTab} />
      }
    >
      {tab === "schedule" ? (
        <SchedulePage />
      ) : tab === "grades" ? (
        <GradesPage />
      ) : (
        <StudentPage />
      )}
    </AppShell>
  );
}

function AppContent() {
  const { status } = useAuth();

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
