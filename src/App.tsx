import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  ChevronDown,
  Compass,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRecommendations, logInteraction } from '@/hooks/useRecommendations';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { parseConciergeQuery } from '@/lib/concierge';
import { reasonSentence } from '@/lib/reasons';
import { INTEREST_TAGS, type ConciergeFilters, type ScoredExperience } from '@/types';
import { AuthModal } from '@/components/AuthModal';
import { Onboarding } from '@/components/Onboarding';
import { HostDashboard } from '@/components/HostDashboard';
import { LocalImpactMeter } from '@/components/LocalImpactMeter';

type View = 'home' | 'saved' | 'host';

const TABS = ['All for you', ...INTEREST_TAGS];

function App() {
  const { session, profile, travelerProfile, loading, signOut } = useAuth();

  const [activeInterest, setActiveInterest] = useState('All for you');
  const [view, setView] = useState<View>('home');
  const [selectedExperience, setSelectedExperience] = useState<ScoredExperience | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeQuery, setConciergeQuery] = useState('');
  const [conciergeFilters, setConciergeFilters] = useState<ConciergeFilters | null>(null);
  const [conciergeResults, setConciergeResults] = useState<ScoredExperience[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { experiences, loading: experiencesLoading, refetch } = useRecommendations(session?.user.id);

  useEffect(() => {
    async function loadSaved() {
      if (!session) {
        setSavedIds(new Set());
        return;
      }
      const { data } = await supabase.from('interactions').select('experience_id').eq('user_id', session.user.id).eq('type', 'save');
      setSavedIds(new Set((data ?? []).map((r) => r.experience_id)));
    }
    loadSaved();
  }, [session]);

  const baseList = conciergeResults ?? experiences;

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return baseList.filter((experience) => {
      const matchesInterest = activeInterest === 'All for you' || experience.tags.includes(activeInterest);
      const matchesQuery = !normalizedQuery || `${experience.title} ${experience.location_name}`.toLowerCase().includes(normalizedQuery);
      return matchesInterest && matchesQuery;
    });
  }, [baseList, activeInterest, query]);

  async function toggleSaved(experience: ScoredExperience) {
    if (!session) {
      setAuthModalOpen(true);
      return;
    }
    const isSaved = savedIds.has(experience.id);
    if (isSaved) {
      await supabase.from('interactions').delete().eq('user_id', session.user.id).eq('experience_id', experience.id).eq('type', 'save');
      setSavedIds((current) => { const next = new Set(current); next.delete(experience.id); return next; });
    } else {
      await logInteraction(session.user.id, experience.id, 'save');
      setSavedIds((current) => new Set(current).add(experience.id));
    }
  }

  function search() {
    setHasSearched(true);
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openExperience(experience: ScoredExperience) {
    setSelectedExperience(experience);
    if (session) await logInteraction(session.user.id, experience.id, 'view');
  }

  async function runConcierge() {
    const filters = parseConciergeQuery(conciergeQuery);
    setConciergeFilters(filters);
    const { data } = await supabase.rpc('get_recommendations', {
      p_user_id: session?.user.id ?? null,
      p_tags: filters.tags.length ? filters.tags : null,
      p_budget_max: filters.budget_max,
      p_time_window: filters.time_window,
      p_limit: 50,
    });
    setConciergeResults((data ?? []) as ScoredExperience[]);
    setConciergeOpen(false);
    setHasSearched(true);
    setActiveInterest('All for you');
    setQuery('');
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearConcierge() {
    setConciergeResults(null);
    setConciergeFilters(null);
    setHasSearched(false);
  }

  if (loading) {
    return <div className="app-shell"><div className="loading-screen"><Compass size={28} /></div></div>;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="app-shell">
        <div className="loading-screen config-warning">
          <Compass size={28} />
          <h2>Backend not configured</h2>
          <p>Copy <code>.env.example</code> to <code>.env</code>, add your Supabase project URL and anon key, then restart <code>npm run dev</code>.</p>
        </div>
      </div>
    );
  }

  if (session && profile?.role === 'traveler' && !travelerProfile) {
    return (
      <div className="app-shell">
        <Onboarding />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Local home">
          <span className="brand-mark"><Compass size={19} strokeWidth={2.3} /></span>
          <span>local<span className="brand-dot">.</span></span>
        </a>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Discover</button>
          {profile?.role === 'host' ? (
            <button className={view === 'host' ? 'active' : ''} onClick={() => setView('host')}>Host Studio</button>
          ) : (
            <button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}>Saved <span className="nav-count">{savedIds.size}</span></button>
          )}
        </nav>
        <div className="header-actions">
          <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button>
          {session ? (
            <>
              <button className="profile-button" aria-label="Open profile" onClick={() => setView('home')}>
                <span className="avatar">{profile?.name?.charAt(0) ?? '?'}</span><ChevronDown size={15} />
              </button>
              <button className="icon-button" aria-label="Sign out" onClick={() => { signOut(); setView('home'); }}><LogOut size={16} /></button>
            </>
          ) : (
            <button className="sign-in-button" onClick={() => setAuthModalOpen(true)}>Sign in</button>
          )}
          <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {view === 'host' && <HostDashboard onBack={() => setView('home')} />}

      {view === 'saved' && (
        <SavedView
          experiences={experiences.filter((e) => savedIds.has(e.id))}
          onBack={() => setView('home')}
          onOpen={openExperience}
          onToggleSave={toggleSaved}
        />
      )}

      {view === 'home' && (
        <main id="top">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" />YOUR NEXT GOOD DAY</div>
              <h1>Go beyond<br /><em>the obvious.</em></h1>
              <p className="hero-subtitle">Find the places, people, and small moments that make a city feel like yours.</p>
              <div className="search-panel">
                <div className="search-field">
                  <Search size={19} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && search()} placeholder="What do you feel like doing?" aria-label="Search experiences" />
                </div>
                <div className="search-location"><MapPin size={17} /><span>Ahmedabad</span><ChevronDown size={15} /></div>
                <button className="search-button" onClick={search}>Explore <ArrowRight size={17} /></button>
              </div>
              <div className="suggestions"><span>Try</span><button onClick={() => setQuery('food')}>food tonight</button><button onClick={() => setQuery('workshop')}>a creative workshop</button><button onClick={() => setQuery('hidden gem')}>a hidden gem</button></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-photo photo-main"><img src="/image copy.png" alt="" /></div>
              <div className="hero-photo photo-small"><img src="/image.png" alt="" /></div>
              <div className="hero-note"><Sparkles size={15} /><span>Made for curious people</span></div>
              <div className="hero-stamp">STAY<br />CURIOUS</div>
            </div>
          </section>

          <section className="personal-bar">
            {session && travelerProfile ? (
              <>
                <div className="personal-intro"><span className="personal-avatar">{profile?.name.charAt(0)}</span><div><strong>Good day, {profile?.name}</strong><span>Curated for your {profile?.city} days</span></div></div>
                <div className="personal-details"><span><span className="detail-label">YOUR TIME</span> {travelerProfile.time_window}</span><span><span className="detail-label">YOUR BUDGET</span> Under ₹{travelerProfile.budget_max}</span></div>
              </>
            ) : (
              <>
                <div className="personal-intro"><span className="personal-avatar"><Sparkles size={16} /></span><div><strong>Browsing as a guest</strong><span>Sign in to personalize your feed</span></div></div>
                <button className="edit-preferences" onClick={() => setAuthModalOpen(true)}>Sign in <ArrowRight size={15} /></button>
              </>
            )}
          </section>

          <section className="discover-section" id="discover">
            <div className="section-heading"><div><div className="eyebrow compact"><span className="eyebrow-line" />DISCOVER NEARBY</div><h2>Made for <em>your kind</em> of curious.</h2></div><button className="text-button" onClick={() => { setActiveInterest('All for you'); setQuery(''); }}>See all experiences <ArrowRight size={16} /></button></div>
            <div className="interest-tabs" role="tablist">{TABS.map((interest) => <button key={interest} className={activeInterest === interest ? 'selected' : ''} onClick={() => setActiveInterest(interest)} role="tab" aria-selected={activeInterest === interest}>{interest}{interest === 'All for you' && <Sparkles size={14} />}</button>)}</div>
            {hasSearched && (
              <div className="result-message">
                {conciergeFilters ? <>Concierge picks for “{conciergeQuery}” — mood: {conciergeFilters.mood}</> : <>Showing experiences {query ? `matching "${query}"` : 'for you'}</>}
                <button onClick={() => { setQuery(''); setHasSearched(false); clearConcierge(); }}><X size={14} /> Clear</button>
              </div>
            )}
            {experiencesLoading && <p className="onboarding-copy">Loading recommendations...</p>}
            <div className="experience-grid">
              {filteredExperiences.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  isSaved={savedIds.has(experience.id)}
                  onToggleSave={() => toggleSaved(experience)}
                  onOpen={() => openExperience(experience)}
                />
              ))}
            </div>
            {!experiencesLoading && filteredExperiences.length === 0 && <div className="empty-state"><Search size={24} /><strong>Nothing quite matches that yet.</strong><span>Try a broader search or explore all experiences.</span><button onClick={() => { setQuery(''); setActiveInterest('All for you'); clearConcierge(); }}>Reset discovery</button></div>}
          </section>

          <section className="concierge-section" id="concierge">
            <div className="concierge-icon"><MessageCircle size={27} /></div><div><div className="eyebrow compact"><span className="eyebrow-line" />NOT SURE YET?</div><h2>Ask your <em>local guide.</em></h2><p>Tell us what kind of day you're after. We'll find the right little thing.</p></div><button className="concierge-button" onClick={() => setConciergeOpen(true)}>Open Concierge <Sparkles size={16} /></button>
          </section>

          {profile?.role !== 'host' && (
            <section className="host-banner" id="become-a-host"><div><div className="eyebrow compact light"><span className="eyebrow-line" />FOR THE LOCALS</div><h2>You know the city<br /><em>better than anyone.</em></h2><p>Share your corner of it. Meet curious travelers. Make a little extra doing what you already love.</p></div><button className="light-button" onClick={() => setAuthModalOpen(true)}>Become a host <ArrowRight size={16} /></button><div className="host-shape" /></section>
          )}
        </main>
      )}

      <footer><div className="brand footer-brand"><span className="brand-mark"><Compass size={17} /></span><span>local<span className="brand-dot">.</span></span></div><span>Discover more of where you are.</span><div className="footer-links"><a href="#about">About</a><a href="#help">Help</a><a href="#privacy">Privacy</a></div></footer>

      {conciergeOpen && (
        <div className="modal-backdrop" onClick={() => setConciergeOpen(false)}>
          <div className="concierge-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setConciergeOpen(false)} aria-label="Close Concierge"><X size={19} /></button>
            <div className="modal-spark"><Sparkles size={23} /></div>
            <div className="eyebrow compact"><span className="eyebrow-line" />LOCAL CONCIERGE</div>
            <h2>What kind of day<br /><em>are you dreaming of?</em></h2>
            <p>Ask for anything — we'll keep it personal, nearby, and easy to love.</p>
            <textarea value={conciergeQuery} onChange={(event) => setConciergeQuery(event.target.value)} placeholder="Something fun after work, not too expensive..." autoFocus />
            <button className="modal-submit" onClick={runConcierge} disabled={!conciergeQuery.trim()}>Find my day <ArrowRight size={17} /></button>
            <div className="modal-prompts"><span>Try asking</span><button onClick={() => setConciergeQuery('Something cheap and fun tonight near me')}>cheap and fun tonight</button><button onClick={() => setConciergeQuery('A quiet creative workshop this afternoon')}>quiet creative workshop</button></div>
          </div>
        </div>
      )}

      {selectedExperience && (
        <ExperienceDetail
          experience={selectedExperience}
          isSaved={savedIds.has(selectedExperience.id)}
          onToggleSave={() => toggleSaved(selectedExperience)}
          onClose={() => setSelectedExperience(null)}
          onBook={async () => {
            if (!session) { setAuthModalOpen(true); return; }
            await logInteraction(session.user.id, selectedExperience.id, 'interest');
          }}
          travelerTags={travelerProfile?.interest_tags ?? conciergeFilters?.tags ?? []}
        />
      )}

      {authModalOpen && <AuthModal onClose={() => { setAuthModalOpen(false); refetch(); }} />}
    </div>
  );
}

