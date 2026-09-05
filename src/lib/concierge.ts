import { INTEREST_TAGS, type ConciergeFilters, type TimeWindow } from '@/types';

// Turns a free-text request ("under 1000, this evening, something creative")
// into the structured {tags, budget_max, time_window} filter object that
// get_recommendations() consumes — PS6 brief §5, Step 2. The LLM here only
// ever produces this filter object; it never sees or reorders the actual
// results, so the ranking stays deterministic and explainable regardless of
// what the model returns. If no Groq key is configured, or the call fails
// for any reason (network, rate limit, malformed response), this falls back
// to a local keyword parser so the concierge never just breaks.

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
export const isConciergeLLMConfigured = Boolean(GROQ_API_KEY);

export async function parseConciergeQuery(query: string): Promise<ConciergeFilters> {
  if (GROQ_API_KEY) {
    try {
      const result = await parseWithGroq(query, GROQ_API_KEY);
      if (result) return result;
    } catch (err) {
      console.warn('[concierge] Groq call failed, falling back to keyword parser:', err);
    }
  }
  return parseWithHeuristics(query);
}

async function parseWithGroq(query: string, apiKey: string): Promise<ConciergeFilters | null> {
  const systemPrompt = `You extract structured search filters from a traveler's free-text request for a local-experiences app. Respond with ONLY a JSON object, no other text, matching exactly this shape:
{"tags": string[], "budget_max": number | null, "time_window": "morning" | "afternoon" | "evening" | "night" | null, "mood": string}

Rules:
- "tags" must only contain values from this exact list: ${INTEREST_TAGS.join(', ')}. Include every tag that plausibly matches the request. Empty array if none clearly apply.
- "budget_max" is the highest price (in rupees) the traveler mentioned, or null if no budget was stated.
- "time_window" must be exactly one of "morning", "afternoon", "evening", "night", or null if unstated — never any other word. Map "tonight"/"late" to "night". Infer it from context even if not explicitly a filter (e.g. "a romantic evening" implies "evening").
- "mood" is a short (2-4 word) description of the vibe they're after, e.g. "quiet and relaxed" or "cheap and fun".`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      response_format: { type: 'json_object' },
      // gpt-oss models reason before answering; "low" keeps that brief so
      // the real content isn't crowded out by max_tokens on a query this
      // small, while still reasoning enough to catch implied context.
      reasoning_effort: 'low',
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!response.ok) throw new Error(`Groq API returned ${response.status}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq response had no content');

  const parsed = JSON.parse(content);
  const tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t: unknown) => INTEREST_TAGS.includes(t as never)) : [];
  const budget_max = typeof parsed.budget_max === 'number' ? parsed.budget_max : null;
  const validWindows: TimeWindow[] = ['morning', 'afternoon', 'evening', 'night'];
  // Normalize common near-misses the model might still return despite the
  // prompt's instruction, rather than silently dropping the signal.
  const rawWindow = typeof parsed.time_window === 'string' ? parsed.time_window.toLowerCase() : null;
  const windowAliases: Record<string, TimeWindow> = { tonight: 'night', late: 'night', today: 'afternoon' };
  const normalizedWindow = rawWindow ? (windowAliases[rawWindow] ?? rawWindow) : null;
  const time_window = validWindows.includes(normalizedWindow as TimeWindow) ? (normalizedWindow as TimeWindow) : null;
  const mood = typeof parsed.mood === 'string' && parsed.mood.trim() ? parsed.mood.trim() : 'open to anything';

  return { tags, budget_max, time_window, mood };
}

function parseWithHeuristics(query: string): ConciergeFilters {
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
