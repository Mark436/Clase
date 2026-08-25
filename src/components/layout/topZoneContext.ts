import { createContext, useContext } from "react";

// Persistent top slot of the app shell: the context capsule mounts here via
// a portal so the owning page keeps its data pipeline while the island
// floats above every screen at the same anchored position.
export const TopZoneContext = createContext<HTMLElement | null>(null);

export function useTopZone(): HTMLElement | null {
  return useContext(TopZoneContext);
}
