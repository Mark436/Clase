import { useEffect, useState } from "react";
import { getNow, subscribeToClock } from "@/lib/devtools/clock";

export const MINUTE_MS = 60_000;

// Timers can fire a few milliseconds off their deadline; below this floor a
// retry costs nothing and prevents skipping a whole cycle when a timeout
// lands just before its boundary.
const RETRY_FLOOR_MS = 250;

// Exact wait until the next real minute boundary: at 10:34:48 the answer is
// 12_000 ms. Derived from the clock itself so cycles land on :00 seconds and
// never accumulate drift like fixed intervals do.
export function msUntilNextMinute(now: Date): number {
  return MINUTE_MS - (now.getTime() % MINUTE_MS);
}

function isSameMinute(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => getNow());

  useEffect(() => {
    let timeoutId: number | undefined;

    function evaluate() {
      setNow((previous) => {
        const current = getNow();
        return isSameMinute(previous, current) ? previous : current;
      });
    }

    function arm() {
      const delay = Math.max(msUntilNextMinute(getNow()), RETRY_FLOOR_MS);
      timeoutId = window.setTimeout(() => {
        evaluate();
        arm();
      }, delay);
    }

    // Restarting re-derives everything from the real clock: used on mount,
    // on foreground return and on dev-clock shifts, never trusting stale
    // timing state from before the app was backgrounded.
    function start() {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      evaluate();
      arm();
    }

    function stop() {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clock changes (dev simulation) apply immediately, even in background,
    // and resynchronize the next boundary to the shifted time.
    const unsubscribe = subscribeToClock(start);

    return () => {
      stop();
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return now;
}
