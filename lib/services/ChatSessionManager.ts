import { supabase } from '../supabase';

interface ChatSession {
  id: string;
  user_id: string;
  session_name: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
}

export class ChatSessionManager {
  static async getOrCreateSession(userId: string): Promise<string> {
    try {
      // Try to get the most recent session
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        return sessions[0].id;
      }

      // Create new session if none exists
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_name: `Chat ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (error) throw error;
      return newSession.id;
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw new Error('Failed to get or create chat session');
    }
  }

  static async createNewSession(userId: string): Promise<string> {
    try {
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          session_name: `Chat ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (error) throw error;
      return newSession.id;
    } catch (error) {
      console.error('Error creating new session:', error);
      throw new Error('Failed to create new chat session');
    }
  }

  static async loadChatHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        isAI: msg.is_ai,
        timestamp: new Date(msg.created_at)
      }));
    } catch (error) {
      console.error('Error loading chat history:', error);
      throw new Error('Failed to load chat history');
    }
  }

  static async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error('Failed to get user sessions');
    }
  }
} 