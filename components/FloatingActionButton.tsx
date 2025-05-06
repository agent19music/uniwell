import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
  iconSize?: number;
  iconColor?: string;
  style?: object;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  color = '#FF7F50',
  iconSize = 24,
  iconColor = '#FFFFFF',
  style
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: color },
        style
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons 
        name={icon}
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default FloatingActionButton;