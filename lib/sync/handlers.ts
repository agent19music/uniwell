import { supabase } from '@/lib/supabase';

import type { MutationRecord } from './types';

export async function applyMutation(record: MutationRecord) {
  if (record.entity === 'journal') {
    if (record.op === 'create') {
      const { error } = await supabase.from('journal_entries').insert(record.payload);
      if (error) throw error;
      return;
    }
    if (record.op === 'update') {
      const { error } = await supabase.from('journal_entries').update(record.payload).eq('id', record.entityId);
      if (error) throw error;
      return;
    }
    const { error } = await supabase.from('journal_entries').delete().eq('id', record.entityId);
    if (error) throw error;
    return;
  }

  throw new Error(`No sync handler for ${record.entity}:${record.op}`);
}
