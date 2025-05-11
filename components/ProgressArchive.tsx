import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { useRoutine } from '../contexts/RoutineContext';
import { useMood } from '../contexts/MoodContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface ProgressArchiveProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProgressArchive({ visible, onClose }: ProgressArchiveProps) {
  const { progressArchive, getRoutineCompletions } = useRoutine();
  const { weeklyMoods } = useMood();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [routineCompletions, setRoutineCompletions] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (selectedDate) {
      loadRoutineCompletions(selectedDate);
    }
  }, [selectedDate]);

  const loadRoutineCompletions = async (date: Date) => {
    const completions = await getRoutineCompletions(date);
    setRoutineCompletions(completions);
  };

  const getDateLabel = (date: string) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) return 'Today';
    if (isYesterday(dateObj)) return 'Yesterday';
    return format(dateObj, 'MMM d');
  };

  const renderArchiveItem = ({ item }: { item: any }) => {
    const date = new Date(item.date);
    const isSelected = selectedDate?.toDateString() === date.toDateString();

    return (
      <TouchableOpacity
        style={[styles.archiveItem, isSelected && styles.selectedArchiveItem]}
        onPress={() => setSelectedDate(date)}
      >
        <View style={styles.archiveItemContent}>
          <Text style={[styles.archiveDate, isDark && styles.darkText]}>
            {getDateLabel(item.date)}
          </Text>
          <View style={styles.archiveIcons}>
            {item.hasRoutineCompletion && (
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            )}
            {item.hasJournalEntry && (
              <Ionicons name="journal" size={16} color="#FF9500" />
            )}
            {item.hasSleepEntry && (
              <Ionicons name="moon" size={16} color="#5856D6" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailView = () => {
    if (!selectedDate) return null;

    const archive = progressArchive.find(
      item => new Date(item.date).toDateString() === selectedDate.toDateString()
    );

    if (!archive) return null;

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <Text style={[styles.detailDate, isDark && styles.darkText]}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDate(null)}>
            <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailContent}>
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Routines</Text>
            {routineCompletions.map((completion) => (
              <View key={completion.id} style={styles.completionItem}>
                <Ionicons
                  name={completion.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={completion.status === 'completed' ? '#34C759' : '#FF3B30'}
                />
                <Text style={[styles.completionText, isDark && styles.darkText]}>
                  {completion.routine.title}
                </Text>
              </View>
            ))}
          </View>

          {archive.hasJournalEntry && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Journal</Text>
              <View style={styles.journalPreview}>
                <Ionicons name="journal" size={24} color="#FF9500" />
                <Text style={[styles.journalText, isDark && styles.darkText]}>
                  Journal entry recorded
                </Text>
              </View>
            </View>
          )}

          {archive.hasSleepEntry && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Sleep</Text>
              <View style={styles.sleepPreview}>
                <Ionicons name="moon" size={24} color="#5856D6" />
                <Text style={[styles.sleepText, isDark && styles.darkText]}>
                  {archive.sleepQualityRating ? `${archive.sleepQualityRating}/10` : 'Sleep recorded'}
                </Text>
              </View>
            </View>
          )}

          {archive.moodRating && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Mood</Text>
              <View style={styles.moodPreview}>
                <Ionicons name="happy" size={24} color="#FF9500" />
                <Text style={[styles.moodText, isDark && styles.darkText]}>
                  {archive.moodRating}/10
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Progress Archive</Text>
          <View style={styles.placeholder} />
        </View>

        {selectedDate ? (
          renderDetailView()
        ) : (
          <FlatList
            data={progressArchive}
            renderItem={renderArchiveItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.archiveList}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 24,
  },
  archiveList: {
    padding: 16,
  },
  archiveItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkArchiveItem: {
    backgroundColor: '#1C1C1E',
  },
  selectedArchiveItem: {
    borderColor: '#FF7F50',
    borderWidth: 2,
  },
  archiveItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archiveDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  archiveIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  detailContent: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  journalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  journalText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  sleepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  sleepText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  moodPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  moodText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  darkText: {
    color: '#FFFFFF',
  },
}); 