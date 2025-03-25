import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoutine } from '@/contexts/RoutineContext';

interface EditRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  routineId: string; // Pass the routine ID to edit
}

const EditRoutineModal: React.FC<EditRoutineModalProps> = ({ visible, onClose, routineId }) => {
  const { updateRoutine, getRoutineById } = useRoutine();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState('daily');

  useEffect(() => {
    const fetchRoutine = async () => {
      const routine = await getRoutineById(routineId);
      if (routine) {
        setTitle(routine.title);
        setFrequency(routine.frequency);
      }
    };
    fetchRoutine();
  }, [routineId]);

  const handleSave = async () => {
    await updateRoutine(routineId, { title, frequency });
    onClose();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Routine Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Frequency"
        value={frequency}
        onChangeText={setFrequency}
      />
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

export default EditRoutineModal; 