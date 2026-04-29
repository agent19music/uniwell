export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  type: 'text' | 'voice' | 'video';
  is_pinned: boolean;
  created_at: string;
  timestamp: string; // For local compatibility
}
