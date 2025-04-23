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
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
  },
  darkModalContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
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
    padding: 5,
  },
  content: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#FF7F50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 25,
  },
  darkCreateButton: {
    backgroundColor: '#FF7F50',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  emptySemesters: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  semesterList: {
    flexGrow: 1,
  },
  semesterItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  semesterDates: {
    fontSize: 14,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#FF7F50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  darkConfirmButton: {
    backgroundColor: '#FF7F50',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SemesterSelectionModal;

