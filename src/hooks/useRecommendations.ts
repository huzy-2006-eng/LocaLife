import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ScoredExperience, TimeWindow } from '@/types';

type Overrides = {
  tags?: string[] | null;
  budget_max?: number | null;
  time_window?: TimeWindow | null;
};

export function useRecommendations(userId: string | undefined, overrides?: Overrides) {
  const [experiences, setExperiences] = useState<ScoredExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('get_recommendations', {
      p_user_id: userId ?? null,
      p_tags: overrides?.tags ?? null,
      p_budget_max: overrides?.budget_max ?? null,
      p_time_window: overrides?.time_window ?? null,
      p_limit: 50,
    });

    if (rpcError) {
      setError(rpcError.message);
      setExperiences([]);
    } else {
      setExperiences((data ?? []) as ScoredExperience[]);
    }
    setLoading(false);
  }, [userId, overrides?.tags?.join(','), overrides?.budget_max, overrides?.time_window]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { experiences, loading, error, refetch: fetchRecommendations };
}

export async function logInteraction(userId: string, experienceId: string, type: string) {
  await supabase.from('interactions').insert({ user_id: userId, experience_id: experienceId, type });
}
