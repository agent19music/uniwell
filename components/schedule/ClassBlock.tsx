import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Modal, TouchableOpacity, ViewProps } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';


export interface ClassInfo {
    id: string;
    startTime: number;
    endTime: number;
    startTimeString: string;
    endTimeString: string;
    duration: number;
    name: string;
    color: string;
    location?: string;
  }
  
  interface ClassBlockProps {
    classInfo: ClassInfo;
    isDark: boolean;
    onEdit: (classInfo: ClassInfo) => void;
    onDelete: (classId: string) => void;
  }
  
 export const ClassBlock = ({ classInfo, isDark, onEdit, onDelete }: ClassBlockProps) => {
    const styles = useClassBlockStyles(isDark);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const blockRef = useRef<View>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handleLongPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      blockRef.current?.measure((fx, fy, width, height, px, py) => {
        setMenuPosition({ 
          x: px + width - 150,
          y: py - 10
        });
        setMenuVisible(true);
      });
    };
  
    return (
      <>
        <Animated.View
          ref={blockRef}
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Pressable
            onLongPress={handleLongPress}
            delayLongPress={300}
            style={[
              styles.classBlockContainer,
              { 
                backgroundColor: classInfo.color + (isDark ? '90' : 'D0'),
                top: classInfo.startTime * 60,
                height: classInfo.duration * 60,
              }
            ]}
          >
            <View style={styles.classBlockContent}>
              <View style={styles.classBlockDot} />
              <View style={styles.classBlockHeader}>
                <Text style={styles.classBlockTime}>
                  {classInfo.startTimeString} - {classInfo.endTimeString}
                </Text>
                <Text style={styles.classBlockName} numberOfLines={1}>
                  {classInfo.name}
                </Text>
                {classInfo.location && (
                  <View style={styles.classLocationContainer}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color={isDark ? "#CCCCCC" : "#666666"}
                    />
                    <Text style={styles.classBlockLocation} numberOfLines={1}>
                      {classInfo.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        </Animated.View>
  
        {/* Context Menu */}
        <Modal
          transparent={true}
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View 
              style={[
                styles.contextMenu, 
                isDark && styles.darkContextMenu,
                {
                  left: menuPosition.x,
                  top: menuPosition.y,
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  setMenuVisible(false);
                  onEdit(classInfo);
                }}
              >
                <Feather name="edit-2" size={18} color={isDark ? '#FFFFFF' : '#333333'} />
                <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Edit</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, isDark && styles.darkDivider]} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Feather name="check-circle" size={18} color={isDark ? '#FFFFFF' : '#333333'} />
                <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Mark Completed</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, isDark && styles.darkDivider]} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  onDelete(classInfo.id);
                }}
              >
                <Feather name="trash-2" size={18} color={isDark ? '#FF453A' : '#FF3B30'} />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  };
  
  const useClassBlockStyles = (isDark: boolean) => StyleSheet.create({
    classBlockContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderRadius: 8,
      padding: 8,
      marginHorizontal: 4,
      overflow: 'hidden',
    },
    classBlockContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    classBlockDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
      marginTop: 6,
      marginRight: 6,
    },
    classBlockHeader: {
      flex: 1,
    },
    classBlockTime: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    classBlockName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    classLocationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    classBlockLocation: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
      marginLeft: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    contextMenu: {
      position: 'absolute',
      width: 180,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
      overflow: 'hidden',
    },
    darkContextMenu: {
      backgroundColor: '#2C2C2E',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    menuText: {
      marginLeft: 10,
      fontSize: 15,
      color: '#000000',
    },
    darkMenuText: {
      color: '#FFFFFF',
    },
    divider: {
      height: 0.5,
      backgroundColor: '#E0E0E0',
    },
    darkDivider: {
      backgroundColor: '#3A3A3C',
    },
    deleteText: {
      marginLeft: 10,
      fontSize: 15,
      color: '#FF3B30',
    },
  });