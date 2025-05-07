import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Image,
  Animated,
  useColorScheme,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useMood, MoodType } from '../contexts/MoodContext';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY || '');

// Helper function to safely check if a value is an object
const isObject = (value: any): boolean => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// Define message types
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  thinking?: boolean;
}

// Define chat session type
interface ChatSession {
  id: string;
  session_name: string;
  created_at: string;
  last_message?: string;
}

// Define the AI therapist's persona
const AI_PERSONA = {
  name: "Aria",
  role: "AI Wellness Assistant",
  avatar: "https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/friendly%20minimal%20AI%20chatbot%20avatar.png", // Make sure to add this image to your assets
  defaultAvatar: "https://i.imgur.com/7k12EPD.png" // Fallback URL
};

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `
You are ${AI_PERSONA.name}, an AI wellness assistant designed to provide supportive conversations and guidance. 
You are NOT a replacement for a licensed therapist or medical professional.

GUIDELINES:
- Be warm, empathetic, and conversational in your tone
- Keep responses concise (under 3 paragraphs) and easy to read on a mobile screen
- Ask thoughtful follow-up questions to encourage reflection
- Recognize emotional cues and respond appropriately
- Suggest evidence-based coping strategies when appropriate
- Encourage healthy habits and self-care

ETHICAL BOUNDARIES:
- NEVER diagnose medical or psychological conditions
- NEVER prescribe medications or treatments
- If someone expresses thoughts of self-harm or harming others, gently encourage them to contact emergency services (911/988 in US) or text HOME to 741741 to reach the Crisis Text Line
- For serious mental health concerns, recommend speaking with a licensed professional
- Maintain a supportive, non-judgmental stance
- Respect privacy and confidentiality

Begin the conversation in a warm, welcoming manner.
`;

// Crisis detection keywords
const CRISIS_KEYWORDS = [
  "suicide", "kill myself", "end my life", "don't want to live", 
  "want to die", "harm myself", "hurt myself", "self-harm",
  "cut myself", "overdose"
];

// Crisis resources message
const CRISIS_RESOURCES = `
I notice you mentioned something concerning. If you're experiencing a crisis:

• Call 988 (US Suicide & Crisis Lifeline)
• Text HOME to 741741 (Crisis Text Line)
• Call 911 or go to your nearest emergency room

Would you like me to provide more specific resources for your situation?
`;

