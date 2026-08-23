import NetInfo from '@react-native-community/netinfo';

import { applyMutation } from './handlers';
import { mutationLog } from './mutationLog';

const BACKOFF_MS = [2_000, 8_000, 30_000, 120_000];

class SyncWorker {
  private running = false;

  start() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected) void this.flush();
    });
    void this.flush();
  }

  async retry(id: string) {
    await mutationLog.update(id, { status: 'pending', nextAttemptAt: Date.now(), lastError: null });
    return this.flush();
  }

  async flush() {
    if (this.running) return;
    this.running = true;
    try {
      const queue = await mutationLog.pending();
      for (const record of queue) {
        if (record.status === 'failed' && record.nextAttemptAt > Date.now()) continue;
        const blockers = record.dependsOn
          ? queue.filter((item) => item.id === record.dependsOn && item.status !== 'synced')
          : [];
        if (blockers.length > 0) continue;

        await mutationLog.update(record.id, { status: 'syncing' });
        try {
          await applyMutation(record);
          await mutationLog.update(record.id, { status: 'synced', lastError: null });
          await mutationLog.remove(record.id);
        } catch (error) {
          const attempt = record.attempt + 1;
          const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
          await mutationLog.update(record.id, {
            status: 'failed',
            attempt,
            nextAttemptAt: Date.now() + delay,
            lastError: error instanceof Error ? error.message : 'Sync failed',
          });
        }
      }
    } finally {
      this.running = false;
    }
  }
}

export const syncWorker = new SyncWorker();
