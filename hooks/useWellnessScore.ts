import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface WellnessScoreResult {
  score: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWellnessScore(): WellnessScoreResult {
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWellnessScore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Call the database function to calculate wellness score
      const { data, error: rpcError } = await supabase
        .rpc('calculate_user_wellness_score', {
          p_user_id: user.id
        });

      if (rpcError) {
        throw rpcError;
      }

      setScore(data || 0);
    } catch (err) {
      console.error('Error fetching wellness score:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wellness score');
      setScore(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWellnessScore();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchWellnessScore();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWellnessScore]);

  return {
    score,
    loading,
    error,
    refetch: fetchWellnessScore,
  };
}

