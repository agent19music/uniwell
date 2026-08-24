import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import { enqueueMutation } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

export async function fetchSleepEntries(userId: string) {
  const { data, error } = await supabase
    .from('sleep_data')
    .select('id, user_id, sleep_time, wake_time, quality, notes, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSleepEntry(
  userId: string,
  input: { id: string; sleep_time: string; wake_time: string; quality?: number },
) {
  await enqueueMutation({
    entityId: input.id,
    entity: 'sleep',
    op: 'create',
    payload: { ...input, user_id: userId },
    dependsOn: null,
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.sleep(userId) });
}
