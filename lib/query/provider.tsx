import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type ReactNode } from 'react';

import { syncWorker } from '@/lib/sync';

import { queryClient } from './client';
import { bindQueryLifecycle } from './network';
import { queryPersister } from './persist';

export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const unbind = bindQueryLifecycle();
    syncWorker.start();
    return unbind;
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
