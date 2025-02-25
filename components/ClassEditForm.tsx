import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  DayOfTheWeek, 
  ClassType, 
  ClassFrequency,
  EditableClass 
} from '../types/TimetableTypes';

interface ClassEditFormProps {
  data: EditableClass | null;
  onChange: (data: EditableClass) => void;
  onDelete?: (id: string) => void;
}

export function ClassEditForm({ data, onChange, onDelete }: ClassEditFormProps) {
  if (!data) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Course Name</Text>
        <TextInput
          style={styles.input}
          value={data.courseName}
          onChangeText={(text) => onChange({ ...data, courseName: text })}
          placeholder="Enter course name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Course Code</Text>
        <TextInput
          style={styles.input}
          value={data.courseCode}
          onChangeText={(text) => onChange({ ...data, courseCode: text })}
          placeholder="Enter course code"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Room</Text>
        <TextInput
          style={styles.input}
          value={data.room}
          onChangeText={(text) => onChange({ ...data, room: text })}
          placeholder="Enter room number"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Instructor</Text>
        <TextInput
          style={styles.input}
          value={data.instructor}
          onChangeText={(text) => onChange({ ...data, instructor: text })}
          placeholder="Enter instructor name"
        />
      </View>

      {/* Add time pickers and day selectors here */}

      {data.id && onDelete && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(data.id)}
        >
          <Text style={styles.deleteText}>Remove This Class</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#6C6C70',
    marginBottom: 8,
    fontFamily: 'Vercetti-Regular',
  },
  input: {
    fontSize: 17,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  deleteButton: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
}); 