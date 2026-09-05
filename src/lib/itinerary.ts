import type { ScoredExperience, TimeWindow } from '@/types';

// Micro-Itinerary Bundling (PS6 brief §4): auto-group 2-3 nearby,
// time-compatible experiences into a same-day plan. Deterministic, same
// spirit as the scoring function — the AI Concierge only ever decides
// *whether* the traveler wants a plan and *how much time* they have
// (parsed in concierge.ts); which experiences go into it, in what order,
// and at what time is plain, explainable logic over data already on hand
// (score, lat/lng, duration, time_slots), not another LLM call.

const TRANSFER_BUFFER_HOURS = 0.5; // rough allowance for moving between venues
const MAX_STOPS = 3;
const PROXIMITY_KM_THRESHOLD = 8; // "nearby enough to bundle into one day"
const DEFAULT_BUDGET_HOURS = 5; // used when they asked for a plan but gave no duration

// Each window's real clock range — used so a stop is only ever scheduled
// during a slot it's actually offered in, rather than wherever a naive
// running total happens to land (e.g. never show a "night walk" at 3:30pm).
const WINDOW_RANGE: Record<Exclude<TimeWindow, 'any'>, [number, number]> = {
  morning: [6, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  night: [21, 24],
};
const WINDOW_START_HOUR: Record<TimeWindow, number> = { morning: 9, afternoon: 13, evening: 18, night: 21, any: 10 };

export type ItineraryStop = {
  experience: ScoredExperience;
  startHour: number; // absolute hour-of-day, e.g. 13.5 = 1:30pm
  durationHours: number;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function parseDurationHours(label: string): number {
  const hourMatch = label.match(/(\d+(?:\.\d+)?)\s*hour/i);
  if (hourMatch) return Number(hourMatch[1]);
  const minMatch = label.match(/(\d+)\s*min/i);
  if (minMatch) return Number(minMatch[1]) / 60;
  return 2; // sensible fallback if the label doesn't parse
}

// The earliest absolute hour, at or after currentHour, that this
// experience's own time_slots would actually have it open: immediately if
// currentHour already falls in one of its windows, or the start of the
// next such window later today. Returns null if none of its windows are
// still ahead (its only slot(s) have already passed for the day) — the
// caller should skip the candidate rather than force it into an
// incoherent time (e.g. a morning-only kayak trip at 4:30pm).
function nextCompatibleStart(exp: ScoredExperience, currentHour: number): number | null {
  const slots = exp.time_slots.filter((w): w is Exclude<TimeWindow, 'any'> => w in WINDOW_RANGE);
  if (!slots.length) return currentHour;
  if (slots.some((w) => currentHour >= WINDOW_RANGE[w][0] && currentHour < WINDOW_RANGE[w][1])) return currentHour;
  const futureStarts = slots.map((w) => WINDOW_RANGE[w][0]).filter((h) => h > currentHour).sort((a, b) => a - b);
  return futureStarts.length ? futureStarts[0] : null;
}

// experiences should already be the scored, ranked list from
// get_recommendations — this only selects and sequences a subset of it,
// never re-scores anything itself.
export function buildItinerary(
  experiences: ScoredExperience[],
  availableHours: number | null,
  preferredWindow: TimeWindow | null
): ItineraryStop[] {
  if (!experiences.length) return [];
  const budget = availableHours ?? DEFAULT_BUDGET_HOURS;
  const startOfDay = WINDOW_START_HOUR[preferredWindow ?? 'any'];

  const sorted = [...experiences].sort((a, b) => b.score - a.score);
  const anchor = sorted[0];
  // The anchor always anchors the plan even in the rare case its own
  // window has technically already passed relative to the day's default
  // start hour — every plan needs at least one stop, and it's the single
  // best-scored match overall.
  const anchorStart = nextCompatibleStart(anchor, startOfDay) ?? startOfDay;
  const anchorDuration = parseDurationHours(anchor.duration_label);
  const stops: ItineraryStop[] = [{ experience: anchor, startHour: anchorStart, durationHours: anchorDuration }];
  let clockHour = anchorStart + anchorDuration + TRANSFER_BUFFER_HOURS;

  for (const candidate of sorted.slice(1)) {
    if (stops.length >= MAX_STOPS) break;
    const distanceKm = haversineKm(anchor.lat, anchor.lng, candidate.lat, candidate.lng);
    if (distanceKm > PROXIMITY_KM_THRESHOLD) continue;

    const candidateStart = nextCompatibleStart(candidate, clockHour);
    if (candidateStart === null) continue; // its only window(s) have already passed today
    const candidateDuration = parseDurationHours(candidate.duration_label);
    // Reject on the TOTAL span from the start of the day, not just summed
    // durations — a stop whose own window is hours away would otherwise
    // silently blow the traveler's stated time budget via the gap alone.
    const projectedSpan = candidateStart + candidateDuration - startOfDay;
    if (projectedSpan > budget) continue;

    stops.push({ experience: candidate, startHour: candidateStart, durationHours: candidateDuration });
    clockHour = candidateStart + candidateDuration + TRANSFER_BUFFER_HOURS;
  }

  // Greedy selection order follows score, not time — re-sort for display
  // so the plan always reads chronologically top to bottom.
  return stops.sort((a, b) => a.startHour - b.startHour);
}

export function formatStopTime(startHour: number): string {
  const hour24 = Math.floor(startHour) % 24;
  const minutes = Math.round((startHour % 1) * 60);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Full span of the day the plan occupies (first stop's start to last
// stop's end), which can be larger than the sum of durations alone if a
// gap opened up waiting for a later stop's window — an honest reflection
// of the actual time commitment, not just "hours spent doing things".
export function totalItineraryHours(stops: ItineraryStop[]): number {
  if (!stops.length) return 0;
  const first = stops[0];
  const last = stops[stops.length - 1];
  return last.startHour + last.durationHours - first.startHour;
}
