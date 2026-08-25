import { useCallback, useRef } from "react";
import type { PointerEvent } from "react";

const DEFAULT_SLOP_PX = 10;
const MIN_PRESS_MS = 100;

export interface LongPressBinding {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: { preventDefault: () => void }) => void;
}

interface LongPressOptions {
  durationMs: number;
  onLongPress: () => void;
}

/**
 * Hold-to-activate gesture for subject cards. A short tap never triggers the
 * callback; moving beyond the slop radius or releasing early cancels it. The
 * configured duration is read through refs so slider changes apply to the
 * next press without rebinding.
 */
export function useLongPress({
  durationMs,
  onLongPress,
}: LongPressOptions): LongPressBinding {
  const timerRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const durationRef = useRef(durationMs);
  const callbackRef = useRef(onLongPress);
  durationRef.current = durationMs;
  callbackRef.current = onLongPress;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    originRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!event.isPrimary || event.button !== 0) return;

      originRef.current = { x: event.clientX, y: event.clientY };
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        originRef.current = null;
        callbackRef.current();
      }, Math.max(durationRef.current, MIN_PRESS_MS));
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const origin = originRef.current;
      if (origin === null) return;

      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      // Scrolling (or a drag) must not fire the editor mid-gesture.
      if (dx * dx + dy * dy > DEFAULT_SLOP_PX * DEFAULT_SLOP_PX) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const handleContextMenu = useCallback(
    (event: { preventDefault: () => void }) => {
      // Long-pressing on touch devices would otherwise open the native menu
      // on top of the editing flow.
      event.preventDefault();
    },
    [],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: clearTimer,
    onPointerLeave: clearTimer,
    onPointerCancel: clearTimer,
    onContextMenu: handleContextMenu,
  };
}
