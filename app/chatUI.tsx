import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator, Keyboard, Image, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { ChatService } from '../lib/services/chatservice';
import { ChatSessionManager } from '@/lib/ChatSessionHandler';
import { useMood, MoodType } from '../contexts/MoodContext';
import { supabase } from '../lib/supabase';

// Define message types
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  thinking?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const AI_PERSONA = {
  name: "Aria",
  role: "AI Wellness Assistant",
  avatar: "https://example.com/avatar.png",
  defaultAvatar: "https://example.com/default-avatar.png"
};

const ChatUI = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentMood } = useMood();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const chatService = useRef(new ChatService()).current;

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        // Load or create session
        const sessionId = await ChatSessionManager.getOrCreateSession(user.id);
        setSessionId(sessionId);

        // Load chat history
        const history = await ChatSessionManager.loadChatHistory(sessionId);
        setMessages(history);

        // Load user sessions
        const sessions = await ChatSessionManager.getUserSessions(user.id);
        setUserSessions(sessions);

        // Add welcome message if new session
        if (history.length === 0) {
          const welcomeMessage = getWelcomeMessage();
          addMessage(welcomeMessage, true);
          await chatService.saveMessageToDB(sessionId, user.id, welcomeMessage, true);
        }

      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  const getWelcomeMessage = (): string => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                     new Date().getHours() < 18 ? 'afternoon' : 'evening';
    
    if (!currentMood) {
      return `Good ${timeOfDay}, I'm ${AI_PERSONA.name}. How can I support you today?`;
    }

    const moodMessages = {
      happy: `Good ${timeOfDay}! I notice you're feeling happy today. That's wonderful! Would you like to talk about what's going well?`,
      calm: `Good ${timeOfDay}. I see you're feeling calm today. That's a great state to be in. How can I help?`,
      stressed: `Good ${timeOfDay}. I notice you're feeling stressed today. I'm here to listen if you'd like to talk.`,
      angry: `Good ${timeOfDay}. I see you're feeling angry today. Sometimes talking can help. Would you like to share?`,
      sad: `Good ${timeOfDay}. I notice you're feeling sad today. I'm here for you if you'd like to talk.`
    };

    return moodMessages[currentMood.moodType] || moodMessages.happy;
  };

  const addMessage = (content: string, isAI: boolean, thinking = false) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      isAI,
      timestamp: new Date(),
      thinking
    };

    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;

    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Add user message to UI
    addMessage(userMessage, false);
    
    // Add thinking indicator
    const thinkingId = Date.now().toString() + '-thinking';
    addMessage('', true, true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save user message to DB
      await chatService.saveMessageToDB(sessionId, user.id, userMessage, false);

      // Prepare chat history for API
      const apiHistory: ChatMessage[] = messages
        .filter(msg => !msg.thinking)
        .map(msg => ({
          role: msg.isAI ? 'model' : 'user' as const,
          parts: [{ text: msg.content }]
        }));

      // Get AI response
      const { response } = await chatService.sendMessage(
        userMessage, 
        apiHistory, 
        currentMood?.moodType
      );

      // Remove thinking indicator and add AI response
      setMessages(prev => 
        prev.filter(msg => !msg.thinking)
            .concat({
              id: Date.now().toString(),
              content: response,
              isAI: true,
              timestamp: new Date()
            })
      );

      // Save AI response to DB
      await chatService.saveMessageToDB(sessionId, user.id, response, true);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error: unknown) {
      console.error('Message error:', error);
      
      // Remove thinking indicator
      setMessages(prev => prev.filter(msg => !msg.thinking));
      
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      addMessage(errorMessage, true);
    }
  };

  const handleNewChat = async () => {
    Alert.alert(
      "New Chat",
      "Start a new conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "New Chat", 
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const newSessionId = await ChatSessionManager.createNewSession(user.id);
              setSessionId(newSessionId);
              setMessages([]);

              const welcomeMessage = getWelcomeMessage();
              addMessage(welcomeMessage, true);
              await chatService.saveMessageToDB(newSessionId, user.id, welcomeMessage, true);

              // Refresh sessions list
              const sessions = await ChatSessionManager.getUserSessions(user.id);
              setUserSessions(sessions);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('New chat error:', error);
              Alert.alert('Error', 'Failed to start new chat');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.thinking) {
      return (
        <View style={styles.thinkingBubble}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, { opacity: 0.4 }]} />
            <View style={[styles.typingDot, { opacity: 0.6 }]} />
            <View style={[styles.typingDot, { opacity: 0.8 }]} />
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        item.isAI ? styles.aiContainer : styles.userContainer
      ]}>
        {item.isAI && (
          <Image 
            source={{ uri: AI_PERSONA.avatar || AI_PERSONA.defaultAvatar }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.bubble,
          item.isAI ? styles.aiBubble : styles.userBubble,
          isDark && (item.isAI ? styles.darkAiBubble : styles.darkUserBubble)
        ]}>
          <Text style={[
            styles.messageText,
            item.isAI ? styles.aiText : styles.userText,
            isDark && (item.isAI ? styles.darkAiText : styles.darkUserText)
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

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header */}
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>{AI_PERSONA.name}</Text>
          <Text style={[styles.headerSubtitle, isDark && styles.darkSubText]}>{AI_PERSONA.role}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setShowSessionsModal(true)}
            style={styles.headerButton}
          >
            <Ionicons name="time-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNewChat} 
            style={[styles.headerButton, styles.newChatButton]}
          >
            <Ionicons name="add" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Chat Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                isDark && styles.darkInput,
                inputText.length > 0 && styles.inputActive
              ]}
              placeholder="Message Aria..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSendMessage}
            />
            {inputText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setInputText('')}
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={isDark ? '#888' : '#999'} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText && styles.disabledButton
              ]}
              onPress={handleSendMessage}
              disabled={!inputText}
            >
              <LinearGradient
                colors={!inputText ? ['#ccc', '#ccc'] : ['#FF7F50', '#FF6347']}
                style={styles.sendButtonGradient}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {inputText.length > 0 && (
            <Text style={[styles.charCount, isDark && styles.darkCharCount]}>
              {inputText.length}/500
            </Text>
          )}
        </BlurView>
        <Text style={[styles.disclaimer, isDark && styles.darkSubText]}>
          Not a replacement for professional help
        </Text>
      </KeyboardAvoidingView>

      {/* Sessions Modal */}
      <Modal
        visible={showSessionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Your Chats</Text>
            
            <ScrollView style={styles.sessionsList}>
              {userSessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionItem,
                    session.id === sessionId && styles.activeSession,
                    isDark && styles.darkSessionItem
                  ]}
                  onPress={async () => {
                    setSessionId(session.id);
                    const history = await ChatSessionManager.loadChatHistory(session.id);
                    setMessages(history);
                    setShowSessionsModal(false);
                  }}
                >
                  <Text style={[styles.sessionName, isDark && styles.darkText]}>
                    {session.session_name}
                  </Text>
                  <Text style={[styles.sessionDate, isDark && styles.darkSubText]}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.modalButton, isDark && styles.darkModalButton]}
              onPress={() => setShowSessionsModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  newChatButton: {
    backgroundColor: 'rgba(255, 127, 80, 0.1)',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#FF7F50',
    borderBottomRightRadius: 4,
  },
  darkAiBubble: {
    backgroundColor: '#1C1C1E',
  },
  darkUserBubble: {
    backgroundColor: '#FF7F50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: '#000000',
  },
  userText: {
    color: '#FFFFFF',
  },
  darkAiText: {
    color: '#FFFFFF',
  },
  darkUserText: {
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
  thinkingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
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
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputActive: {
    borderColor: '#FF7F50',
    shadowColor: '#FF7F50',
    shadowOpacity: 0.2,
  },
  darkInput: {
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButton: {
    position: 'absolute',
    right: 48,
    bottom: 10,
    padding: 4,
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
  darkCharCount: {
    color: '#666',
  },
  disclaimer: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
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
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeSession: {
    backgroundColor: 'rgba(255, 127, 80, 0.2)',
    borderLeftColor: '#FF7F50',
  },
  darkSessionItem: {
    backgroundColor: '#2C2C2E',
    borderLeftColor: '#444',
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
  modalButton: {
    backgroundColor: '#FF7F50',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  darkModalButton: {
    backgroundColor: '#FF7F50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF7F50',
  },
});

export default ChatUI;