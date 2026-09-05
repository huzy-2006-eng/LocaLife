import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Heart, IndianRupee, Plus, TrendingUp, Users, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { INTEREST_TAGS, TIME_WINDOWS, type Experience } from '@/types';

const AHMEDABAD = { lat: 23.0225, lng: 72.5714 };

type Counts = { views: number; saves: number; interest: number; bookings: number };

export function HostDashboard({ onBack }: { onBack: () => void }) {
  const { session, hostProfile, saveHostProfile } = useAuth();
  const [listings, setListings] = useState<Experience[]>([]);
  const [counts, setCounts] = useState<Counts>({ views: 0, saves: 0, interest: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [businessName, setBusinessName] = useState('');

  async function load() {
    if (!session) return;
    setLoading(true);
    const { data: exps } = await supabase
      .from('experiences')
      .select('*')
      .eq('host_id', session.user.id)
      .order('created_at', { ascending: false });
    setListings((exps ?? []) as Experience[]);

    const ids = (exps ?? []).map((e) => e.id);
    if (ids.length) {
      const { data: interactions } = await supabase.from('interactions').select('type').in('experience_id', ids);
      const next: Counts = { views: 0, saves: 0, interest: 0, bookings: 0 };
      for (const row of interactions ?? []) {
        if (row.type === 'view') next.views += 1;
        else if (row.type === 'save') next.saves += 1;
        else if (row.type === 'interest') next.interest += 1;
        else if (row.type === 'book') next.bookings += 1;
      }
      setCounts(next);
    } else {
      setCounts({ views: 0, saves: 0, interest: 0, bookings: 0 });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  if (!hostProfile) {
    return (
      <section className="full-view host-dashboard">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to discovery</button>
        <div className="onboarding-card business-setup">
          <div className="eyebrow compact"><span className="eyebrow-line" />ONE LAST STEP</div>
          <h2>Name your <em>business.</em></h2>
          <p className="onboarding-copy">This is what travelers will see as your host name on listings.</p>
          <input className="text-input" placeholder="e.g. Gota Pottery Studio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          <button className="modal-submit onboarding-submit" disabled={!businessName} onClick={() => saveHostProfile(businessName)}>
            Continue
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="full-view host-dashboard">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to discovery</button>
      <div className="dashboard-header">
        <div>
          <div className="eyebrow compact"><span className="eyebrow-line" />HOST STUDIO</div>
          <h2>Make your corner of the city <em>matter.</em></h2>
          <p>Welcome back, {hostProfile.business_name}. Here's how your experiences are connecting with curious people.</p>
        </div>
        <button className="primary-action" onClick={() => setShowForm(true)}><Plus size={16} /> Add experience</button>
      </div>

      <div className="metric-grid">
        <div className="metric-card"><span className="metric-icon"><Users size={18} /></span><small>PROFILE VIEWS</small><strong>{counts.views}</strong><span className="metric-note">Across {listings.length} live {listings.length === 1 ? 'listing' : 'listings'}</span></div>
        <div className="metric-card"><span className="metric-icon"><Heart size={18} /></span><small>SAVES + INTEREST</small><strong>{counts.saves + counts.interest}</strong><span className="metric-note">{counts.saves} saves, {counts.interest} interested</span></div>
        <div className="metric-card"><span className="metric-icon"><IndianRupee size={18} /></span><small>BOOKING REQUESTS</small><strong>{counts.bookings}</strong><span className="metric-up"><TrendingUp size={13} /> Live count</span></div>
      </div>

      <div className="listing-panel">
        <div className="panel-title"><div><span className="eyebrow compact"><span className="eyebrow-line" />YOUR LISTINGS</span><h3>Live experiences</h3></div></div>
        {loading && <p className="onboarding-copy">Loading...</p>}
        {!loading && listings.length === 0 && (
          <div className="listing-row">
            <div className="listing-placeholder"><Plus size={20} /></div>
            <div><strong>Share your first experience</strong><span>Turn a favorite ritual into something travelers can book.</span></div>
            <button className="row-action add-row" onClick={() => setShowForm(true)}>Create listing <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} /></button>
          </div>
        )}
        {listings.map((listing) => (
          <div className="listing-row" key={listing.id}>
            <img src={listing.image_url} alt={listing.title} />
            <div>
              <strong>{listing.title}</strong>
              <span>{listing.location_name} &nbsp;·&nbsp; ₹{listing.price}</span>
            </div>
            <span className="live-status"><Check size={12} /> Live</span>
          </div>
        ))}
      </div>

      {showForm && <NewListingForm onClose={() => setShowForm(false)} onCreated={load} hostId={session!.user.id} />}
    </section>
  );
}

function NewListingForm({ onClose, onCreated, hostId }: { onClose: () => void; onCreated: () => void; hostId: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [price, setPrice] = useState(500);
  const [capacity, setCapacity] = useState(8);
  const [locationName, setLocationName] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [duration, setDuration] = useState('2 hours');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const { error: insertError } = await supabase.from('experiences').insert({
      host_id: hostId,
      title,
      description,
      tags,
      price,
      capacity,
      location_name: locationName,
      lat: AHMEDABAD.lat + (Math.random() - 0.5) * 0.08,
      lng: AHMEDABAD.lng + (Math.random() - 0.5) * 0.08,
      time_slots: timeSlots,
      duration_label: duration,
      image_url: imageUrl.trim(),
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onCreated();
    onClose();
  }

  const valid = title && description && locationName && tags.length && timeSlots.length && imageUrl.trim() && !imageError;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="concierge-modal listing-form" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <div className="eyebrow compact"><span className="eyebrow-line" />NEW LISTING</div>
        <h2>Share what you <em>know best.</em></h2>

        <div className="auth-form">
          <input className="text-input" placeholder="Title, e.g. Clay, chai & conversation" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="text-input listing-textarea" placeholder="Describe the experience..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="text-input" placeholder="Neighborhood, e.g. Gota, Ahmedabad" value={locationName} onChange={(e) => setLocationName(e.target.value)} />

          <label className="onboarding-label">Photo URL</label>
          <input
            className="text-input"
            placeholder="https://... a link to a real photo of this experience"
            value={imageUrl}
            onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
          />
          {imageUrl.trim() && (
            <div className="image-preview">
              {imageError ? (
                <span>Couldn't load that image — check the link.</span>
              ) : (
                <img src={imageUrl.trim()} alt="Preview" onError={() => setImageError(true)} onLoad={() => setImageError(false)} />
              )}
            </div>
          )}

          <label className="onboarding-label">Tags</label>
          <div className="tag-picker">
            {INTEREST_TAGS.map((tag) => (
              <button type="button" key={tag} className={tags.includes(tag) ? 'selected' : ''} onClick={() => toggle(tags, tag, setTags)}>{tag}</button>
            ))}
          </div>

          <label className="onboarding-label">Available</label>
          <div className="tag-picker">
            {TIME_WINDOWS.filter((w) => w.value !== 'any').map((w) => (
              <button type="button" key={w.value} className={timeSlots.includes(w.value) ? 'selected' : ''} onClick={() => toggle(timeSlots, w.value, setTimeSlots)}>{w.label.split(' (')[0]}</button>
            ))}
          </div>

          <div className="form-grid-2">
            <label>Price (₹ per person)<input className="text-input" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} /></label>
            <label>Capacity<input className="text-input" type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></label>
          </div>
          <label>Duration<input className="text-input" value={duration} onChange={(e) => setDuration(e.target.value)} /></label>
        </div>

        {error && <p className="form-error">{error}</p>}
        <button className="modal-submit" disabled={!valid || busy} onClick={submit}>{busy ? 'Publishing...' : 'Publish listing'}</button>
      </div>
    </div>
  );
}
