import React from 'react';
import { View } from 'react-native';
import StreakVisualizer from '../components/StreakVisualizer';

interface StreakTreeVisualizerProps {
  currentStreak?: number;
  isActive?: boolean;
  maxDaysToShow?: number;
  onPress?: () => void;
}

const StreakTreeVisualizer: React.FC<StreakTreeVisualizerProps> = ({ 
  currentStreak = 31,
  isActive = true,
  maxDaysToShow = 30,
  onPress = () => {}
}) => {
  return (
    <View>
      <StreakVisualizer
        currentStreak={currentStreak}
        isActive={isActive}
        maxDaysToShow={maxDaysToShow}
        onPress={onPress}
      />
    </View>
  );
};

export default StreakTreeVisualizer;