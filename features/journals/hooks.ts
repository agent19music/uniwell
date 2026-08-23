import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/query/keys';

import { createJournal, fetchJournals } from './api';
import { journalDraftSchema } from './schema';

export function useJournals() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const query = useQuery({
    queryKey: queryKeys.journals(userId),
    queryFn: () => fetchJournals(userId),
    enabled: Boolean(userId),
  });

  const create = useMutation({
    mutationFn: (draft: { title?: string; content: string }) => {
      const parsed = journalDraftSchema.parse(draft);
      return createJournal(userId, parsed);
    },
  });

  return { ...query, create };
}
