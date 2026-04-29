import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, useColorScheme } from 'react-native';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import CreateSemesterModal from './CreateSemesterModal';
import UpdateSemesterModal from './UpdateSemesterModal';
import { Semester,NewSemester } from '@/types/TimetableTypes';
interface SemesterSelectionModalProps {
  onClose: () => void;
  onNewSemester: () => void;  // Updated type
  onSemesterSelected: (semesterId: string) => Promise<void>;
  semesters: Semester[];
}

const SemesterSelectionModal = ({ onClose, onNewSemester, onSemesterSelected, semesters }: SemesterSelectionModalProps) => {
  // State and helper functions
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Handler functions
  const handleCreateModalClose = () => {
    setIsCreateModalVisible(false);
  };

  const handleSaveSemester = (semester: NewSemester) => {
    onNewSemester();
    setIsCreateModalVisible(false);
  };

  const handleCreateNewSemester = () => {
    onNewSemester();
    onClose();
  };

  const handleSemesterSelect = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
  };

  const handleConfirmSelection = async () => {
    if (selectedSemesterId) {
      await onSemesterSelected(selectedSemesterId);
      onClose();
    }
  };

  // Render functions for item rendering
  const renderSemesterItem = ({ item }: { item: Semester }) => {
    const isSelected = selectedSemesterId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.semesterItem,
          isSelected && styles.selectedSemesterItem,
          isDark && styles.darkSemesterItem,
          isSelected && isDark && styles.darkSelectedSemesterItem
        ]}
        onPress={() => handleSemesterSelect(item.id)}
      >
        <View style={styles.semesterItemContent}>
          <View>
            <Text style={[styles.semesterName, isDark && styles.darkText]}>
              {item.name}
            </Text>
            <Text style={[styles.semesterDates, isDark && styles.darkSubText]}>
              {format(new Date(item.startDate), 'MMM d, yyyy')} - {format(new Date(item.endDate), 'MMM d, yyyy')}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#FF7F50"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Main return statement with correct structure
  return (
    <>
      <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Select Semester</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <AntDesign name="close" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.instructionText, isDark && styles.darkText]}>
            Please select an existing semester or create a new one to continue.
          </Text>
          
          <TouchableOpacity
            style={[styles.createButton, isDark && styles.darkCreateButton]}
            onPress={handleCreateNewSemester}
          >
            <AntDesign name="plus" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create New Semester</Text>
          </TouchableOpacity>
          
          {semesters.length > 0 ? (
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Your Semesters</Text>
          ) : (
            <Text style={[styles.emptySemesters, isDark && styles.darkSubText]}>
              You don't have any semesters yet. Create one to get started.
            </Text>
          )}
        </View>
        
        {/* List of semesters */}
        {semesters.length > 0 && (
          <FlatList
            data={semesters}
            renderItem={renderSemesterItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.semesterList}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {selectedSemesterId && (
          <TouchableOpacity
            style={[styles.confirmButton, isDark && styles.darkConfirmButton]}
            onPress={handleConfirmSelection}
          >
            <Text style={styles.confirmButtonText}>Confirm Selection</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isCreateModalVisible && (
        <CreateSemesterModal
          onClose={handleCreateModalClose}
        />
      )}
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: '85%',
    maxHeight: '95%',
    width: '100%',
  },
  darkModalContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 17,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#FF7F50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 28,
  },
  darkCreateButton: {
    backgroundColor: '#FF7F50',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 14,
  },
  emptySemesters: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
  },
  semesterList: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  semesterItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#ddd',
  },
  darkSemesterItem: {
    backgroundColor: '#2a2a2a',
    borderLeftColor: '#444',
  },
  selectedSemesterItem: {
    borderLeftColor: '#FF7F50',
    backgroundColor: '#FFF3EE',
  },
  darkSelectedSemesterItem: {
    backgroundColor: '#3a2a25',
    borderLeftColor: '#FF7F50',
  },
  semesterItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterName: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  semesterDates: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  confirmButton: {
    backgroundColor: '#FF7F50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  darkConfirmButton: {
    backgroundColor: '#FF7F50',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default SemesterSelectionModal;

