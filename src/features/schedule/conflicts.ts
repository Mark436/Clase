import type {
  ClassMeeting,
  ConflictNotice,
  ResolvedMeeting,
  WeekSchedule,
} from "./types";
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
 * return "" (the notice shows just the subject name).
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

export interface SwapPreferences {
  /** Persistent weekly choices: groupKey -> preferred clave. */
  weekly: Record<string, string>;
  /** Ephemeral choices: `${groupKey}#${weekday}` -> clave. */
  daily: Record<string, string>;
}

export function dailySwapKey(groupKey: string, weekday: number): string {
  return `${groupKey}#${weekday}`;
}

/** Stable identity of a conflict cluster; shared by every weekday it repeats on. */
export function conflictGroupKey(claves: Iterable<string>): string {
  return [...new Set(claves)].sort().join("|");
}

/**
 * Collapses one overlapping cluster into a single card: the highest-ranked
 * member renders with its own time range, and every other member is listed
 * in `conflicts` together with how much of its duration was eaten. Swap
 * preferences (daily first, then weekly) reorder which member displays.
 */
function resolveCluster(
  cluster: ClassMeeting[],
  weekday: number,
  prefs: SwapPreferences,
): ResolvedMeeting[] {
  const ranked = [...cluster].sort(compareRank);

  // Winners reserve their full interval first; each member records how much
  // of its own range the higher-ranked members take away.
  const reserved: Array<{ startMinutes: number; endMinutes: number }> = [];
  const eatenByClave = new Map<string, number>();
  for (const meeting of ranked) {
    let eaten = 0;
    for (const interval of reserved) {
      eaten += overlapLength(interval, meeting);
    }
    eatenByClave.set(meeting.clave, eaten);
    reserved.push({
      startMinutes: meeting.startMinutes,
      endMinutes: meeting.endMinutes,
    });
  }

  const key = conflictGroupKey(ranked.map((meeting) => meeting.clave));
  const members = [...ranked];
  let swapped = false;

  const dailyPreferred = prefs.daily[dailySwapKey(key, weekday)];
  const weeklyPreferred = prefs.weekly[key];
  const preferred = dailyPreferred ?? weeklyPreferred;

  if (preferred !== undefined) {
    const index = members.findIndex((meeting) => meeting.clave === preferred);
    if (index > 0) {
      const [picked] = members.splice(index, 1);
      members.unshift(picked);
      swapped = true;
    } else if (index === 0 && weeklyPreferred !== undefined) {
      swapped = true;
    }
  }

  const primary = members[0];
  const others = members.slice(1);
  if (others.length === 0) return [primary];

  const conflicts: ConflictNotice[] = others.map((meeting) => ({
    clave: meeting.clave,
    subjectName: meeting.subjectName,
    portionLabel: formatEatenPortion(
      eatenByClave.get(meeting.clave) ?? 0,
      meeting.endMinutes - meeting.startMinutes,
    ),
  }));

  return [{ ...primary, conflicts, conflictKey: key, swapped }];
}

/**
 * Full-week deterministic resolution: meetings are clustered per weekday by
 * interval overlap and every cluster collapses to one card. Non-conflicting
 * meetings pass through untouched.
 */
export function resolveConflicts(
  meetings: WeekSchedule,
  prefs: SwapPreferences,
): ResolvedMeeting[] {
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

  for (const [weekday, dayMeetings] of byWeekday) {
    const ordered = dayMeetings.sort(compareRank);

    let cluster: ClassMeeting[] = [];
    let clusterEnd = -1;

    const flush = () => {
      if (cluster.length > 0) {
        resolved.push(...resolveCluster(cluster, weekday, prefs));
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
