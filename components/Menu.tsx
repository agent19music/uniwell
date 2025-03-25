import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  useColorScheme 
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

  return (
    <View>
      {trigger}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onDismiss}
        >
          <View style={[
            styles.menu,
            isDark && styles.menuDark,
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
                  item.onPress();
                  onDismiss();
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
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  menuDark: {
    backgroundColor: '#1a1a1a',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemBorderDark: {
    borderBottomColor: '#333',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Vercetti-Regular',
  },
  menuTextDark: {
    color: '#fff',
  },
}); 