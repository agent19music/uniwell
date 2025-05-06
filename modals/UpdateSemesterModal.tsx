import React, { useState, useContext} from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { TextInput } from 'react-native-gesture-handler';
import { Picker } from '@react-native-picker/picker';
import { Semester, SemesterType } from '../types/TimetableTypes';
import { AuthContext } from '@/contexts/AuthContext';

type UpdateSemesterModalProps = {
  onClose: () => void;
  onSave: (semester: Semester) => void;
  onDelete: (semesterId: string) => void;
  semester: Semester;
};

const UpdateSemesterModal: React.FC<UpdateSemesterModalProps> = ({
  onClose,
  onSave,
  onDelete,
  semester,
}) => {
  const colorScheme = useColorScheme();
  
  const colors = {
    background: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    card: colorScheme === 'dark' ? '#1E1E1E' : '#F0F0F0',
    border: colorScheme === 'dark' ? '#383838' : '#E0E0E0',
    primary: '#FF7F50',
    primaryDark: '#FF7F50',
    error: '#B00020',
  };

  const [name, setName] = useState(semester.name);
  const [type, setType] = useState<SemesterType>(semester.type);
  const [startDate, setStartDate] = useState(semester.startDate);
  const [endDate, setEndDate] = useState(semester.endDate);
  const [isActive, setIsActive] = useState(semester.status === 'active');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');

    if (!name.trim()) {
      setError('Semester name is required');
      return;
    }

    if (endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    const updatedSemester: Semester = {
      ...semester,
      name,
      type,
      startDate,
      endDate,
      status: isActive ? 'active' : 'inactive',
    };

    onSave(updatedSemester);
  };

  const handleDelete = () => {
    onDelete(semester.id);
    onClose();
  };

  // Exact same JSX structure as your original modal
  return (
    <View style={styles.overlay}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FF7F50" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Semester
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Semester Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter semester name"
              placeholderTextColor={colors.text + '80'}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Semester Type</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Picker
                selectedValue={type}
                onValueChange={(itemValue) => setType(itemValue as SemesterType)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Fall" value={SemesterType.FALL} />
                <Picker.Item label="Spring" value={SemesterType.SPRING} />
                <Picker.Item label="Summer" value={SemesterType.SUMMER} />
                <Picker.Item label="Winter" value={SemesterType.WINTER} />
                <Picker.Item label="Custom" value={SemesterType.CUSTOM} />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {format(startDate, 'MMMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {format(endDate, 'MMMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Set as Active Semester</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={isActive ? colors.primaryDark : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
            <Text style={[styles.helperText, { color: colors.text + '80' }]}>
              Only one semester can be active at a time
            </Text>
          </View>
          
          {semester && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

// Exact same styles as your original modal
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'SF-Regular',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});

export default UpdateSemesterModal;