import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';
import { StreakType } from '@/types/Streak'; // Adjust the import based on your types

interface EditStreakModalProps {
  visible: boolean;
  onClose: () => void;
  streakId: string; // Pass the streak ID to edit
}

const EditStreakModal: React.FC<EditStreakModalProps> = ({ visible, onClose, streakId }) => {
  const { updateStreak, getStreakById } = useRoutine();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StreakType>('build');
  const [startDate, setStartDate] = useState(new Date());

  useEffect(() => {
    const fetchStreak = async () => {
      const streak = await getStreakById(streakId);
      if (streak) {
        setTitle(streak.title);
        setType(streak.type);
        setStartDate(new Date(streak.startDate));
      }
    };
    fetchStreak();
  }, [streakId]);

  const handleSave = async () => {
    await updateStreak(streakId, { title, type, startDate });
    onClose();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Streak Title"
        value={title}
        onChangeText={setTitle}
      />
      <TouchableOpacity onPress={() => setType(type === 'build' ? 'break' : 'build')}>
        <Text>{type === 'build' ? 'Switch to Break' : 'Switch to Build'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSave}>
        <Text>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose}>
        <Text>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
});

export default EditStreakModal; 