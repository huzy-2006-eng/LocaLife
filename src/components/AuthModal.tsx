import { useState } from 'react';
import { Compass, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [role, setRole] = useState<Role>('traveler');
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
    else onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="concierge-modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <div className="modal-spark"><Compass size={23} /></div>
        <div className="eyebrow compact"><span className="eyebrow-line" />{mode === 'signup' ? 'JOIN LOCAL.' : 'WELCOME BACK'}</div>
        <h2>{mode === 'signup' ? <>Find your kind<br /><em>of curious.</em></> : <>Good to see<br /><em>you again.</em></>}</h2>

        {mode === 'signup' && (
          <div className="role-picker">
            <button className={role === 'traveler' ? 'selected' : ''} onClick={() => setRole('traveler')} type="button">
              I'm traveling
            </button>
            <button className={role === 'host' ? 'selected' : ''} onClick={() => setRole('host')} type="button">
              I host experiences
            </button>
          </div>
        )}

        <div className="auth-form">
          {mode === 'signup' && (
            <input className="text-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className="text-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="text-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="modal-submit" onClick={submit} disabled={busy || !email || !password || (mode === 'signup' && !name)}>
          {busy ? 'One moment...' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>

        <button className="switch-mode" type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(null); }}>
          {mode === 'signup' ? 'Already have an account? Sign in' : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
