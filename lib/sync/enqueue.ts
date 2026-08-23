import { v4 as uuid } from 'uuid';

import { mutationLog } from './mutationLog';
import { syncWorker } from './syncWorker';
import type { MutationRecord } from './types';

export async function enqueueMutation(
  input: Omit<MutationRecord, 'id' | 'attempt' | 'nextAttemptAt' | 'status' | 'lastError' | 'createdAt'> & {
    id?: string;
  },
) {
  const record: MutationRecord = {
    id: input.id ?? uuid(),
    entityId: input.entityId,
    entity: input.entity,
    op: input.op,
    payload: input.payload,
    dependsOn: input.dependsOn,
    attempt: 0,
    nextAttemptAt: Date.now(),
    status: 'pending',
    lastError: null,
    createdAt: Date.now(),
  };
  await mutationLog.enqueue(record);
  void syncWorker.flush();
  return record;
}
