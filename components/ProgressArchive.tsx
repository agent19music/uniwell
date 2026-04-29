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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { useRoutine } from '../contexts/RoutineContext';
import { useMood } from '../contexts/MoodContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

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
  const { colors, isDark } = useTheme();

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
        style={[
          styles.archiveItem,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadow.medium,
            borderColor: isSelected ? '#FF7F50' : 'transparent',
          },
          isSelected && styles.selectedArchiveItem
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <View style={styles.archiveItemContent}>
          <Text style={[styles.archiveDate, { color: colors.textPrimary }]}>
            {getDateLabel(item.date)}
          </Text>
          <View style={styles.archiveIcons}>
            {item.hasRoutineCompletion && (
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            )}
            {item.hasJournalEntry && (
              <Ionicons name="journal" size={16} color={colors.warning} />
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
          <Text style={[styles.detailDate, { color: colors.textPrimary }]}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDate(null)}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.detailContent}>
          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Routines</Text>
            {routineCompletions.map((completion) => (
              <View key={completion.id} style={[styles.completionItem, { backgroundColor: colors.card }]}>
                <Ionicons
                  name={completion.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={completion.status === 'completed' ? colors.success : colors.error}
                />
                <Text style={[styles.completionText, { color: colors.textPrimary }]}>
                  {completion.routine.title}
                </Text>
              </View>
            ))}
          </View>

          {archive.hasJournalEntry && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Journal</Text>
              <View style={[styles.journalPreview, { backgroundColor: colors.card }]}>
                <Ionicons name="journal" size={24} color={colors.warning} />
                <Text style={[styles.journalText, { color: colors.textPrimary }]}>
                  Journal entry recorded
                </Text>
              </View>
            </View>
          )}

          {archive.hasSleepEntry && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sleep</Text>
              <View style={[styles.sleepPreview, { backgroundColor: colors.card }]}>
                <Ionicons name="moon" size={24} color="#5856D6" />
                <Text style={[styles.sleepText, { color: colors.textPrimary }]}>
                  {archive.sleepQualityRating ? `${archive.sleepQualityRating}/10` : 'Sleep recorded'}
                </Text>
              </View>
            </View>
          )}

          {archive.moodRating && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mood</Text>
              <View style={[styles.moodPreview, { backgroundColor: colors.card }]}>
                <Ionicons name="happy" size={24} color={colors.warning} />
                <Text style={[styles.moodText, { color: colors.textPrimary }]}>
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Progress Archive</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  placeholder: {
    width: 24,
  },
  archiveList: {
    padding: 16,
  },
  archiveItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
  },
  selectedArchiveItem: {
  },
  archiveItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archiveDate: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
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
    fontFamily: 'Vercetti-Regular',
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
    marginBottom: 12,
    fontFamily: 'Vercetti-Regular',
  },
  completionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Vercetti-Regular',
  },
  journalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  journalText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Vercetti-Regular',
  },
  sleepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  sleepText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Vercetti-Regular',
  },
  moodPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  moodText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Vercetti-Regular',
  },
}); 