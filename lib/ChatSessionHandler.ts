import { supabase } from '../lib/supabase';

interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  last_message?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

export class ChatSessionManager {
  private static MAX_SESSIONS = 20;

  static async getOrCreateSession(userId: string): Promise<string> {
    try {
      // Check for recent session (last 6 hours)
      const { data: recentSession } = await supabase
        .from('chat_sessions')
        .select()
        .eq('user_id', userId)
        .gt('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentSession) return recentSession.id;

      // Create new session
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_name: `Chat ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      return newSession.id;

    } catch (error) {
      console.error('Session error:', error);
      throw new Error('Failed to initialize chat session');
    }
  }

  static async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(this.MAX_SESSIONS);

      return sessions || [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  static async loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select()
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      return messages?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isAI: msg.is_ai,
        timestamp: new Date(msg.created_at)
      })) || [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  static async createNewSession(userId: string): Promise<string> {
    try {
      // Clean up old sessions if we have too many
      await this.cleanupOldSessions(userId);

      const { data: session } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_name: `Chat ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      return session.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create new session');
    }
  }

  private static async cleanupOldSessions(userId: string): Promise<void> {
    try {
      // Get all sessions ordered by date (oldest first)
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (sessions && sessions.length > this.MAX_SESSIONS) {
        // Delete oldest sessions beyond our limit
        const toDelete = sessions.slice(0, sessions.length - this.MAX_SESSIONS);
        const idsToDelete = toDelete.map((s: { id: string }) => s.id);
        
        await supabase
          .from('chat_sessions')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }
}