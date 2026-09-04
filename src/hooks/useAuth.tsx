import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { HostProfile, Profile, Role, TravelerProfile } from '@/types';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  travelerProfile: TravelerProfile | null;
  hostProfile: HostProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: Role) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  saveTravelerProfile: (data: Omit<TravelerProfile, 'user_id' | 'updated_at'>) => Promise<{ error: string | null }>;
  saveHostProfile: (businessName: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [travelerProfile, setTravelerProfile] = useState<TravelerProfile | null>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(profileRow as Profile | null);

    if (profileRow?.role === 'traveler') {
      const { data: tp } = await supabase.from('traveler_profiles').select('*').eq('user_id', userId).maybeSingle();
      setTravelerProfile(tp as TravelerProfile | null);
    } else if (profileRow?.role === 'host') {
      const { data: hp } = await supabase.from('host_profiles').select('*').eq('user_id', userId).maybeSingle();
      setHostProfile(hp as HostProfile | null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setTravelerProfile(null);
        setHostProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, name: string, role: Role) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Sign up did not return a user — check that email confirmation is disabled for this demo project.' };

    const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, name, role });
    if (profileError) return { error: profileError.message };

    await loadProfile(data.user.id);
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function saveTravelerProfile(data: Omit<TravelerProfile, 'user_id' | 'updated_at'>) {
    if (!session) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('traveler_profiles')
      .upsert({ user_id: session.user.id, ...data, updated_at: new Date().toISOString() });
    if (error) return { error: error.message };
    await loadProfile(session.user.id);
    return { error: null };
  }

  async function saveHostProfile(businessName: string) {
    if (!session) return { error: 'Not signed in' };
    const { error } = await supabase
      .from('host_profiles')
      .upsert({ user_id: session.user.id, business_name: businessName });
    if (error) return { error: error.message };
    await loadProfile(session.user.id);
    return { error: null };
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, travelerProfile, hostProfile, loading, signUp, signIn, signOut, saveTravelerProfile, saveHostProfile, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
