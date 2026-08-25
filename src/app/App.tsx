import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import type { ToastVariant } from "@/components/ui/toastVariants";
import { DEFAULT_TOAST_DURATION_MS } from "@/components/ui/toastVariants";
import { applyDevOverrides } from "@/features/devtools/applyDevOverrides";
import { DEFAULT_LONG_PRESS_MS } from "@/features/devtools/types";
import { useDevConfig } from "@/features/devtools/useDevConfig";
import { useAuth } from "@/features/auth/auth-context";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { LoginPage } from "@/features/auth/LoginPage";
import { ReAuthSheet } from "@/features/auth/components/ReAuthSheet";
import { toDateKey } from "@/features/auth/utils";
import { GradesPage } from "@/features/grades/GradesPage";
import { shouldOpenGradesFirst } from "@/features/grades/utils";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { AdeudoAlertsCard } from "@/features/student/components/AdeudoAlertsCard";
import { DebtBanner } from "@/features/student/components/DebtBanner";
import { StudentPage } from "@/features/student/StudentPage";
import {
  getSetting,
  setSetting,
  SETTING_LAST_LOGIN_AT,
  SETTING_LAST_REAUTH_PROMPT_DATE,
} from "@/lib/storage/settingsStore";
import {
  CAREER_PROGRESS_TOAST_PREFIX,
  GRADE_CHANGES_TOAST,
  NEW_ADEUDO_TOAST,
  REFRESH_NUDGE_TOAST,
} from "@/lib/toastMessages";
import { formatProgressDelta } from "@/lib/notifications/progress";
import { getHomeTab, NAV_ITEMS } from "./navigation";
import type { TabId } from "./navigation";

// A session older than this gets one gentle reminder per day suggesting a
// pull-to-refresh; the re-auth sheet itself only appears on demand.
const STALE_SESSION_NUDGE_MS = 23 * 60 * 60 * 1000;

interface ActiveToast {
  id: number;
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
    lastProgressGain,
    progressAlertCount,
    rememberedUsername,
  } = useAuth();
  const dev = useDevConfig();
  const [tab, setTab] = useState<TabId>(() =>
    getHomeTab(shouldOpenGradesFirst(alumno, unseenGradeChanges)),
  );
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const toastIdRef = useRef(0);

  // Dev simulation is presentation-only: the virtual alumno feeds every
  // screen, while fetches and persistence keep using the real data. Overrides
  // pause while the dev panel is closed (enabled === false).
  const effectiveAlumno = useMemo(
    () =>
      alumno && dev.loaded && dev.enabled
        ? applyDevOverrides(alumno, dev.config)
        : alumno,
    [alumno, dev.loaded, dev.enabled, dev.config],
  );

  // UX timings follow the same convention as every other override: they apply
  // only while the panel is enabled; otherwise the built-in defaults rule.
  const timingsActive = dev.loaded && dev.enabled;
  const toastDurationMs = timingsActive
    ? dev.config.toastDurationMs
    : DEFAULT_TOAST_DURATION_MS;
  const longPressDurationMs = timingsActive
    ? dev.config.longPressDurationMs
    : DEFAULT_LONG_PRESS_MS;

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message, variant });
  }, []);

  // Stale-data nudge: once the session is ~23h old, remind with a plain
  // toast suggesting a pull-to-refresh. The re-auth sheet is never pushed
  // automatically; it stays reachable through pull-to-refresh without
  // credentials. Consumption is once per calendar day.
  useEffect(() => {
    if (!alumno) return;

    let cancelled = false;

    void (async () => {
      let lastLoginAt: string | null = null;
      let lastNudgeDate: string | null = null;
      try {
        lastLoginAt = await getSetting(SETTING_LAST_LOGIN_AT);
      } catch {
        lastLoginAt = null;
      }
      try {
        lastNudgeDate = await getSetting(SETTING_LAST_REAUTH_PROMPT_DATE);
      } catch {
        lastNudgeDate = null;
      }

      const today = new Date();
      if (lastNudgeDate === toDateKey(today)) return;

      const startedAtMs =
        lastLoginAt === null ? Number.NaN : Date.parse(lastLoginAt);
      // Unknown start (first run after this change): nudge once; from then on
      // lastLoginAt exists and the 23h rule governs.
      const stale = Number.isFinite(startedAtMs)
        ? today.getTime() - startedAtMs >= STALE_SESSION_NUDGE_MS
        : true;
      if (!stale) return;

      try {
        await setSetting(SETTING_LAST_REAUTH_PROMPT_DATE, toDateKey(today));
      } catch {
        // A storage failure should not block the nudge itself.
      }

      if (cancelled) return;
      showToast(REFRESH_NUDGE_TOAST, "neutral");
    })();

    return () => {
      cancelled = true;
    };
  }, [alumno, showToast]);

  // One-shot notifications from real fetch events. Counters start at zero and
  // only grow when a fetch detects the event after mount, so app startup,
  // cache restores, and baselines never trigger a toast.
  useEffect(() => {
    if (gradeChangeCount > 0) {
      showToast(GRADE_CHANGES_TOAST, "success");
    }
  }, [gradeChangeCount, showToast]);

  useEffect(() => {
    if (adeudoAlertCount > 0) {
      showToast(NEW_ADEUDO_TOAST, "error");
    }
  }, [adeudoAlertCount, showToast]);

  useEffect(() => {
    if (
      progressAlertCount > 0 &&
      lastProgressGain !== null &&
      lastProgressGain > 0
    ) {
      showToast(
        `${CAREER_PROGRESS_TOAST_PREFIX} ${formatProgressDelta(lastProgressGain)} en tu carrera.`,
        "success",
      );
    }
  }, [progressAlertCount, lastProgressGain, showToast]);

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
          <SchedulePage
            alumno={effectiveAlumno}
            longPressDurationMs={longPressDurationMs}
            simulated={timingsActive}
            onShowToast={showToast}
          />
        ) : tab === "grades" ? (
          <GradesPage alumno={effectiveAlumno} />
        ) : (
          <StudentPage
            alumno={effectiveAlumno}
            onRequestRefresh={handlePullToRefresh}
            onShowToast={showToast}
            dev={dev}
          />
        )}
      </AppShell>

      {toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          durationMs={toastDurationMs}
          onClose={() => setToast(null)}
        />
      ) : null}

      <ReAuthSheet
        open={reAuthOpen}
        initialUser={rememberedUsername ?? ""}
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