function ExperienceCard({ experience, isSaved, onToggleSave, onOpen }: { experience: ScoredExperience; isSaved: boolean; onToggleSave: () => void; onOpen: () => void }) {
  const isHiddenGem = experience.hidden_gem_bonus > 0;
  return (
    <article className="experience-card" onClick={onOpen} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpen()}>
      <div className="card-image">
        <img src={experience.image_url} alt={experience.title} />
        <div className="card-overlay">
          <span className="category-tag">{experience.tags[0] ?? 'experience'}</span>
          <button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); onToggleSave(); }} aria-label={isSaved ? `Remove ${experience.title} from saved` : `Save ${experience.title}`}>
            {isSaved ? <Bookmark size={17} fill="currentColor" /> : <Bookmark size={17} />}
          </button>
        </div>
        {isHiddenGem && <span className="gem-badge"><Sparkles size={13} />Hidden gem</span>}
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{experience.title}</h3><span className="rating"><Star size={13} fill="currentColor" />{experience.rating}</span></div>
        <p className="card-description">{experience.description}</p>
        <div className="card-meta"><span><MapPin size={13} />{experience.location_name}</span><span>{experience.duration_label}</span></div>
        <div className="card-footer"><span className="host-by">with <strong>{experience.host_name}</strong></span><span className="price">₹{experience.price}<small> / person</small></span></div>
      </div>
    </article>
  );
}

