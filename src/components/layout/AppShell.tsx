import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { TopZoneProvider } from "./TopZone";
import { usePullToRefresh } from "./usePullToRefresh";

const TRIGGER_THRESHOLD_PX = 64;

interface AppShellProps {
  navigation?: ReactNode;
  onPullToRefresh?: () => unknown;
  /** Rendered inside the floating top zone (persistent context capsule). */
  topSlot?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  navigation,
  onPullToRefresh,
  topSlot,
  children,
}: AppShellProps) {
  const { offset, refreshing, dragging, bind } = usePullToRefresh(onPullToRefresh);
  const progress = Math.min(offset / TRIGGER_THRESHOLD_PX, 1);
  const showIndicator = offset > 0 || refreshing;

  return (
    <div className="min-h-dvh bg-background">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {/* Reserved island space: constant height keeps the layout stable
            while the capsule expands over the content. */}
        <div
          aria-hidden="true"
          className="h-[calc(env(safe-area-inset-top)+58px)] shrink-0"
        />
        <TopZoneProvider slot={topSlot}>
          {showIndicator ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center"
              style={{ opacity: refreshing ? 1 : progress }}
            >
              <Spinner size={24} className="text-primary" />
            </div>
          ) : null}
          <main className="flex flex-1 flex-col">
            <div
              {...bind}
              className={`flex flex-1 flex-col ${
                dragging ? undefined : "transition-transform duration-200 ease-out"
              }`}
              style={{ transform: `translateY(${offset}px)` }}
            >
              {children}
              {navigation ? <div aria-hidden="true" className="h-20" /> : null}
            </div>
          </main>
        </TopZoneProvider>
      </div>
      {navigation ? <div className="sticky bottom-0 z-40">{navigation}</div> : null}
    </div>
  );
}
