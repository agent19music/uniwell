import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../supabase';
import { MoodType } from '../../contexts/MoodContext';

const RATE_LIMIT_DELAY = 2000; // 2 seconds between messages
const MAX_HISTORY_MESSAGES = 5; // Reduced context window
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY || '');

// System prompt with token optimization
const SYSTEM_PROMPT = `
You are Aria, an AI wellness assistant. Provide supportive, concise responses (1-2 paragraphs max).

Guidelines:
- Be empathetic and conversational
- Ask thoughtful follow-up questions
- Suggest coping strategies when appropriate
- Never diagnose or prescribe

Ethical Boundaries:
- Encourage professional help for serious concerns
- Direct to crisis resources when needed
`;

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export class ChatService {
  private model: any;
  private lastRequestTime: number = 0;
  private retryCount: number = 0;

  constructor() {
    this.initializeModel();
  }

  private initializeModel() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 800 // Limit response length
      }
    });
  }

  async sendMessage(
    userMessage: string, 
    history: ChatMessage[],
    mood?: MoodType
  ): Promise<{ response: string; history: ChatMessage[] }> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await new Promise(resolve => 
          setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
        );
      }

      this.lastRequestTime = Date.now();

      // Prepare chat history with token optimization
      const optimizedHistory = this.optimizeHistory(history, userMessage, mood);
      
      const chat = this.model.startChat({
        history: optimizedHistory,
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();

      // Update chat history with proper typing
      const updatedHistory: ChatMessage[] = [
        ...optimizedHistory,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: response }] }
      ];

      return { response, history: updatedHistory.slice(-MAX_HISTORY_MESSAGES * 2) };

    } catch (error) {
      console.error('ChatService error:', error);
      
      if (this.shouldRetry(error)) {
        return this.retryRequest(userMessage, history, mood);
      }
      
      throw this.handleError(error);
    }
  }

  private optimizeHistory(
    history: ChatMessage[], 
    newMessage: string,
    mood?: MoodType
  ): ChatMessage[] {
    // Start with system message
    const optimized: ChatMessage[] = [
      { 
        role: 'user', 
        parts: [{ text: this.getContextPrompt(mood) }] 
      },
      { 
        role: 'model', 
        parts: [{ text: 'Understood. I will follow these guidelines.' }] 
      }
    ];

    // Add most recent messages (prioritizing AI responses)
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES * 2);
    
    // Filter to keep question-answer pairs together
    for (let i = 0; i < recentHistory.length; i++) {
      const msg = recentHistory[i];
      if (i === 0 && msg.role === 'model') continue; // Skip orphaned AI response
      optimized.push(msg);
    }

    return optimized;
  }

  private getContextPrompt(mood?: MoodType): string {
    let moodContext = '';
    
    if (mood) {
      switch(mood) {
        case 'happy':
          moodContext = 'The user seems happy today.';
          break;
        case 'stressed':
          moodContext = 'The user seems stressed today.';
          break;
        case 'calm':
          moodContext = 'The user seems calm today.';
          break;
        case 'angry':
          moodContext = 'The user seems angry today.';
          break;
        case 'sad':
          moodContext = 'The user seems sad today.';
          break;
      }
    }

    return `${SYSTEM_PROMPT}\n\nCurrent Context: ${moodContext}`;
  }

  private shouldRetry(error: any): boolean {
    if (this.retryCount >= MAX_RETRIES) return false;
    
    // Check if error is rate limit related
    return error.message?.includes('429') || 
           error.message?.includes('quota') ||
           error.message?.includes('rate limit');
  }

  private async retryRequest(
    userMessage: string,
    history: ChatMessage[],
    mood?: MoodType
  ): Promise<{ response: string; history: ChatMessage[] }> {
    this.retryCount++;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * this.retryCount));
    return this.sendMessage(userMessage, history, mood);
  }

  private handleError(error: any): Error {
    if (error.message?.includes('429')) {
      return new Error('I\'m getting too many requests. Please wait a moment and try again.');
    }
    return new Error('I\'m having trouble responding. Please try again later.');
  }

  async saveMessageToDB(
    sessionId: string,
    userId: string,
    content: string,
    isAI: boolean
  ): Promise<void> {
    try {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: userId,
        content,
        is_ai: isAI
      });
    } catch (error) {
      console.error('Error saving message:', error);
      // Fail silently - we don't want to interrupt the chat flow
    }
  }
}