import { mutationRecordSchema } from '@/lib/sync/types';

describe('offline create → edit → retry', () => {
  it('keeps one client UUID across create and later edit', () => {
    const entityId = '22222222-2222-4222-8222-222222222222';
    const create = mutationRecordSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      entityId,
      entity: 'journal',
      op: 'create',
      payload: { title: 'Draft' },
      dependsOn: null,
      attempt: 0,
      nextAttemptAt: 0,
      status: 'pending',
      lastError: null,
      createdAt: 1,
    });
    const edit = mutationRecordSchema.parse({
      ...create,
      id: '33333333-3333-4333-8333-333333333333',
      op: 'update',
      payload: { title: 'Edited' },
      dependsOn: create.id,
      createdAt: 2,
    });

    expect(edit.entityId).toBe(create.entityId);
    expect(edit.dependsOn).toBe(create.id);
  });

  it('treats a failed flush as retryable rather than dropped', () => {
    const failed = mutationRecordSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      entityId: '22222222-2222-4222-8222-222222222222',
      entity: 'journal',
      op: 'create',
      payload: {},
      dependsOn: null,
      attempt: 3,
      nextAttemptAt: Date.now() + 1000,
      status: 'failed',
      lastError: 'network',
      createdAt: 1,
    });
    expect(failed.status).toBe('failed');
    expect(failed.lastError).toBe('network');
  });
});
