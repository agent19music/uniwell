import { supabase } from '@/lib/supabase';

import type { MutationRecord } from './types';

const TABLES = {
  journal: 'journal_entries',
  mood: 'mood_entries',
  sleep: 'sleep_data',
  routine: 'routine_events',
  streak: 'streak_events',
} as const;

export async function applyMutation(record: MutationRecord) {
  const table = TABLES[record.entity];
  if (record.op === 'create') {
    const { error } = await supabase.from(table).insert(record.payload);
    if (error) throw error;
    return;
  }
  if (record.op === 'update') {
    const { error } = await supabase.from(table).update(record.payload).eq('id', record.entityId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(table).delete().eq('id', record.entityId);
  if (error) throw error;
}
