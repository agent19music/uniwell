import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import { enqueueMutation } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

export async function fetchMoodEntries(userId: string) {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('id, user_id, mood_type, intensity, notes, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMoodEntry(
  userId: string,
  input: { id: string; mood_type: string; intensity: number; notes?: string },
) {
  await enqueueMutation({
    entityId: input.id,
    entity: 'mood',
    op: 'create',
    payload: { ...input, user_id: userId },
    dependsOn: null,
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.mood(userId) });
}
