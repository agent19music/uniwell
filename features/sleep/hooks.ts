import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/query/keys';

import { fetchSleepEntries } from './api';

export function useSleepEntries() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: queryKeys.sleep(userId),
    queryFn: () => fetchSleepEntries(userId),
    enabled: Boolean(userId),
  });
}
