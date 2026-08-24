import { useCallback, useRef, useState } from "react";
import type { TouchEvent } from "react";

const MAX_OFFSET_PX = 80;
const TRIGGER_THRESHOLD_PX = 64;
const DRAG_RESISTANCE = 0.5;

interface PullToRefresh {
  offset: number;
  refreshing: boolean;
  dragging: boolean;
  bind: {
    onTouchStart: (event: TouchEvent<HTMLElement>) => void;
    onTouchMove: (event: TouchEvent<HTMLElement>) => void;
    onTouchEnd: () => void;
  };
}

export function usePullToRefresh(onRefresh?: () => unknown): PullToRefresh {
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    if (window.scrollY > 0) return;
    startYRef.current = event.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (refreshing || startYRef.current === null) return;

      const deltaY = event.touches[0].clientY - startYRef.current;
      if (deltaY <= 0) {
        setOffset(0);
        return;
      }
      setOffset(Math.min(deltaY * DRAG_RESISTANCE, MAX_OFFSET_PX));
    },
    [refreshing],
  );

  const handleTouchEnd = useCallback(() => {
    startYRef.current = null;
    setDragging(false);
    if (refreshing || !onRefresh) {
      setOffset(0);
      return;
    }

    if (offset >= TRIGGER_THRESHOLD_PX) {
      setOffset(TRIGGER_THRESHOLD_PX);
      setRefreshing(true);
      void Promise.resolve(onRefresh()).finally(() => {
        setRefreshing(false);
        setOffset(0);
      });
      return;
    }
    setOffset(0);
  }, [offset, onRefresh, refreshing]);

  return {
    offset,
    refreshing,
    dragging,
    bind: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
