import { useCallback, useRef, useState } from "react";
import type { TouchEvent } from "react";

const SWIPE_THRESHOLD_PX = 48;
const AXIS_DOMINANCE_RATIO = 1.2;

/**
 * Horizontal swipe detection for day navigation. Only fires when the touch has
 * travelled mostly sideways (X clearly beats Y), so it never fights the
 * vertical scroll of the class list or the shell's pull-to-refresh.
 */
export function useHorizontalSwipe(onSwipe?: (direction: -1 | 1) => void) {
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const reset = useCallback(() => {
    startXRef.current = null;
    startYRef.current = null;
    firedRef.current = false;
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch === undefined) return;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    firedRef.current = false;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (startXRef.current === null || startYRef.current === null) return;
      if (firedRef.current) return;

      const touch = event.touches[0];
      if (touch === undefined) return;

      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      if (Math.abs(dx) <= SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy) * AXIS_DOMINANCE_RATIO) {
        return;
      }

      firedRef.current = true;
      setDragging(false);
      // Swiping left (dx < 0) advances to the next day (+1); swiping right
      // (dx > 0) steps back to the previous day (-1).
      onSwipe?.(dx < 0 ? 1 : -1);
      reset();
    },
    [onSwipe, reset],
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    reset();
  }, [reset]);

  return {
    dragging,
    bind: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}
