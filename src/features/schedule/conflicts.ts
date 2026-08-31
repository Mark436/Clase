import type { ClassMeeting, ResolvedMeeting, WeekSchedule } from "./types";
import { isCustomClave } from "./edits";

/** Absolute tolerance when snapping an eaten ratio onto a friendly fraction. */
const FRACTION_TOLERANCE = 0.09;

const FRIENDLY_FRACTIONS: ReadonlyArray<readonly [label: string, value: number]> =
  [
    ["1/4", 0.25],
    ["1/3", 1 / 3],
    ["1/2", 0.5],
    ["2/3", 2 / 3],
    ["3/4", 0.75],
  ];

/**
 * "Comen un cuarto" rendering: the eaten portion becomes "1/4", "1/2",
 * "3/4"... when a friendly fraction approximates it closely enough;
 * otherwise it falls back to minutes ("20 min"). Fully displaced classes
 * return "" (the caller turns that into "completa").
 */
export function formatEatenPortion(
  eatenMinutes: number,
  totalMinutes: number,
): string {
  if (
    totalMinutes <= 0 ||
    eatenMinutes <= 0 ||
    eatenMinutes >= totalMinutes
  ) {
    return "";
  }

  const ratio = eatenMinutes / totalMinutes;
  let best: readonly [label: string, value: number] | null = null;

  for (const candidate of FRIENDLY_FRACTIONS) {
    const error = Math.abs(candidate[1] - ratio);
    if (error <= FRACTION_TOLERANCE && (!best || error < Math.abs(best[1] - ratio))) {
      best = candidate;
    }
  }

  return best === null ? `${eatenMinutes} min` : best[0];
}

/**
 * Overlap label for how much of a class's own duration is shared with
 * another. "completa" when the whole class is covered; "" when nothing or
 * everything is ambiguous except the fully-covered case.
 */
function eatenLabel(eatenMinutes: number, totalMinutes: number): string {
  if (totalMinutes <= 0 || eatenMinutes <= 0) return "";
  if (eatenMinutes >= totalMinutes) return "completa";
  return formatEatenPortion(eatenMinutes, totalMinutes);
}

// Manually added subjects win over fetched classes; among equals the earlier
// start keeps its place. Deterministic regardless of input order.
function compareRank(a: ClassMeeting, b: ClassMeeting): number {
  const customA = isCustomClave(a.clave) ? 0 : 1;
  const customB = isCustomClave(b.clave) ? 0 : 1;

  return (
    customA - customB ||
    a.startMinutes - b.startMinutes ||
    a.endMinutes - b.endMinutes ||
    a.subjectName.localeCompare(b.subjectName)
  );
}

function overlapLength(
  a: { startMinutes: number; endMinutes: number },
  b: { startMinutes: number; endMinutes: number },
): number {
  return Math.max(
    0,
    Math.min(a.endMinutes, b.endMinutes) - Math.max(a.startMinutes, b.startMinutes),
  );
}

/**
 * Clear bottom-right note for a card that overlaps others, e.g.
 * "Encimada 1/2 por Matemáticas" or "Encimada completa por Química". Lists
 * every class it shares time with; undefined when nothing overlaps.
 */
function overlapMessage(
  others: ClassMeeting[],
  meeting: ClassMeeting,
): string | undefined {
  const total = meeting.endMinutes - meeting.startMinutes;
  const parts: string[] = [];

  for (const other of others) {
    const overlapped = overlapLength(other, meeting);
    if (overlapped <= 0) continue;
    parts.push(`${eatenLabel(overlapped, total)} por ${other.subjectName}`);
  }

  return parts.length === 0 ? undefined : `Encimada ${parts.join(" y ")}`;
}

/**
 * One overlapping cluster → one card per member. Each card records how much
 * of its own duration is shared with the rest of the group as a plain note
 * (`overlap`); no ordering or swap behavior.
 */
function resolveCluster(cluster: ClassMeeting[]): ResolvedMeeting[] {
  const sorted = [...cluster].sort(compareRank);
  if (sorted.length === 1) return [sorted[0]];

  return sorted.map((meeting) => ({
    ...meeting,
    overlap: overlapMessage(
      sorted.filter((other) => other !== meeting),
      meeting,
    ),
  }));
}

/**
 * Full-week deterministic resolution: meetings are clustered per weekday by
 * interval overlap and every member of a cluster is emitted as its own card
 * carrying an overlap note. Non-conflicting meetings pass through untouched.
 */
export function resolveConflicts(meetings: WeekSchedule): ResolvedMeeting[] {
  const byWeekday = new Map<number, ClassMeeting[]>();
  for (const meeting of meetings) {
    const bucket = byWeekday.get(meeting.weekday);
    if (bucket === undefined) {
      byWeekday.set(meeting.weekday, [meeting]);
    } else {
      bucket.push(meeting);
    }
  }

  const resolved: ResolvedMeeting[] = [];

  for (const dayMeetings of byWeekday.values()) {
    // Clustering must group by time overlap only, so order by start minute.
    // (compareRank would put manual subjects first regardless of time and
    // inflate clusterEnd, wrongly swallowing earlier non-overlapping classes.)
    const ordered = [...dayMeetings].sort(
      (a, b) =>
        a.startMinutes - b.startMinutes ||
        a.endMinutes - b.endMinutes ||
        a.subjectName.localeCompare(b.subjectName),
    );

    let cluster: ClassMeeting[] = [];
    let clusterEnd = -1;

    const flush = () => {
      if (cluster.length > 0) {
        resolved.push(...resolveCluster(cluster));
        cluster = [];
        clusterEnd = -1;
      }
    };

    for (const meeting of ordered) {
      if (cluster.length === 0 || meeting.startMinutes < clusterEnd) {
        cluster.push(meeting);
        clusterEnd = Math.max(clusterEnd, meeting.endMinutes);
      } else {
        flush();
        cluster = [meeting];
        clusterEnd = meeting.endMinutes;
      }
    }
    flush();
  }

  return resolved.sort(
    (a, b) =>
      a.weekday - b.weekday ||
      a.startMinutes - b.startMinutes ||
      a.subjectName.localeCompare(b.subjectName),
  );
}