function SavedView({ experiences, onBack, onOpen, onToggleSave }: { experiences: ScoredExperience[]; onBack: () => void; onOpen: (experience: ScoredExperience) => void; onToggleSave: (experience: ScoredExperience) => void }) {
  return (
    <section className="full-view">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to discovery</button>
      <div className="full-view-heading"><div><div className="eyebrow compact"><span className="eyebrow-line" />YOUR SHORTLIST</div><h2>Things worth <em>coming back to.</em></h2><p>Keep the places that made you pause close at hand.</p></div><div className="saved-summary"><Bookmark size={17} /> {experiences.length} saved {experiences.length === 1 ? 'experience' : 'experiences'}</div></div>
      {experiences.length ? (
        <div className="experience-grid saved-grid">
          {experiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} isSaved onToggleSave={() => onToggleSave(experience)} onOpen={() => onOpen(experience)} />)}
        </div>
      ) : (
        <div className="saved-empty"><Bookmark size={26} /><strong>Your shortlist is waiting.</strong><span>Tap the bookmark on anything that feels like your kind of day.</span><button onClick={onBack}>Explore experiences <ArrowRight size={15} /></button></div>
      )}
    </section>
  );
}

function ExperienceDetail({ experience, isSaved, onToggleSave, onClose, onBook, travelerTags }: {
  experience: ScoredExperience;
  isSaved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
  onBook: () => void;
  travelerTags: string[];
}) {
  const [requested, setRequested] = useState(false);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close detail"><X size={19} /></button>
        <div className="detail-image">
          <img src={experience.image_url} alt={experience.title} />
          {experience.hidden_gem_bonus > 0 && <span className="gem-badge"><Sparkles size={13} />Hidden gem</span>}
          <button className={`save-button large ${isSaved ? 'saved' : ''}`} onClick={onToggleSave} aria-label={isSaved ? 'Remove from saved' : 'Save experience'}>
            {isSaved ? <Bookmark size={19} fill="currentColor" /> : <Bookmark size={19} />}
          </button>
        </div>
        <div className="detail-content">
          <span className="category-tag">{experience.tags.join(', ')}</span>
          <h2>{experience.title}</h2>
          <div className="detail-meta"><span className="rating"><Star size={14} fill="currentColor" />{experience.rating}</span><span><MapPin size={14} />{experience.location_name}</span><span>{experience.duration_label}</span></div>
          <p className="detail-description">{experience.description}</p>
          <div className="why-this-fits"><Sparkles size={14} /><span>{reasonSentence(experience, travelerTags)}</span></div>
          <div className="detail-host"><span className="detail-host-avatar">{experience.host_name.charAt(0)}</span><div><small>YOUR HOST</small><strong>{experience.host_name}</strong></div></div>
          <LocalImpactMeter price={experience.price} />
          <div className="detail-footer">
            <span className="price large">₹{experience.price}<small> / person</small></span>
            <button className="search-button large" onClick={() => { onBook(); setRequested(true); }} disabled={requested}>
              {requested ? 'Request sent' : 'Request to book'} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
