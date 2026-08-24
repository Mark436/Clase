import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { usePullToRefresh } from "./usePullToRefresh";

const TRIGGER_THRESHOLD_PX = 64;

interface AppShellProps {
  navigation?: ReactNode;
  onPullToRefresh?: () => unknown;
  children: ReactNode;
}

export function AppShell({ navigation, onPullToRefresh, children }: AppShellProps) {
  const { offset, refreshing, dragging, bind } = usePullToRefresh(onPullToRefresh);
  const progress = Math.min(offset / TRIGGER_THRESHOLD_PX, 1);
  const showIndicator = offset > 0 || refreshing;

  return (
    <div className="min-h-dvh bg-background">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {showIndicator ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center"
            style={{ opacity: refreshing ? 1 : progress }}
          >
            <Spinner size={24} className="text-primary" />
          </div>
        ) : null}
        <main className="flex-1">
          <div
            {...bind}
            className={
              dragging ? undefined : "transition-transform duration-200 ease-out"
            }
            style={{ transform: `translateY(${offset}px)` }}
          >
            {children}
          </div>
        </main>
        {navigation ? (
          <div className="sticky bottom-0 z-10">{navigation}</div>
        ) : null}
      </div>
    </div>
  );
}
