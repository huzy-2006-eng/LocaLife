import { INTEREST_TAGS, type ConciergeFilters, type TimeWindow } from '@/types';

// Turns a free-text request ("under 1000, this evening, something creative")
// into the structured {tags, budget_max, time_window} filter object that
// get_recommendations() consumes — see PS6 brief §5, Step 2. The brief calls
// for an LLM here; this keeps the same contract (parse-only, never invents
// results) but does it with local keyword rules so the concierge works with
// zero extra API keys. Swap the body of parseConciergeQuery for a real LLM
// call (Gemini/Groq with a structured-output prompt) without touching any
// other file — every caller only depends on this function's signature.
export function parseConciergeQuery(query: string): ConciergeFilters {
  const text = query.toLowerCase();

  const tags = INTEREST_TAGS.filter((tag) => {
    const synonyms: Record<string, string[]> = {
      food: ['food', 'eat', 'restaurant', 'snack', 'chai', 'dinner', 'lunch', 'breakfast', 'street food', 'hungry'],
      culture: ['culture', 'heritage', 'history', 'historic', 'temple', 'old city', 'walk', 'walking'],
      art: ['art', 'craft', 'paint', 'block print', 'pottery', 'creative', 'make', 'hands'],
      nightlife: ['nightlife', 'night', 'evening', 'bar', 'music', 'live music', 'ghazal'],
      nature: ['nature', 'river', 'outdoors', 'kayak', 'sunrise', 'green', 'park'],
      workshops: ['workshop', 'class', 'learn', 'hands-on', 'diy'],
      outdoors: ['outdoor', 'kite', 'walk', 'adventure', 'riverside'],
    };
    return (synonyms[tag] ?? [tag]).some((word) => text.includes(word));
  });

  const budgetMatch = text.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})/) ||
    text.match(/(?:rs\.?|inr|₹)\s*(\d{2,6})/);
  const budget_max = budgetMatch ? Number(budgetMatch[1]) : null;

  let time_window: TimeWindow | null = null;
  if (/tonight|night/.test(text)) time_window = 'night';
  else if (/this evening|evening/.test(text)) time_window = 'evening';
  else if (/this afternoon|afternoon/.test(text)) time_window = 'afternoon';
  else if (/this morning|morning|sunrise/.test(text)) time_window = 'morning';

  const moodWords = text.match(/quiet|relax|chill|adventure|creative|romantic|social|cheap|fun|authentic/g);
  const mood = moodWords ? Array.from(new Set(moodWords)).join(', ') : 'open to anything';

  return { tags, budget_max, time_window, mood };
}

export function explainMatch(filters: ConciergeFilters, experience: { title: string; tags: string[]; time_slots: string[] }): string {
  const reasons: string[] = [];
  const overlap = experience.tags.filter((t) => filters.tags.includes(t));
  if (overlap.length) reasons.push(`matches your interest in ${overlap.join(' and ')}`);
  if (filters.time_window && experience.time_slots.includes(filters.time_window)) {
    reasons.push(`fits your ${filters.time_window} slot`);
  }
  if (!reasons.length) reasons.push('a highly-rated pick nearby');
  return reasons.join(', ');
}
