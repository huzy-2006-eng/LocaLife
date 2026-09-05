# LocaLife — PS6 Local & Experiences

HackCelestial 3.0, PS6: an intelligent local-discovery platform that connects
travelers with authentic local experiences (beyond the tourist-trap feed) and
gives small local hosts a real way to reach them.

## What's built

- **Traveler flow**: sign up, onboard (interests / budget / free time),
  personalized discovery feed, experience detail with a "why this fits you"
  explanation, save/shortlist, AI Concierge free-text search.
- **Host flow**: sign up as a host, create listings, see a live dashboard of
  views / saves / interest / booking-request counts per listing.
- **Recommendation engine**: deterministic weighted scoring computed in
  Postgres (`get_recommendations`, see [supabase/migrations/0002_scoring_function.sql](supabase/migrations/0002_scoring_function.sql)) —
  `0.40×interest_match + 0.25×budget_fit + 0.15×time_fit + 0.10×proximity + 0.10×hidden_gem_bonus`,
  exactly as specified in the brief.
- **Hidden Gem Score**: small ranking bonus for low review-count, high-rating
  listings; surfaced as a badge on cards.
- **Local Impact Meter**: shown on every experience detail page, modeling
  how much of the traveler's spend reaches the host directly vs. a typical
  OTA (assumptions stated inline in [src/components/LocalImpactMeter.tsx](src/components/LocalImpactMeter.tsx)).
- **AI Concierge**: free-text query → structured `{tags, budget_max, time_window}`
  filters → fed into the same scoring function. See Limitations below for how
  the parsing is implemented today.

## Stack

React + TypeScript + Vite + plain CSS (from the original bolt.new UI) on the
frontend; Supabase (Postgres + Auth) as the backend, no separate API server —
the frontend talks to Postgres directly via RLS-scoped `supabase-js` calls
and one `rpc()` call for scoring.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
3. **Run the schema.** In the Supabase dashboard → SQL Editor, run in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_scoring_function.sql`
   - `supabase/seed.sql` (optional demo data — 4 hosts, 8 Ahmedabad experiences)
4. **Disable email confirmation for the demo** (Authentication → Providers →
   Email → toggle off "Confirm email") so sign-up logs the user straight in
   without needing a real inbox.
5. **Configure env vars**
   ```bash
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   Project Settings → API.
6. **Run it**
   ```bash
   npm run dev
   ```

## Demo script (matches the brief, §10)

1. Sign up as a traveler → onboarding → personalized feed appears with a
   Hidden Gem badge on one card.
2. Open the AI Concierge, type a free-text request → filtered, explained
   results.
3. Open an experience → point out the Local Impact Meter.
4. Sign out, sign up as a host → Host Studio → create a listing → view its
   view/save counters tick up as a traveler browses it.

## Limitations (stated high, per the brief)

- **AI Concierge parsing is rule-based, not an LLM call.** The brief specs
  an LLM for query→filter extraction. To avoid requiring a second API key
  and external account just to run the demo, `src/lib/concierge.ts` uses
  keyword/regex heuristics with the exact same input/output contract
  (`{tags, budget_max, time_window, mood}`). Swapping in a real LLM call
  (Gemini/Groq, structured-output prompt) only requires changing the body of
  `parseConciergeQuery` — no other file depends on how it's implemented.
- **Micro-Itinerary Bundling, Swipe Discovery Mode, and the Hindi toggle**
  from the brief's differentiator list were not built — the brief explicitly
  says to pick 3–4 of 6, not all six. Hidden Gem Score, AI Concierge, and
  Local Impact Meter were chosen because they're what the brief's own demo
  script (§10) walks through.
- **Proximity scoring** uses a fixed Ahmedabad city-center coordinate for
  guests and for a traveler's onboarding location (no live geolocation
  permission flow) — real haversine distance is computed against that point,
  not the traveler's actual GPS position.
- **Local Impact Meter percentages are a stated modeling assumption**, not
  sourced figures — see the comment in `LocalImpactMeter.tsx` for the exact
  numbers used and why.
- **No production auth hardening**: sign-up uses Supabase's default email/password
  flow with confirmation disabled for demo convenience; not suitable to ship
  as-is to real users.
- **Seed script touches Supabase's internal `auth.users`/`auth.identities`
  tables** to create demo host accounts — a common but somewhat fragile seed
  pattern that can drift with Supabase's auth schema. If it errors, sign up
  hosts through the UI instead (see the comment at the top of `supabase/seed.sql`).
