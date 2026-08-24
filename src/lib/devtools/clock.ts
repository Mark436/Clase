let offsetMinutes: number | null = null;
const listeners = new Set<() => void>();

export function getClockOffsetMinutes(): number | null {
  return offsetMinutes;
}

export function setClockOffsetMinutes(minutes: number | null): void {
  if (offsetMinutes === minutes) return;
  offsetMinutes = minutes;
  for (const listener of listeners) listener();
}

// Single time source for the app: real clock, or real clock shifted by the
// dev-tools offset while a simulation is active.
export function getNow(): Date {
  return offsetMinutes === null
    ? new Date()
    : new Date(Date.now() + offsetMinutes * 60_000);
}

export function subscribeToClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
