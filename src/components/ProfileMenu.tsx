import { LogOut, Sliders } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ProfileMenu({ onEditPreferences, onClose }: { onEditPreferences: () => void; onClose: () => void }) {
  const { profile, travelerProfile, hostProfile, signOut } = useAuth();

  return (
    <div className="dropdown-panel profile-panel" onClick={(e) => e.stopPropagation()}>
      <div className="profile-panel-header">
        <span className="avatar">{profile?.name?.charAt(0) ?? '?'}</span>
        <div>
          <strong>{profile?.name}</strong>
          <span>{profile?.role === 'host' ? hostProfile?.business_name ?? 'Host' : `Traveler · ${profile?.city}`}</span>
        </div>
      </div>

      {profile?.role === 'traveler' && travelerProfile && (
        <button className="dropdown-item" onClick={onEditPreferences}>
          <Sliders size={15} /> Edit preferences
        </button>
      )}

      <button className="dropdown-item danger" onClick={() => { signOut(); onClose(); }}>
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}
