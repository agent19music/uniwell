import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import { enqueueMutation } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

export async function fetchRoutines(userId: string) {
  const { data, error } = await supabase
    .from('routines')
    .select('id, user_id, name, frequency, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRoutineCheckIn(
  userId: string,
  input: { id: string; routine_id: string },
) {
  await enqueueMutation({
    entityId: input.id,
    entity: 'routine',
    op: 'create',
    payload: { id: input.id, user_id: userId, routine_id: input.routine_id, event_type: 'tick' },
    dependsOn: null,
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.routines(userId) });
}
