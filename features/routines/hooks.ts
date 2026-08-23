import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/query/keys';

import { fetchRoutines } from './api';

export function useRoutines() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: queryKeys.routines(userId),
    queryFn: () => fetchRoutines(userId),
    enabled: Boolean(userId),
  });
}
