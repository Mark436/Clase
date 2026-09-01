import { useState } from "react";
import type { ReactNode } from "react";
import { TopZoneContext } from "./topZoneContext";

interface TopZoneProviderProps {
  children: ReactNode;
  /** Rendered inside the floating zone (the persistent context capsule). */
  slot?: ReactNode;
}

export function TopZoneProvider({ children, slot }: TopZoneProviderProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);

  return (
    <TopZoneContext value={element}>
      {children}
      {/* Flex row: the capsule sits at the start while collapsed and can
          center itself when expanded. Fixed so the capsule stays pinned to
          the viewport and never scrolls away with the page. */}
      <div
        ref={setElement}
        aria-hidden={element === null}
        className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+10px)] z-30 flex justify-start"
      >
        {slot}
      </div>
    </TopZoneContext>
  );
}
