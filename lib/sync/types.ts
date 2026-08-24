import { z } from 'zod';

export const mutationStatusSchema = z.enum(['pending', 'syncing', 'failed', 'synced']);

export const mutationRecordSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().uuid(),
  entity: z.enum(['journal', 'mood', 'sleep', 'routine', 'streak']),
  op: z.enum(['create', 'update', 'delete']),
  payload: z.record(z.unknown()),
  dependsOn: z.string().uuid().nullable(),
  attempt: z.number().int().nonnegative(),
  nextAttemptAt: z.number().int().nonnegative(),
  status: mutationStatusSchema,
  lastError: z.string().nullable(),
  createdAt: z.number().int(),
});

export type MutationRecord = z.infer<typeof mutationRecordSchema>;
export type MutationStatus = z.infer<typeof mutationStatusSchema>;
