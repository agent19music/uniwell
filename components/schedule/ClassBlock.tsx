import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Modal, TouchableOpacity, ViewProps, Dimensions } from 'react-native';
import { PencilSimple, CheckCircle, Trash, MapPin } from 'phosphor-react-native';
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
    positionTop?: number;
    attendanceRate?: number;
    classId?: string;
  }
  
  interface ClassBlockProps {
    classInfo: ClassInfo;
    isDark: boolean;
    isWeekView?: boolean;
    onEdit: (classInfo: ClassInfo) => void;
    onDelete: (classId: string) => void;
  }
  
 export const ClassBlock = ({ classInfo, isDark, isWeekView, onEdit, onDelete }: ClassBlockProps) => {
    const styles = useClassBlockStyles(isDark);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const blockRef = useRef<View>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const menuScaleAnim = useRef(new Animated.Value(0.9)).current;
    const menuOpacityAnim = useRef(new Animated.Value(0)).current;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    
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
        // Calculate initial position
        let x = px + width - 150; // Menu width is 180, offset by 30
        let y = py - 10;
        
        // Ensure menu stays within screen bounds
        if (x < 10) x = 10;
        if (x + 180 > screenWidth) x = screenWidth - 190;
        if (y < 10) y = 10;
        if (y + 200 > screenHeight) y = screenHeight - 210;
        
        setMenuPosition({ x, y });
        setMenuVisible(true);
        
        // Animate menu appearance
        Animated.parallel([
          Animated.spring(menuScaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(menuOpacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    };
  
    const handleMenuClose = () => {
      Animated.parallel([
        Animated.timing(menuScaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMenuVisible(false);
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
              isWeekView && styles.weekViewBlock,
              { 
                backgroundColor: classInfo.color + (isDark ? '90' : 'D0'),
                top: classInfo.positionTop !== undefined ? classInfo.positionTop : classInfo.startTime * 60,
                height: classInfo.duration * 60,
              }
            ]}
          >
            {isWeekView ? (
              <View style={styles.weekViewContent}>
                <Text style={styles.weekViewClassName} numberOfLines={1}>
                  {classInfo.name}
                </Text>
                {classInfo.location && (
                  <Text style={styles.weekViewLocation} numberOfLines={1}>
                    {classInfo.location}
                  </Text>
                )}
                {classInfo.attendanceRate !== undefined && (
                  <View style={[
                    styles.attendanceBadge,
                    {
                      backgroundColor: classInfo.attendanceRate >= 80 ? 'rgba(76, 217, 100, 0.3)' :
                                      classInfo.attendanceRate >= 60 ? 'rgba(255, 149, 0, 0.3)' :
                                      'rgba(255, 59, 48, 0.3)'
                    }
                  ]}>
                    <Text style={[
                      styles.attendanceBadgeText,
                      {
                        color: classInfo.attendanceRate >= 80 ? '#4CD964' :
                               classInfo.attendanceRate >= 60 ? '#FF9500' :
                               '#FF3B30'
                      }
                    ]}>
                      {classInfo.attendanceRate}%
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.classBlockContent}>
                <View style={styles.classBlockDot} />
                <View style={styles.classBlockHeader}>
                  <View style={styles.classBlockHeaderTop}>
                    <Text style={styles.classBlockTime}>
                      {classInfo.startTimeString} - {classInfo.endTimeString}
                    </Text>
                    {classInfo.attendanceRate !== undefined && (
                      <View style={[
                        styles.attendanceBadge,
                        {
                          backgroundColor: classInfo.attendanceRate >= 80 ? 'rgba(76, 217, 100, 0.3)' :
                                          classInfo.attendanceRate >= 60 ? 'rgba(255, 149, 0, 0.3)' :
                                          'rgba(255, 59, 48, 0.3)'
                        }
                      ]}>
                        <Text style={[
                          styles.attendanceBadgeText,
                          {
                            color: classInfo.attendanceRate >= 80 ? '#4CD964' :
                                   classInfo.attendanceRate >= 60 ? '#FF9500' :
                                   '#FF3B30'
                          }
                        ]}>
                          {classInfo.attendanceRate}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.classBlockName} numberOfLines={1}>
                    {classInfo.name}
                  </Text>
                  {classInfo.location && (
                    <View style={styles.classLocationContainer}>
                      <MapPin size={12} color={isDark ? "#CCCCCC" : "#666666"} weight="regular" />
                      <Text style={styles.classBlockLocation} numberOfLines={1}>
                        {classInfo.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Pressable>
        </Animated.View>
  
        {/* Context Menu */}
        <Modal
          transparent={true}
          visible={menuVisible}
          animationType="none"
          onRequestClose={handleMenuClose}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleMenuClose}
          >
            <Animated.View 
              style={[
                styles.contextMenu, 
                isDark && styles.darkContextMenu,
                {
                  left: menuPosition.x,
                  top: menuPosition.y,
                  opacity: menuOpacityAnim,
                  transform: [{ scale: menuScaleAnim }],
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  handleMenuClose();
                  onEdit(classInfo);
                }}
              >
                <PencilSimple size={18} color={isDark ? '#FFFFFF' : '#333333'} weight="regular" />
                <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Edit</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, isDark && styles.darkDivider]} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  handleMenuClose();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <CheckCircle size={18} color={isDark ? '#FFFFFF' : '#333333'} weight="regular" />
                <Text style={[styles.menuText, isDark && styles.darkMenuText]}>Mark Completed</Text>
              </TouchableOpacity>
              
              <View style={[styles.divider, isDark && styles.darkDivider]} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  handleMenuClose();
                  onDelete(classInfo.id);
                }}
              >
                <Trash size={18} color={isDark ? '#FF453A' : '#FF3B30'} weight="regular" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </Animated.View>
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
    weekViewBlock: {
      left: 2,
      right: 2,
      marginHorizontal: 1,
      padding: 4,
      borderRadius: 4,
    },
    classBlockContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    weekViewContent: {
      flex: 1,
    },
    weekViewClassName: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    weekViewLocation: {
      fontSize: 8,
      color: '#FFFFFF',
      opacity: 0.9,
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
    classBlockHeaderTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    classBlockTime: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    attendanceBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    attendanceBadgeText: {
      fontSize: 10,
      fontWeight: '600',
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