import { supabase } from '@/lib/supabase';

/** SemesterContext remains the timetable owner; this is the typed fetch path. */
export async function fetchSemesters(userId: string) {
  const { data, error } = await supabase
    .from('semesters')
    .select('id, user_id, name, type, start_date, end_date, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
