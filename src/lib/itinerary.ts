import type { ScoredExperience, TimeWindow } from '@/types';

// Micro-Itinerary Bundling (PS6 brief §4): auto-group 2-3 nearby,
// time-compatible experiences into a same-day plan. Deterministic, same
// spirit as the scoring function — the AI Concierge only ever decides
// *whether* the traveler wants a plan and *how much time* they have
// (parsed in concierge.ts); which experiences go into it and in what order
// is plain, explainable logic over data already on hand (score, lat/lng,
// duration, time_slots), not another LLM call.

const TRANSFER_BUFFER_HOURS = 0.5; // rough allowance for moving between venues
const MAX_STOPS = 3;
const PROXIMITY_KM_THRESHOLD = 8; // "nearby enough to bundle into one day"
const DEFAULT_BUDGET_HOURS = 5; // used when they asked for a plan but gave no duration

const WINDOW_ORDER: TimeWindow[] = ['morning', 'afternoon', 'evening', 'night'];

export type ItineraryStop = {
  experience: ScoredExperience;
  startHour: number;
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

function windowRank(exp: ScoredExperience, preferredWindow: TimeWindow | null): number {
  if (preferredWindow && exp.time_slots.includes(preferredWindow)) return WINDOW_ORDER.indexOf(preferredWindow);
  const ranks = exp.time_slots.map((w) => WINDOW_ORDER.indexOf(w as TimeWindow)).filter((r) => r >= 0);
  return ranks.length ? Math.min(...ranks) : 1;
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

  const sorted = [...experiences].sort((a, b) => b.score - a.score);
  const anchor = sorted[0];
  const picked: ScoredExperience[] = [anchor];
  let usedHours = parseDurationHours(anchor.duration_label);

  for (const candidate of sorted.slice(1)) {
    if (picked.length >= MAX_STOPS) break;
    const distanceKm = haversineKm(anchor.lat, anchor.lng, candidate.lat, candidate.lng);
    if (distanceKm > PROXIMITY_KM_THRESHOLD) continue;
    const candidateHours = parseDurationHours(candidate.duration_label);
    const projected = usedHours + TRANSFER_BUFFER_HOURS + candidateHours;
    if (projected > budget) continue;
    picked.push(candidate);
    usedHours = projected;
  }

  // Sequence by time-of-day so the plan reads like a real day (morning
  // stop before an evening one), falling back to score order within the
  // same window.
  const ordered = picked
    .map((experience, originalIndex) => ({ experience, originalIndex }))
    .sort((a, b) => {
      const rankDiff = windowRank(a.experience, preferredWindow) - windowRank(b.experience, preferredWindow);
      return rankDiff !== 0 ? rankDiff : a.originalIndex - b.originalIndex;
    })
    .map((x) => x.experience);

  let clock = 0;
  return ordered.map((experience) => {
    const durationHours = parseDurationHours(experience.duration_label);
    const stop: ItineraryStop = { experience, startHour: clock, durationHours };
    clock += durationHours + TRANSFER_BUFFER_HOURS;
    return stop;
  });
}

const WINDOW_START_HOUR: Record<TimeWindow, number> = { morning: 9, afternoon: 13, evening: 18, night: 21, any: 10 };

export function formatStopTime(startHour: number, preferredWindow: TimeWindow | null): string {
  const baseHour = WINDOW_START_HOUR[preferredWindow ?? 'any'];
  const total = baseHour + startHour;
  const hour24 = Math.floor(total) % 24;
  const minutes = Math.round((total % 1) * 60);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function totalItineraryHours(stops: ItineraryStop[]): number {
  if (!stops.length) return 0;
  const last = stops[stops.length - 1];
  return last.startHour + last.durationHours;
}
