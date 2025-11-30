import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, Clock, MapPin, Calendar, TrendUp } from 'phosphor-react-native';
import { BlurView } from 'expo-blur';
import { ClassInfo } from './ClassBlock';

interface ClassDetailDialogProps {
  visible: boolean;
  classInfo: ClassInfo | null;
  isDark: boolean;
  onClose: () => void;
}

export const ClassDetailDialog = ({ visible, classInfo, isDark, onClose }: ClassDetailDialogProps) => {
  if (!classInfo) return null;

  const styles = useStyles(isDark);
  
  const getAttendanceColor = (rate?: number) => {
    if (rate === undefined) return '#8B7355';
    if (rate >= 80) return '#4CD964';
    if (rate >= 60) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <BlurView intensity={20} style={styles.dialogContainer}>
          <View style={[styles.dialog, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={[styles.colorIndicator, { backgroundColor: classInfo.color }]} />
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={isDark ? '#FBEEE3' : '#8B7355'} weight="bold" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.className, { color: isDark ? '#FBEEE3' : '#8B7355' }]}>
                {classInfo.name}
              </Text>
              <Text style={[styles.courseCode, { color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.6)' }]}>
                {classInfo.id}
              </Text>
            </View>

            {/* Details */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Time */}
              <View style={styles.detailRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(139, 115, 85, 0.15)' : 'rgba(251, 238, 227, 0.5)' }]}>
                  <Clock size={20} color="#8B7355" weight="bold" />
                </View>
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.6)' }]}>
                    Time
                  </Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#FBEEE3' : '#8B7355' }]}>
                    {classInfo.startTimeString} - {classInfo.endTimeString}
                  </Text>
                </View>
              </View>

              {/* Duration */}
              <View style={styles.detailRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(139, 115, 85, 0.15)' : 'rgba(251, 238, 227, 0.5)' }]}>
                  <Calendar size={20} color="#8B7355" weight="bold" />
                </View>
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.6)' }]}>
                    Duration
                  </Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#FBEEE3' : '#8B7355' }]}>
                    {classInfo.duration} {classInfo.duration === 1 ? 'hour' : 'hours'}
                  </Text>
                </View>
              </View>

              {/* Location */}
              {classInfo.location && (
                <View style={styles.detailRow}>
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(139, 115, 85, 0.15)' : 'rgba(251, 238, 227, 0.5)' }]}>
                    <MapPin size={20} color="#8B7355" weight="bold" />
                  </View>
                  <View style={styles.detailText}>
                    <Text style={[styles.detailLabel, { color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.6)' }]}>
                      Location
                    </Text>
                    <Text style={[styles.detailValue, { color: isDark ? '#FBEEE3' : '#8B7355' }]}>
                      {classInfo.location}
                    </Text>
                  </View>
                </View>
              )}

              {/* Attendance */}
              {classInfo.attendanceRate !== undefined && (
                <View style={styles.detailRow}>
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(139, 115, 85, 0.15)' : 'rgba(251, 238, 227, 0.5)' }]}>
                    <TrendUp size={20} color="#8B7355" weight="bold" />
                  </View>
                  <View style={styles.detailText}>
                    <Text style={[styles.detailLabel, { color: isDark ? 'rgba(251, 238, 227, 0.6)' : 'rgba(139, 115, 85, 0.6)' }]}>
                      Attendance Rate
                    </Text>
                    <Text style={[styles.detailValue, { color: getAttendanceColor(classInfo.attendanceRate) }]}>
                      {classInfo.attendanceRate}%
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const useStyles = (isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  dialog: {
    borderRadius: 24,
    maxHeight: '80%',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(251, 238, 227, 0.1)' : 'rgba(139, 115, 85, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  closeButton: {
    padding: 4,
  },
  className: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 16,
    fontFamily: 'SF-Regular',
  },
  content: {
    padding: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailText: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'SF-Regular',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});
