import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  useColorScheme,
  Dimensions,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  label: string;
  icon: string;
  onPress: () => void;
}

interface MenuProps {
  visible: boolean;
  onDismiss: () => void;
  items: MenuItem[];
  trigger: React.ReactNode;
}

export function Menu({ visible, onDismiss, items, trigger }: MenuProps) {
  const isDark = useColorScheme() === 'dark';
  const triggerRef = useRef<View>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        const windowWidth = Dimensions.get('window').width;
        // Calculate position: align right edge of menu with right edge of trigger
        // and place it below the trigger
        setPosition({
          top: y + height + 8, // 8px gap
          right: windowWidth - (x + width),
        });
      });
    }
  }, [visible]);

  return (
    <View ref={triggerRef} collapsable={false}>
      {trigger}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.overlay}>
            {position && (
              <View style={[
                styles.menu,
                isDark && styles.menuDark,
                {
                  top: position.top,
                  right: position.right,
                }
              ]}>
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      index < items.length - 1 && styles.menuItemBorder,
                      isDark && styles.menuItemBorderDark
                    ]}
                    onPress={() => {
                      onDismiss();
                      // Small delay to allow ripple/animation to finish if needed, 
                      // but mostly to ensure modal closes before navigation
                      setTimeout(() => item.onPress(), 100);
                    }}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={isDark ? '#fff' : '#000'} 
                      style={styles.menuIcon} 
                    />
                    <Text style={[
                      styles.menuText,
                      isDark && styles.menuTextDark
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // No dimming for tooltip feel, or 'rgba(0,0,0,0.1)'
  },
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  menuDark: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemBorderDark: {
    borderBottomColor: '#333',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  menuTextDark: {
    color: '#fff',
  },
}); 