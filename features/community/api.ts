import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export async function fetchCommunityFeed(cursor?: string) {
  let query = supabase
    .from('community_posts')
    .select('id, user_id, title, content, created_at, is_anonymous')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  const items = data ?? [];
  return {
    items,
    nextCursor: items.length === PAGE_SIZE ? items[items.length - 1]?.created_at : undefined,
  };
}
