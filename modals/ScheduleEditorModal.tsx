import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Animated,
  PanResponder
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSemester } from '@/contexts/SemesterContext';
import { ClassSchedule } from '@/types/TimetableTypes';
import AddClassModal from './AddClassModal';
import EditClassModal from './EditClassModal';
import { ActivityIndicator } from 'react-native';

interface ScheduleEditorModalProps {
  visible: boolean;
  onClose: () => void;
  semesterId: string;
  isLoading?: boolean;
}

const ClassSkeleton = ({ isDark }: { isDark: boolean }) => (
  <View style={[styles.classItem, isDark && styles.darkClassItem]}>
    <View style={styles.classItemContent}>
      <View style={[styles.colorDot, styles.skeletonDot]} />
      <View style={styles.classInfo}>
        <View 
          style={[
            styles.skeletonText, 
            styles.skeletonTitle,
            isDark && styles.darkSkeletonText
          ]} 
        />
        <View 
          style={[
            styles.skeletonText, 
            styles.skeletonDetails,
            isDark && styles.darkSkeletonText
          ]} 
        />
      </View>
      <View style={[styles.skeletonChevron, isDark && styles.darkSkeletonText]} />
    </View>
  </View>
);

export default function ScheduleEditorModal({
  visible,
  onClose,
  semesterId,
  isLoading = false
}: ScheduleEditorModalProps) {
  const { classSchedules } = useSemester();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [slideAnim] = useState(new Animated.Value(visible ? 1 : 0));
  console.log('classSchedule in schedule editor',classSchedules)
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  console.log("class schedule data $$" ,classSchedules)

  // Filter classes for current semester - Update this filter
  const semesterClasses = classSchedules.filter(
    schedule => schedule.semesterId === semesterId
  );

  const [panResponder] = useState(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(1 - (gestureState.dy / 300));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  );

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleEditClass = (classData: any) => {

    
    console.log('Formatted class data:', classData);
    setSelectedClass(classData);
    setIsEditModalVisible(true);
  };

  const handleAddNew = () => {
    setIsAddModalVisible(true);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour > 12 ? hour - 12 : hour;
    return `${formattedHour}:${minutes} ${period}`;
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.backdrop}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.modalContainer,
              isDark && styles.darkModalContainer,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={[styles.header, isDark && styles.darkHeader]}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FF7F50" />
              </TouchableOpacity>
              <Text style={[styles.title, isDark && styles.darkText]}>
                Schedule Editor
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                <Ionicons name="add" size={24} color="#FF7F50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <View style={[styles.classList, isDark && styles.darkClassList]}>
                {isLoading ? (
                  <>
                    <ClassSkeleton isDark={isDark} />
                    <ClassSkeleton isDark={isDark} />
                    <ClassSkeleton isDark={isDark} />
                  </>
                ) : (
                  <>
                    {semesterClasses.map((classData) => (
                      <TouchableOpacity
                        key={classData.id}
                        style={[styles.classItem, isDark && styles.darkClassItem]}
                        onPress={() => handleEditClass(classData)}
                      >
                        <View style={styles.classItemContent}>
                          <View style={[styles.colorDot, { backgroundColor: '#FF7F50' }]} />
                          <View style={styles.classInfo}>
                            <Text style={[styles.className, isDark && styles.darkText]}>
                              {classData.courseName}
                            </Text>
                            <Text style={[styles.classDetails, isDark && styles.darkText]}>
                              {classData.daysOfWeek.join(', ')} • {formatTime(classData.startTime)}
                            </Text>
                          </View>
                          <Ionicons 
                            name="chevron-forward" 
                            size={20} 
                            color={isDark ? "#8E8E93" : "#C7C7CC"} 
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                    {semesterClasses.length === 0 && (
                      <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, isDark && styles.darkText]}>
                          No classes added yet
                        </Text>
                        <TouchableOpacity 
                          style={styles.emptyStateButton}
                          onPress={handleAddNew}
                        >
                          <Text style={styles.emptyStateButtonText}>Add Your First Class</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* Add Class Modal */}
      {isAddModalVisible && (
        <AddClassModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          semesterId={semesterId}
        />
      )}

      {/* Edit Class Modal */}
      {isEditModalVisible && selectedClass && (
        <EditClassModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedClass(null);
          }}
          classSchedule={selectedClass}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '90%',
  },
  darkModalContainer: {
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  darkHeader: {
    borderBottomColor: '#38383A',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  darkText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  classList: {
    paddingTop: 8,
  },
  darkClassList: {
    backgroundColor: '#1C1C1E',
  },
  classItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  darkClassItem: {
    backgroundColor: '#2C2C2E',
    borderBottomColor: '#38383A',
  },
  classItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'Vercetti-Regular',
  },
  classDetails: {
    fontSize: 14,
    color: '#6C6C70',
    marginTop: 4,
    fontFamily: 'Vercetti-Regular',
  },
  closeButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
    fontFamily: 'Vercetti-Regular',
  },
  emptyStateButton: {
    backgroundColor: '#FF7F50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
  skeletonDot: {
    backgroundColor: '#E1E9EE',
    opacity: 0.7,
  },
  skeletonText: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    opacity: 0.7,
  },
  darkSkeletonText: {
    backgroundColor: '#38383A',
    opacity: 0.7,
  },
  skeletonTitle: {
    height: 20,
    width: '70%',
    marginBottom: 8,
  },
  skeletonDetails: {
    height: 16,
    width: '50%',
  },
  skeletonChevron: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E1E9EE',
    opacity: 0.7,
  },
  // Shimmer animation should be implemented using Animated API
  // Remove keyframes as they're not supported in React Native StyleSheet
});






