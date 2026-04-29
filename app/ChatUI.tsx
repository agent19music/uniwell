import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, Keyboard, Image, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChatCircleDots, ClockCounterClockwise, PaperPlaneRight, X, Plus, DotsThree } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Burnt from 'burnt';
import { LoadingIndicator } from '@rn-nui/loading-indicator';

import { ChatService } from '../lib/services/chatservice';
import { ChatSessionManager } from '@/lib/ChatSessionHandler';
import { useMood, MoodType } from '../contexts/MoodContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

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
  avatar: "https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/friendly%20minimal%20AI%20chatbot%20avatar.png",
  defaultAvatar: "https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/friendly%20minimal%20AI%20chatbot%20avatar.png"
};

const ChatUI = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      "New Conversation",
      "Start a fresh chat with Aria?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Start New Chat", 
          onPress: async () => {
            try {
              setIsLoading(true);
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

              scrollToBottom();
              inputRef.current?.focus();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Burnt.toast({ 
                title: 'New chat started', 
                preset: 'done' 
              });
            } catch (error) {
              console.error('New chat error:', error);
              Burnt.toast({ 
                title: 'Error', 
                message: 'Failed to start new chat',
                preset: 'error' 
              });
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.thinking) {
      return (
        <View style={[styles.thinkingBubble, { backgroundColor: colors.card }]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, { backgroundColor: colors.textSecondary, opacity: 0.4 }]} />
            <View style={[styles.typingDot, { backgroundColor: colors.textSecondary, opacity: 0.6 }]} />
            <View style={[styles.typingDot, { backgroundColor: colors.textSecondary, opacity: 0.8 }]} />
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
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: AI_PERSONA.avatar || AI_PERSONA.defaultAvatar }}
              style={styles.avatar}
            />
            <View style={[styles.aiIndicator, { backgroundColor: colors.success }]}>
            </View>
          </View>
        )}
        <View style={[
          styles.bubble,
          item.isAI ? [styles.aiBubble, { backgroundColor: colors.card }] : [styles.userBubble, { backgroundColor: isDark ? colors.success : colors.textPrimary }]
        ]}>
          <Text style={[
            styles.messageText,
            item.isAI 
              ? { color: colors.textPrimary } 
              : { color: '#FFFFFF' }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            item.isAI 
              ? { color: colors.textSecondary } 
              : { color: 'rgba(255, 255, 255, 0.7)' }
          ]}>
            {format(item.timestamp, 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.textPrimary} weight="regular" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <ChatCircleDots size={20} color={colors.success} weight="fill" />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{AI_PERSONA.name}</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{AI_PERSONA.role}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setShowSessionsModal(true)}
            style={styles.iconButton}
          >
            <ClockCounterClockwise size={24} color={colors.textPrimary} weight="regular" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNewChat} 
            style={styles.iconButton}
          >
            <Plus size={24} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator 
            containerSize={50} 
            containerColor={colors.success} 
            animating={true} 
            color={colors.background} 
          />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading chat...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
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

          {/* Input Area */}
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, shadowColor: colors.shadow.medium }]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { color: colors.textPrimary }
                ]}
                placeholder="Message Aria..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={handleSendMessage}
                onKeyPress={({ nativeEvent }) => {
                  if (Platform.OS === 'web') {
                    const webEvent = nativeEvent as unknown as KeyboardEvent;
                    if (webEvent.key === 'Enter' && !webEvent.shiftKey) {
                      webEvent.preventDefault();
                      handleSendMessage();
                    }
                  }
                }}
              />
              {inputText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setInputText('')}
                >
                  <X 
                    size={20} 
                    color={colors.textSecondary} 
                    weight="bold"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.disabledButton
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
              >
                <View style={[
                  styles.sendButtonGradient,
                  { backgroundColor: inputText.trim() ? (isDark ? colors.success : colors.textPrimary) : colors.border }
                ]}>
                  <PaperPlaneRight 
                    size={20} 
                    color="#fff"
                    weight="fill"
                  />
                </View>
              </TouchableOpacity>
            </View>
            {inputText.length > 0 && (
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {inputText.length}/500
              </Text>
            )}
          </View>
          <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
            Not a replacement for professional help
          </Text>
        </KeyboardAvoidingView>
      )}

      {/* Sessions Modal */}
      <Modal
        visible={showSessionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.modalBackground }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ClockCounterClockwise size={24} color={colors.success} weight="fill" />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Chat History</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSessionsModal(false)}>
                <X size={24} color={colors.textPrimary} weight="bold" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
              {userSessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <ChatCircleDots size={48} color={colors.textTertiary} weight="thin" />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No previous conversations
                  </Text>
                </View>
              ) : (
                userSessions.map(session => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      { backgroundColor: colors.background },
                      session.id === sessionId && [styles.activeSession, { backgroundColor: colors.success + '20', borderLeftColor: colors.success }]
                    ]}
                    onPress={async () => {
                      setSessionId(session.id);
                      const history = await ChatSessionManager.loadChatHistory(session.id);
                      setMessages(history);
                      setShowSessionsModal(false);
                      Burnt.toast({ title: 'Chat loaded', preset: 'done' });
                    }}
                  >
                    <View style={styles.sessionContent}>
                      <Text style={[styles.sessionName, { color: colors.textPrimary }]}>
                        {session.session_name}
                      </Text>
                      <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                        {format(new Date(session.created_at), 'MMM d, yyyy • h:mm a')}
                      </Text>
                    </View>
                    {session.id === sessionId && (
                      <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Vercetti-Regular',
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    maxWidth: '85%',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  aiIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Vercetti-Regular',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontFamily: 'Vercetti-Regular',
  },
  thinkingBubble: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    marginLeft: 20,
    maxWidth: '70%',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    paddingRight: 80,
    fontFamily: 'Vercetti-Regular',
    paddingVertical: 8,
  },
  clearButton: {
    position: 'absolute',
    right: 60,
    bottom: 14,
    padding: 4,
  },
  sendButton: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.4,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
    marginRight: 8,
    fontFamily: 'Vercetti-Regular',
  },
  disclaimer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Vercetti-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Vercetti-Regular',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  sessionsList: {
    maxHeight: 450,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    fontFamily: 'Vercetti-Regular',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  activeSession: {
    borderLeftWidth: 4,
  },
  sessionContent: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Vercetti-Regular',
  },
  sessionDate: {
    fontSize: 13,
    fontFamily: 'Vercetti-Regular',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
});

export default ChatUI;