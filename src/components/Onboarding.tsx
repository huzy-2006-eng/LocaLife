import { useState } from 'react';
import { ArrowRight, Compass, IndianRupee } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { INTEREST_TAGS, TIME_WINDOWS, type TimeWindow } from '@/types';

const AHMEDABAD = { lat: 23.0225, lng: 72.5714 };

type OnboardingProps = {
  initial?: { interest_tags?: string[]; budget_max?: number; time_window?: TimeWindow };
  onDone?: () => void;
};

export function Onboarding({ initial, onDone }: OnboardingProps = {}) {
  const { saveTravelerProfile } = useAuth();
  const [tags, setTags] = useState<string[]>(initial?.interest_tags ?? []);
  const [budgetMax, setBudgetMax] = useState(initial?.budget_max ?? 1500);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(initial?.time_window ?? 'evening');
  const [busy, setBusy] = useState(false);

  function toggleTag(tag: string) {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));
  }

  async function finish() {
    setBusy(true);
    await saveTravelerProfile({
      interest_tags: tags,
      budget_min: 0,
      budget_max: budgetMax,
      time_window: timeWindow,
      lat: AHMEDABAD.lat,
      lng: AHMEDABAD.lng,
    });
    setBusy(false);
    onDone?.();
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="modal-spark"><Compass size={23} /></div>
        <div className="eyebrow compact"><span className="eyebrow-line" />QUICK SETUP</div>
        <h2>What kind of day<br /><em>are you after?</em></h2>
        <p className="onboarding-copy">Pick a few interests, a budget, and when you're free — the feed personalizes instantly.</p>

        <label className="onboarding-label">Interests</label>
        <div className="tag-picker">
          {INTEREST_TAGS.map((tag) => (
            <button key={tag} className={tags.includes(tag) ? 'selected' : ''} onClick={() => toggleTag(tag)} type="button">
              {tag}
            </button>
          ))}
        </div>

        <label className="onboarding-label">Budget per experience — up to ₹{budgetMax}</label>
        <div className="budget-slider">
          <IndianRupee size={16} />
          <input type="range" min={200} max={3000} step={50} value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} />
        </div>

        <label className="onboarding-label">When are you free?</label>
        <div className="tag-picker">
          {TIME_WINDOWS.filter((w) => w.value !== 'any').map((w) => (
            <button key={w.value} className={timeWindow === w.value ? 'selected' : ''} onClick={() => setTimeWindow(w.value)} type="button">
              {w.label.split(' (')[0]}
            </button>
          ))}
        </div>

        <button className="modal-submit onboarding-submit" onClick={finish} disabled={busy || tags.length === 0}>
          {busy ? 'Saving...' : initial ? 'Save preferences' : 'Show me my feed'} <ArrowRight size={17} />
        </button>
        {tags.length === 0 && <p className="onboarding-hint">Pick at least one interest to continue.</p>}
      </div>
    </div>
  );
}
