import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/query/keys';

import { fetchMoodEntries } from './api';

export function useMoodEntries() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: queryKeys.mood(userId),
    queryFn: () => fetchMoodEntries(userId),
    enabled: Boolean(userId),
  });
}
