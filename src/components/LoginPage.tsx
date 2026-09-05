import { useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Heart, MessageCircle, Moon, ShieldCheck, Sparkles, Sun, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { Role } from '@/types';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Personalized, not generic',
    body: "Tell us your interests, budget, and free time — your feed is ranked for you, not for everyone.",
  },
  {
    icon: MessageCircle,
    title: "Ask, don't scroll",
    body: '"Something cheap and fun tonight" becomes a real, explained recommendation — no endless filtering.',
  },
  {
    icon: Heart,
    title: 'Hidden gems surface first',
    body: 'We rank up under-the-radar hosts, not just the ones with the most reviews.',
  },
  {
    icon: Users,
    title: 'Built for local hosts too',
    body: 'No marketing budget needed — list what you offer and reach travelers already looking for it.',
  },
];

export function LoginPage({ onBack, initialRole = 'traveler' }: { onBack: () => void; initialRole?: Role }) {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const result = mode === 'signup' ? await signUp(email, password, name, role) : await signIn(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    // On success, App's own effect watches session/profile and routes to
    // the right dashboard — this page just needs to stop rendering, which
    // happens automatically once that effect flips the view.
  }

  return (
    <div className="login-page">
      <div className="login-marketing">
        <div className="login-top-row">
          <button className="login-back" onClick={onBack} type="button"><ArrowLeft size={15} /> Continue browsing</button>
          <button
            className="login-theme-toggle"
            onClick={toggleTheme}
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        <a className="brand login-brand" href="#top"><span className="brand-mark light"><Compass size={19} strokeWidth={2.3} /></span><span>Loca<span className="brand-dot">Life</span></span></a>

        <div className="eyebrow light"><span className="eyebrow-line" />WHY LOCALIFE</div>
        <h1 className="login-headline">Real places.<br />Real hosts.<br /><em>No tourist traps.</em></h1>
        <p className="login-subcopy">
          LocaLife connects curious travelers with authentic experiences run by real people —
          and puts your money directly in their hands, not a booking platform's cut.
        </p>

        <div className="login-features">
          {FEATURES.map((f) => (
            <div className="login-feature" key={f.title}>
              <span className="login-feature-icon"><f.icon size={16} /></span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="login-stat"><ShieldCheck size={16} /> 88% of what you spend on LocaLife goes straight to your host</div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="role-picker">
            <button className={role === 'traveler' || mode === 'signin' ? 'selected' : ''} onClick={() => setRole('traveler')} type="button" disabled={mode === 'signin'}>
              I'm traveling
            </button>
            <button className={role === 'host' && mode === 'signup' ? 'selected' : ''} onClick={() => setRole('host')} type="button" disabled={mode === 'signin'}>
              I host experiences
            </button>
          </div>

          <div className="eyebrow compact"><span className="eyebrow-line" />{mode === 'signup' ? 'JOIN LOCALIFE' : 'WELCOME BACK'}</div>
          <h2>{mode === 'signup' ? <>Find your kind<br /><em>of curious.</em></> : <>Good to see<br /><em>you again.</em></>}</h2>

          <div className="auth-form">
            {mode === 'signup' && (
              <input className="text-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input className="text-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className="text-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="modal-submit onboarding-submit" onClick={submit} disabled={busy || !email || !password || (mode === 'signup' && !name)}>
            {busy ? 'One moment...' : mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={17} />
          </button>

          <button className="switch-mode" type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
            {mode === 'signup' ? 'Already have an account? Sign in' : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
