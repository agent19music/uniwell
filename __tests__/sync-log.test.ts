import AsyncStorage from '@react-native-async-storage/async-storage';

import { mutationLog } from '@/lib/sync/mutationLog';
import type { MutationRecord } from '@/lib/sync/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function record(partial: Partial<MutationRecord>): MutationRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    entityId: '22222222-2222-4222-8222-222222222222',
    entity: 'journal',
    op: 'create',
    payload: { title: 'Note' },
    dependsOn: null,
    attempt: 0,
    nextAttemptAt: 0,
    status: 'pending',
    lastError: null,
    createdAt: 1,
    ...partial,
  };
}

describe('mutation log', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps failed operations instead of dropping them', async () => {
    await mutationLog.enqueue(record({ status: 'failed', lastError: 'offline', attempt: 3 }));
    const failed = await mutationLog.byStatus('failed');
    expect(failed).toHaveLength(1);
    expect(failed[0]?.lastError).toBe('offline');
  });

  it('returns pending work in created order', async () => {
    await mutationLog.enqueue(record({ id: '11111111-1111-4111-8111-111111111111', createdAt: 20 }));
    await mutationLog.enqueue(
      record({
        id: '33333333-3333-4333-8333-333333333333',
        createdAt: 10,
      }),
    );
    const pending = await mutationLog.pending();
    expect(pending.map((item) => item.createdAt)).toEqual([10, 20]);
  });
});