export default function ChatScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [model, setModel] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const { currentMood } = useMood();
  const typingDot1 = useRef(new Animated.Value(1)).current;
  const typingDot2 = useRef(new Animated.Value(1)).current;
  const typingDot3 = useRef(new Animated.Value(1)).current;
  const [userSessions, setUserSessions] = useState<ChatSession[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    animateDot(typingDot1, 0);
    animateDot(typingDot2, 200);
    animateDot(typingDot3, 400);
  }, []);
  
  // Add this function to load chat history
  const loadChatHistory = async (sessionId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messages) {
        const formattedMessages = messages.map(msg => ({
          id: msg.id.toString(),
          content: msg.content,
          isAI: msg.is_ai,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
        
        // Update chat history for context
        // Create properly ordered history format
        let historyFormat = messages.map(msg => ({
          role: msg.is_ai ? "model" : "user",
          parts: [{ text: msg.content }]
        }));
        
        // Ensure the first message has role 'user' as required by Gemini API
        if (historyFormat.length > 0 && historyFormat[0].role === 'model') {
          // If first message is from model (AI welcome message), add a placeholder user message
          historyFormat = [
            { role: 'user', parts: [{ text: 'Hello' }] },
            ...historyFormat
          ];
        }
        
        setChatHistory(historyFormat);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      Alert.alert('Error', 'Failed to load chat history');
    }
  };

  // Add this function to load user's chat sessions
  const loadUserChatSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (sessions && sessions.length > 0) {
        setUserSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      Alert.alert('Error', 'Failed to load your chat history');
    }
  };

  // Function to select and load a specific chat session
  const selectChatSession = async (selectedSessionId: string) => {
    setSessionId(selectedSessionId);
    await loadChatHistory(selectedSessionId);
    setShowSessionsModal(false);
  };

  // Modify your initializeChat function to check for recent sessions
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Load all user sessions first
        await loadUserChatSessions();
        
        // Check for existing session from last 24 hours
        const { data: recentSession, error } = await supabase
          .from('chat_sessions')
          .select()
          .eq('user_id', user.id)
          .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        let currentSessionId;
        
        if (recentSession) {
          currentSessionId = recentSession.id;
        } else {
          // Create new session if none exists from the last 24 hours
          const { data: newSession, error } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: user.id,
              session_name: `Chat ${new Date().toLocaleDateString()}`
            })
            .select()
            .single();
            
          if (error) throw error;
          currentSessionId = newSession.id;
        }
        
        setSessionId(currentSessionId);
        
        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        });
        setModel(model);
        
        // Load existing messages
        await loadChatHistory(currentSessionId);
        
        // Only add welcome message if there are no messages in this session
        if (messages.length === 0) {
          const welcomeMessage = getWelcomeMessage();
          setMessages([{
            id: Date.now().toString(),
            content: welcomeMessage,
            isAI: true,
            timestamp: new Date()
          }]);
          
          await supabase.from('chat_messages').insert({
            session_id: currentSessionId,
            user_id: user.id,
            content: welcomeMessage,
            is_ai: true
          });
        }
        
      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert('Error', 'Failed to initialize chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    setIsLoading(true);
    initializeChat();
  }, []);
  
  // Function to get a contextual welcome message based on user's mood
  const getWelcomeMessage = () => {
    const timeOfDay = getTimeOfDay();
    let welcomeMessage = `Good ${timeOfDay}, I'm ${AI_PERSONA.name}. How can I support you today?`;
    
    if (currentMood) {
      switch(currentMood.moodType) {
        case 'happy':
          welcomeMessage = `Good ${timeOfDay}! I notice you're feeling happy today. That's wonderful! I'm ${AI_PERSONA.name}. Would you like to talk about what's going well or is there something specific on your mind?`;
          break;
        case 'calm':
          welcomeMessage = `Good ${timeOfDay}. I see you're feeling calm today. That's a great state to be in. I'm ${AI_PERSONA.name}. How can I help maintain this peaceful feeling or is there something you'd like to discuss?`;
          break;
        case 'stressed':
          welcomeMessage = `Good ${timeOfDay}. I notice you're feeling stressed today. I'm ${AI_PERSONA.name}, and I'm here to listen. Would you like to talk about what's causing your stress?`;
          break;
        case 'angry':
          welcomeMessage = `Good ${timeOfDay}. I see you're feeling angry today. I'm ${AI_PERSONA.name}. Sometimes talking through our feelings can help. Would you like to share what's bothering you?`;
          break;
        case 'sad':
          welcomeMessage = `Good ${timeOfDay}. I notice you're feeling sad today. I'm ${AI_PERSONA.name}, and I'm here for you. Would you like to talk about what's on your mind?`;
          break;
      }
    }
    
    return welcomeMessage;
  };
  
  // Helper function to get time of day
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };
  
  // Function to handle sending messages
  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId || !model) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();
    
    // Add user message to UI
    const userMessageObj = {
      id: Date.now().toString(),
      content: userMessage,
      isAI: false,
      timestamp: new Date()
    };
    
    // Add thinking indicator for AI
    const thinkingMessageId = (Date.now() + 1).toString();
    const thinkingMessage = {
      id: thinkingMessageId,
      content: '',
      isAI: true,
      timestamp: new Date(),
      thinking: true
    };
    
    setMessages(prev => [...prev, userMessageObj, thinkingMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Get user information
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Save user message to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        content: userMessage,
        is_ai: false
      });
      
      // Update the session with the last message
      await supabase
        .from('chat_sessions')
        .update({ 
          last_message: userMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // Check for crisis keywords
      const containsCrisisKeyword = CRISIS_KEYWORDS.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );
      
      if (containsCrisisKeyword) {
        // Remove thinking message
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
        
        // Add crisis resources message
        const crisisMessageObj = {
          id: Date.now().toString(),
          content: CRISIS_RESOURCES,
          isAI: true,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, crisisMessageObj]);
        
        // Save crisis message to database
        await supabase.from('chat_messages').insert({
          session_id: sessionId,
          user_id: user.id,
          content: CRISIS_RESOURCES,
          is_ai: true
        });
        
        // Update the session with the AI's last message
        await supabase
          .from('chat_sessions')
          .update({ 
            last_message: "Crisis resources provided",
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        return;
      }
      
      // Update chat history for context
      const updatedHistory = [
        ...chatHistory,
        { role: "user", parts: [{ text: userMessage }] }
      ];
      setChatHistory(updatedHistory);
      
      // Generate AI response
      let aiResponse = "";
      
      try {
        // Create chat session with proper error handling
        if (!isObject(model)) {
          throw new Error("Model is not properly initialized");
        }
        
        // Ensure the first message in history has role 'user' as required by Gemini API
        let validHistory = updatedHistory;
        
        // Insert system prompt as a message at the beginning of the history
        // We first need to ensure there's at least one user message before adding the system message
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
          // If first message is from model, we need to either:
          // 1. Remove it if it's the only message, or 
          // 2. Reorder so that first user message comes first
          if (validHistory.length === 1) {
            // If only one model message, create a dummy user message
            validHistory = [
              { role: 'user', parts: [{ text: 'Hello' }] },
              validHistory[0]
            ];
          } else {
            // Find the first user message
            const firstUserMessageIndex = validHistory.findIndex(msg => msg.role === 'user');
            if (firstUserMessageIndex > 0) {
              // Reorder to put user message first
              const firstUserMessage = validHistory[firstUserMessageIndex];
              const newHistory = [firstUserMessage];
              validHistory.forEach((msg, index) => {
                if (index !== firstUserMessageIndex) {
                  newHistory.push(msg);
                }
              });
              validHistory = newHistory;
            } else {
              // If no user messages, add a dummy user message
              validHistory = [
                { role: 'user', parts: [{ text: 'Hello' }] },
                ...validHistory
              ];
            }
          }
        }
        
        // Now insert the system message at the beginning - as a user message
        // This follows the Gemini API's latest pattern where system instructions are handled
        // as a special first message in the conversation
        const systemMessage = { 
          role: 'user', 
          parts: [{ text: SYSTEM_PROMPT }]
        };

        // Add a model response to acknowledge the system instructions
        const systemAcknowledgement = {
          role: 'model',
          parts: [{ text: 'I understand and will follow these guidelines.' }]
        };
        
        // Add these system messages at the beginning of valid history
        validHistory = [systemMessage, systemAcknowledgement, ...validHistory];

        const chat = model.startChat({
          history: validHistory,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });
        
        const result = await chat.sendMessage(userMessage);
        
        // Safely extract the response text with multiple fallback options
        if (isObject(result)) {
          // Check all possible response formats
          if (isObject(result.response)) {
            // Option 1: text is a function (older API versions)
            if (typeof result.response.text === 'function') {
              aiResponse = result.response.text();
            } 
            // Option 2: text is a property (newer API versions)
            else if (typeof result.response.text === 'string') {
              aiResponse = result.response.text;
            }
            // Option 3: content may be available in candidates
            else if (isObject(result.response) && 
                     'candidates' in result.response && 
                     isObject(result.response.candidates) && 
                     Array.isArray(result.response.candidates) && 
                     result.response.candidates.length > 0) {
              
              const candidate = result.response.candidates[0];
              if (isObject(candidate) && isObject(candidate.content)) {
                const content = candidate.content;
                if (Array.isArray(content.parts) && content.parts.length > 0 && 
                    isObject(content.parts[0]) && 'text' in content.parts[0]) {
                  aiResponse = content.parts[0].text || "";
                }
              }
            }
            // Option 4: direct content property
            else if ('content' in result.response && result.response.content) {
              if (typeof result.response.content === 'string') {
                aiResponse = result.response.content;
              } else if (isObject(result.response.content)) {
                if ('parts' in result.response.content && 
                    Array.isArray(result.response.content.parts) && 
                    result.response.content.parts.length > 0 && 
                    isObject(result.response.content.parts[0]) && 
                    'text' in result.response.content.parts[0]) {
                  aiResponse = result.response.content.parts[0].text || "";
                }
              }
            }
            else {
              throw new Error("Could not extract text from response");
            }
          } else {
            throw new Error("Response object is missing or invalid");
          }
        } else {
          throw new Error("Result is not an object");
        }
      } catch (error) {
        aiResponse = "I'm sorry, I'm having trouble responding right now. Please try again.";
        console.error("Error processing Gemini API response:", error);
      }
      
      // If we still don't have a response, use a fallback
      if (!aiResponse || aiResponse.trim() === "") {
        aiResponse = "I'm sorry, I'm having trouble responding right now. Please try again.";
        console.error("Failed to extract response text from Gemini API");
      }
      
      // Remove thinking message and add AI response
      setMessages(prev => 
        prev.filter(msg => msg.id !== thinkingMessageId).concat({
          id: Date.now().toString(),
          content: aiResponse,
          isAI: true,
          timestamp: new Date()
        })
      );
      
      // Save AI response to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        content: aiResponse,
        is_ai: true
      });
      
      // Update the session with the AI's last message
      await supabase
        .from('chat_sessions')
        .update({ 
          last_message: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : ''),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // Update chat history with AI response
      const updatedHistoryWithAIResponse = [...updatedHistory, { role: "model", parts: [{ text: aiResponse }] }];
      setChatHistory(updatedHistoryWithAIResponse);
      
      // Provide haptic feedback for message received
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      try {
        // Get user information for error handling
        const { data: { user } } = await supabase.auth.getUser();
        if (user && sessionId) {
          // Error message to show to user
          const errorMessage = "I'm sorry, I encountered an error. Please try again.";
          
          // Remove thinking message and add error message
          setMessages(prev => 
            prev.filter(msg => msg.id !== thinkingMessageId).concat({
              id: Date.now().toString(),
              content: errorMessage,
              isAI: true,
              timestamp: new Date()
            })
          );
          
          // Save error message to database
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            user_id: user.id,
            content: errorMessage,
            is_ai: true
          });
          
          // Update the session with the error message
          await supabase
            .from('chat_sessions')
            .update({ 
              last_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        } else {
          // Just remove thinking indicator if we can't save the error message
          setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
        }
      } catch (innerError) {
        console.error('Error handling error state:', innerError);
        // Just remove thinking indicator
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
      }
      
      // Show error to user
      Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
    }
  };
  
  // Function to render message bubbles
  const renderMessage = ({ item }: { item: Message }) => {
    if (item.thinking) {
      return (
        <View style={[styles.messageBubble, styles.aiMessageBubble, isDark && styles.darkAiMessageBubble]}>
          {renderTypingIndicator()}
        </View>
      );
    }
    
    return (
      <View style={[
        styles.messageContainer,
        item.isAI ? styles.aiMessageContainer : styles.userMessageContainer
      ]}>
        {item.isAI && (
          <Image 
            source={{ uri: AI_PERSONA.avatar || AI_PERSONA.defaultAvatar }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          item.isAI 
            ? [styles.aiMessageBubble, isDark && styles.darkAiMessageBubble] 
            : [styles.userMessageBubble, isDark && styles.darkUserMessageBubble]
        ]}>
          <Text style={[
            styles.messageText,
            item.isAI 
              ? [styles.aiMessageText, isDark && styles.darkAiMessageText] 
              : [styles.userMessageText, isDark && styles.darkUserMessageText]
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            item.isAI ? styles.aiTimestamp : styles.userTimestamp,
            isDark && styles.darkTimestamp
          ]}>
            {format(item.timestamp, 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };
  
  // Add this function to render the session selection modal
  const renderSessionsModal = () => {
    return (
      <Modal
        visible={showSessionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Your Chat History</Text>
            
            <ScrollView style={styles.sessionsList}>
              {userSessions.map(session => (
                <TouchableOpacity 
                  key={session.id} 
                  style={[
                    styles.sessionItem,
                    session.id === sessionId && styles.activeSessionItem,
                    isDark && styles.darkSessionItem,
                    session.id === sessionId && isDark && styles.darkActiveSessionItem
                  ]}
                  onPress={() => selectChatSession(session.id)}
                >
                  <Text style={[styles.sessionName, isDark && styles.darkText]}>
                    {session.session_name}
                  </Text>
                  <Text style={[styles.sessionDate, isDark && styles.darkSubText]}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </Text>
                  {session.last_message && (
                    <Text 
                      style={[styles.sessionPreview, isDark && styles.darkSubText]}
                      numberOfLines={1}
                    >
                      {session.last_message}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSessionsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Modify the handleClearChat function to create a new session
  const handleClearChat = async () => {
    Alert.alert(
      "Start New Chat",
      "Are you sure you want to start a new conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Start New", 
          style: "default",
          onPress: async () => {
            try {
              // Create a new session
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              
              const { data: session, error } = await supabase
                .from('chat_sessions')
                .insert({
                  user_id: user.id,
                  session_name: `Chat ${new Date().toLocaleDateString()}`
                })
                .select()
                .single();
                
              if (error) throw error;
              setSessionId(session.id);
              
              // Reset chat history
              setChatHistory([]);
              
              // Add welcome message
              const welcomeMessage = getWelcomeMessage();
              
              setMessages([{
                id: Date.now().toString(),
                content: welcomeMessage,
                isAI: true,
                timestamp: new Date()
              }]);
              
              // Save welcome message to database
              await supabase.from('chat_messages').insert({
                session_id: session.id,
                user_id: user.id,
                content: welcomeMessage,
                is_ai: true
              });
              
              // Update sessions list
              await loadUserChatSessions();
              
              // Provide haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
            } catch (error) {
              console.error('Error creating new chat:', error);
              Alert.alert('Error', 'Failed to create new chat. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderTypingIndicator = () => (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, { transform: [{ scale: typingDot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ scale: typingDot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ scale: typingDot3 }] }]} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      {/* Header */}
      <BlurView 
        intensity={80} 
        tint={isDark ? 'dark' : 'light'} 
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={isDark ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>
            {AI_PERSONA.name}
          </Text>
          <Text style={[styles.headerSubtitle, isDark && styles.darkSubText]}>
            {AI_PERSONA.role}
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.historyButton} 
            onPress={() => setShowSessionsModal(true)}
          >
            <Ionicons 
              name="time-outline" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClearChat}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
      </BlurView>
      
      {/* Chat Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputContainer, isDark && styles.darkInputContainer]}
      >
        <BlurView 
          intensity={80} 
          tint={isDark ? 'dark' : 'light'} 
          style={styles.inputBlur}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Message..."
            placeholderTextColor={isDark ? '#888888' : '#999999'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.disabledSendButton,
              isDark && !inputText.trim() && styles.darkDisabledSendButton
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={!inputText.trim() ? (isDark ? '#555555' : '#cccccc') : '#ffffff'} 
            />
          </TouchableOpacity>
        </BlurView>
        
        {/* Disclaimer */}
        <Text style={[styles.disclaimer, isDark && styles.darkDisclaimer]}>
          Not a replacement for professional mental health care
        </Text>
      </KeyboardAvoidingView>
      
      {/* Render the sessions modal */}
      {renderSessionsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 16,
    overflow: 'hidden',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  aiMessageBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  darkAiMessageBubble: {
    backgroundColor: '#1C1C1E',
  },
  userMessageBubble: {
    backgroundColor: '#FF7F50',
    borderBottomRightRadius: 4,
  },
  darkUserMessageBubble: {
    backgroundColor: '#FF7F50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#000000',
  },
  darkAiMessageText: {
    color: '#FFFFFF',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  darkUserMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  aiTimestamp: {
    color: '#888888',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  darkTimestamp: {
    color: '#888888',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888888',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 8,
  },
  darkInputContainer: {
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 48,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  darkInput: {
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    backgroundColor: '#FF7F50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#E0E0E0',
  },
  darkDisabledSendButton: {
    backgroundColor: '#2C2C2E',
  },
  disclaimer: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  darkDisclaimer: {
    color: '#666666',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#AAAAAA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  darkModalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#1C1C1E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  sessionsList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  sessionItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#DDD',
  },
  activeSessionItem: {
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
    borderLeftColor: '#FF7F50',
  },
  darkSessionItem: {
    backgroundColor: '#2C2C2E',
    borderLeftColor: '#444',
  },
  darkActiveSessionItem: {
    backgroundColor: 'rgba(255, 127, 80, 0.3)',
    borderLeftColor: '#FF7F50',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  sessionPreview: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#FF7F50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});