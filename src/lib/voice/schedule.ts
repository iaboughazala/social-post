/**
 * Publishing schedule helper.
 *
 * A schedule defines: days (Sun..Sat) × times (HH:mm) × timezone.
 * When a Post is approved, we compute the next open slot in the team's
 * timezone that isn't already taken by another scheduled post, and set
 * that as scheduledAt (in UTC) so the existing cron picks it up.
 */

export const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export interface ParsedSchedule {
  days: WeekdayKey[];
  times: string[]; // "HH:mm"
  platforms: string[];
  timezone: string;
  isActive: boolean;
}

export function parseSchedule(raw: {
  days: string;
  times: string;
  platforms: string;
  timezone: string;
  isActive: boolean;
}): ParsedSchedule {
  const safeParse = (json: string): string[] => {
    try {
      const p = JSON.parse(json);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  };
  const days = safeParse(raw.days).filter((d): d is WeekdayKey =>
    (WEEKDAY_KEYS as readonly string[]).includes(d)
  );
  const times = safeParse(raw.times).filter((t) => /^\d{2}:\d{2}$/.test(t));
  return {
    days,
    times: times.slice().sort(),
    platforms: safeParse(raw.platforms),
    timezone: raw.timezone,
    isActive: raw.isActive,
  };
}

/**
 * Get the weekday name (as WeekdayKey) for a given Date in a target timezone.
 */
function weekdayInTz(date: Date, tz: string): WeekdayKey {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(date);
  const map: Record<string, WeekdayKey> = {
    Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat",
  };
  return map[wd] ?? "sun";
}

/**
 * Given a local date+time+timezone, produce the UTC Date that represents it.
 * Uses Intl to compute the timezone offset for that date.
 */
function localToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  // Build a probe UTC time, then measure the offset the target tz thinks it has,
  // and correct. This handles DST because the offset is computed at that instant.
  const probeUtcMs = Date.UTC(y, m - 1, d, hh, mm);
  const asString = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(probeUtcMs));
  const get = (t: string) => Number(asString.find((p) => p.type === t)?.value);
  const seenY = get("year");
  const seenMo = get("month");
  const seenD = get("day");
  const seenH = get("hour") === 24 ? 0 : get("hour");
  const seenM = get("minute");
  const seenUtcMs = Date.UTC(seenY, seenMo - 1, seenD, seenH, seenM);
  const offsetMs = seenUtcMs - probeUtcMs;
  return new Date(probeUtcMs - offsetMs);
}

/**
 * Return upcoming slot dates (as UTC Date) starting from `from`, up to `limit`.
 * Slots are ordered chronologically.
 */
export function computeNextSlots(
  schedule: ParsedSchedule,
  from: Date,
  limit: number
): Date[] {
  if (!schedule.isActive || schedule.days.length === 0 || schedule.times.length === 0) {
    return [];
  }
  const slots: Date[] = [];
  const tz = schedule.timezone;

  // Iterate up to 60 days forward
  for (let dayOffset = 0; dayOffset < 60 && slots.length < limit; dayOffset++) {
    const probe = new Date(from.getTime() + dayOffset * 24 * 3600 * 1000);
    const wd = weekdayInTz(probe, tz);
    if (!schedule.days.includes(wd)) continue;

    // Get y-m-d for this probe in the target tz
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(probe);
    const y = Number(parts.find((p) => p.type === "year")?.value);
    const m = Number(parts.find((p) => p.type === "month")?.value);
    const d = Number(parts.find((p) => p.type === "day")?.value);

    for (const t of schedule.times) {
      const [hh, mm] = t.split(":").map(Number);
      const slotUtc = localToUtc(y, m, d, hh, mm, tz);
      if (slotUtc.getTime() > from.getTime()) {
        slots.push(slotUtc);
        if (slots.length >= limit) break;
      }
    }
  }
  return slots;
}

/**
 * Pick the earliest slot not yet taken by any of the given already-scheduled times.
 */
export function pickNextOpenSlot(
  schedule: ParsedSchedule,
  from: Date,
  takenUtc: Date[],
  bufferMs = 60_000
): Date | null {
  const slots = computeNextSlots(schedule, from, Math.max(50, takenUtc.length + 5));
  const takenSet = new Set(takenUtc.map((d) => d.getTime()));
  for (const slot of slots) {
    // Consider "taken" if any existing time is within bufferMs of this slot
    let clash = false;
    for (const t of takenSet) {
      if (Math.abs(t - slot.getTime()) < bufferMs) {
        clash = true;
        break;
      }
    }
    if (!clash) return slot;
  }
  return null;
}
