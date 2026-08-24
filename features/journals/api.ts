import { v4 as uuid } from 'uuid';

import { journalCache } from '@/lib/cache';
import { queryClient } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import { enqueueMutation } from '@/lib/sync';
import { supabase } from '@/lib/supabase';

export async function fetchJournals(userId: string) {
  const cached = await journalCache.getJournals(userId);
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, user_id, title, text_content, entry_date, is_pinned, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    if (cached) return cached.entries;
    throw error;
  }
  return data ?? cached?.entries ?? [];
}

export async function createJournal(userId: string, input: { title?: string; content: string }) {
  const id = uuid();
  const now = new Date().toISOString();
  const payload = {
    id,
    user_id: userId,
    title: input.title ?? null,
    text_content: input.content,
    journal_type: 'text',
    entry_date: now.slice(0, 10),
    is_pinned: false,
    created_at: now,
    updated_at: now,
  };
  await enqueueMutation({
    entityId: id,
    entity: 'journal',
    op: 'create',
    payload,
    dependsOn: null,
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.journals(userId) });
  return payload;
}
