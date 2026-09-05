import { useEffect, useState } from 'react';
import { Bell, Bookmark, Calendar, Eye, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Item = { id: string; type: string; created_at: string; title: string };

const ICONS: Record<string, typeof Eye> = { view: Eye, save: Bookmark, interest: Heart, book: Calendar };

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsMenu({ onClose }: { onClose: () => void }) {
  const { session, profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const isHost = profile?.role === 'host';

  useEffect(() => {
    async function load() {
      if (!session) return;
      setLoading(true);

      if (isHost) {
        const { data: exps } = await supabase.from('experiences').select('id').eq('host_id', session.user.id);
        const ids = (exps ?? []).map((e) => e.id);
        if (!ids.length) { setItems([]); setLoading(false); return; }
        const { data } = await supabase
          .from('interactions')
          .select('id, type, created_at, experiences(title)')
          .in('experience_id', ids)
          .neq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(8);
        setItems((data ?? []).map((r: any) => ({ id: r.id, type: r.type, created_at: r.created_at, title: r.experiences?.title ?? 'a listing' })));
      } else {
        const { data } = await supabase
          .from('interactions')
          .select('id, type, created_at, experiences(title)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(8);
        setItems((data ?? []).map((r: any) => ({ id: r.id, type: r.type, created_at: r.created_at, title: r.experiences?.title ?? 'a listing' })));
      }
      setLoading(false);
    }
    load();
  }, [session, isHost]);

  function sentence(item: Item) {
    if (isHost) {
      if (item.type === 'view') return `Someone viewed "${item.title}"`;
      if (item.type === 'save') return `Someone saved "${item.title}"`;
      if (item.type === 'interest' || item.type === 'book') return `New booking request for "${item.title}"`;
    } else {
      if (item.type === 'view') return `You viewed "${item.title}"`;
      if (item.type === 'save') return `You saved "${item.title}"`;
      if (item.type === 'interest' || item.type === 'book') return `You requested to book "${item.title}"`;
    }
    return item.title;
  }

  return (
    <div className="dropdown-panel notifications-panel" onClick={(e) => e.stopPropagation()}>
      <div className="dropdown-title">Notifications</div>
      {loading && <p className="dropdown-empty">Loading...</p>}
      {!loading && items.length === 0 && (
        <p className="dropdown-empty"><Bell size={18} /> {isHost ? 'No activity on your listings yet.' : 'No activity yet — go save or book something.'}</p>
      )}
      {!loading && items.map((item) => {
        const Icon = ICONS[item.type] ?? Bell;
        return (
          <div className="notification-row" key={item.id}>
            <span className="notification-icon"><Icon size={14} /></span>
            <div>
              <p>{sentence(item)}</p>
              <span>{timeAgo(item.created_at)}</span>
            </div>
          </div>
        );
      })}
      <button className="dropdown-close" onClick={onClose}>Close</button>
    </div>
  );
}
