import type { ScoredExperience } from '@/types';

// Turns the scoring function's numeric components into the "why this fits
// you" sentence the PS6 brief asks for (§5 Step 3) — done here in plain TS
// rather than an LLM call, since the inputs are already the exact numbers
// the sentence describes (nothing to interpret, just to phrase).
export function reasonSentence(e: ScoredExperience, travelerTags: string[]): string {
  const parts: string[] = [];
  const overlap = e.tags.filter((t) => travelerTags.includes(t));

  if (overlap.length) parts.push(`matches your interest in ${overlap.join(' and ')}`);
  if (e.time_fit >= 1) parts.push('fits your free time window');
  if (e.budget_fit >= 0.95) parts.push('comfortably within budget');
  if (e.hidden_gem_bonus > 0) parts.push("it's a highly-rated hidden gem nearby");
  if (e.proximity >= 0.8) parts.push('close to where you are');

  if (!parts.length) return `A well-rated pick (${e.rating}★) worth a look.`;
  const [first, ...rest] = parts;
  return `${first[0].toUpperCase()}${first.slice(1)}${rest.length ? `, and ${rest.join(', ')}` : ''}.`;
}
