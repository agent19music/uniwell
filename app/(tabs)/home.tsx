import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Adjust the import path as needed

const MOOD_OPTIONS = [
  { id: 'happy', icon: '😊', label: 'Happy', color: '#FF69B4' },
  { id: 'calm', icon: '😌', label: 'Calm', color: '#8A8AFF' },
  { id: 'manic', icon: '😵‍💫', label: 'Manic', color: '#7FFFD4' },
  { id: 'angry', icon: '😠', label: 'Angry', color: '#FFA07A' },
  { id: 'sad', icon: '😢', label: 'Sad', color: '#98FB98' },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { height } = useWindowDimensions();
  const [userName, setUserName] = useState('');

  const handleJournalPress = () => {
    router.push('/journals'); // Use router.push for navigation
  };
  const handlePreferencesPress = () => {
    router.push('/preferences'); // Use router.push for navigation
  };

  useEffect(() => {
    async function getUserName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]); // Get first name
      }
    }
    getUserName();
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height - 60 } // Subtract tab bar height
        ]}>
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={handlePreferencesPress}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }}
              style={styles.avatar}
              
            />
            </TouchableOpacity>
            <View style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={24} color={isDark ? '#ffffff' : '#000000'} />
              <View style={styles.notificationBadge} />
            </View>
          </View>
          <Text style={[styles.greeting, isDark && styles.darkText]}>
            Good Afternoon,{'\n'}{userName || 'Guest'}!
          </Text>
          <Text style={[styles.question, isDark && styles.darkSubText]}>How are you feeling today?</Text>
        </View>

        <View style={styles.moodContainer}>
          {MOOD_OPTIONS.map((mood) => (
            <TouchableOpacity key={mood.id} style={[styles.moodOption, { backgroundColor: mood.color + '20' }]}>
              <Text style={styles.moodEmoji}>{mood.icon}</Text>
              <Text style={[styles.moodLabel, isDark && styles.darkText]}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.sessionCard, isDark && styles.darkCard]}>
          <View style={styles.sessionContent}>
            <Text style={[styles.sessionTitle, isDark && styles.darkText]}>1 on 1 Sessions</Text>
            <Text style={[styles.sessionSubtitle, isDark && styles.darkSubText]}>
              Let's open up to the things that matter the most
            </Text>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Ionicons name="calendar-outline" size={20} color="#FF7F50" />
            </TouchableOpacity>
          </View>
          <View style={styles.illustrationContainer}>
            <Ionicons name="people" size={48} color="#FF7F50" />
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity   onPress={handleJournalPress} style={[styles.quickAction, isDark && styles.darkCard]}>
            <Ionicons name="book-outline" size={24} color="#FF7F50" />
            <Text style={[styles.quickActionText, isDark && styles.darkText]}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, isDark && styles.darkCard]}>
            <Ionicons name="library-outline" size={24} color="#FF7F50" />
            <Text style={[styles.quickActionText, isDark && styles.darkText]}>Library</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.quoteCard, isDark && styles.darkCard]}>
          <Text style={[styles.quote, isDark && styles.darkText]}>
            "It is better to conquer yourself than to win a thousand battles"
          </Text>
          <Entypo name="quote" size={24} color="#FF7F50" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF7F50',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
    fontFamily: 'Vercetti-Regular',
  },
  question: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  moodOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5EE',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 20,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sessionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#FF7F50',
    fontWeight: '600',
  },
  illustrationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  quoteCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quote: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginRight: 16,
  },
});