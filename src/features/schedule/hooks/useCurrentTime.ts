import { useEffect, useState } from "react";
import { getNow, subscribeToClock } from "@/lib/devtools/clock";

const TICK_INTERVAL_MS = 15_000;

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
    let intervalId: number | undefined;

    function tick() {
      setNow((previous) => {
        const current = getNow();
        return isSameMinute(previous, current) ? previous : current;
      });
    }

    function start() {
      tick();
      intervalId = window.setInterval(tick, TICK_INTERVAL_MS);
    }

    function stop() {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
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

    // Clock changes (dev simulation) apply immediately, even in background.
    const unsubscribe = subscribeToClock(() => setNow(getNow()));

    return () => {
      stop();
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return now;
}
