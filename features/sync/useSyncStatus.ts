import { useEffect, useState } from 'react';

import { mutationLog, syncWorker, type MutationRecord } from '@/lib/sync';

export function useSyncStatus() {
  const [failed, setFailed] = useState<MutationRecord[]>([]);

  useEffect(() => {
    const refresh = async () => setFailed(await mutationLog.byStatus('failed'));
    void refresh();
    const unsubscribe = mutationLog.subscribe(() => {
      void refresh();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    failed,
    retry: (id: string) => syncWorker.retry(id),
  };
}
