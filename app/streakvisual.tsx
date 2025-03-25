import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { useRoutine } from '@/contexts/RoutineContext';

const StreakTreeVisualizer = ({ 
  currentStreak = 31,
  isActive = true,
  maxDaysToShow = 30,
  onPress = () => {}
}) => {
  const { fetchStreaks, streaks } = useRoutine();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeScale] = useState(new Animated.Value(isActive ? 1 : 0.7));
  const [treeColor] = useState(new Animated.Value(isActive ? 1 : 0));
  const [treeShake] = useState(new Animated.Value(0));
  
  // Tree growth stages
  const stages = {
    sapling: { min: 1, max: 7 },
    youngTree: { min: 8, max: 14 },
    matureTree: { min: 15, max: 21 },
    forest: { min: 22, max: Infinity }
  };
  
  // Determine current stage
  const getCurrentStage = () => {
    if (currentStreak < stages.sapling.max) return 'sapling';
    if (currentStreak < stages.youngTree.max) return 'youngTree';
    if (currentStreak < stages.matureTree.max) return 'matureTree';
    return 'forest';
  };
  
  const currentStage = getCurrentStage();
  
  // Animate tree when streak status changes
  useEffect(() => {
    if (isActive) {
      // Grow the tree
      Animated.parallel([
        Animated.timing(treeScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        Animated.timing(treeColor, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      // Wither the tree
      Animated.sequence([
        Animated.timing(treeShake, {
          toValue: 1,
          duration: 800,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(treeScale, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(treeColor, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          })
        ])
      ]).start();
    }
  }, [isActive]);
  
  // Interpolate tree color based on active state
  const treeColorInterpolation = treeColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#8B4513', '#228B22']
  });
  
  const leafColorInterpolation = treeColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#A9A9A9', '#32CD32']
  });
  
  // Shake animation for when streak breaks
  const shakeInterpolation = treeShake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-3deg', '3deg', '-3deg', '3deg', '0deg']
  });
  
  // Tree drawing functions for different stages
  const renderSapling = () => (
    <G>
      <Path 
        d={`M 50 200 L 50 120 M 50 180 L 35 160 M 50 160 L 65 140 M 50 140 L 30 120`}
        stroke={treeColorInterpolation}
        strokeWidth={4}
        fill="none"
      />
      <Circle cx="50" cy="110" r="15" fill={leafColorInterpolation} />
      <Circle cx="30" cy="115" r="10" fill={leafColorInterpolation} />
      <Circle cx="65" cy="135" r="10" fill={leafColorInterpolation} />
    </G>
  );
  
  const renderYoungTree = () => (
    <G>
      <Path 
        d={`M 50 200 L 50 100 M 50 180 L 30 150 M 50 160 L 70 130 M 50 140 L 25 110 M 50 120 L 75 90`}
        stroke={treeColorInterpolation}
        strokeWidth={5}
        fill="none"
      />
      <Circle cx="50" cy="90" r="20" fill={leafColorInterpolation} />
      <Circle cx="25" cy="105" r="15" fill={leafColorInterpolation} />
      <Circle cx="75" cy="85" r="15" fill={leafColorInterpolation} />
      <Circle cx="30" cy="145" r="12" fill={leafColorInterpolation} />
      <Circle cx="70" cy="125" r="12" fill={leafColorInterpolation} />
    </G>
  );
  
  const renderMatureTree = () => (
    <G>
      <Path 
        d={`M 50 200 L 50 80 M 30 200 C 35 150, 45 120, 20 90 M 70 200 C 65 150, 55 120, 80 90 M 50 140 L 20 120 M 50 120 L 80 100 M 50 100 L 30 80`}
        stroke={treeColorInterpolation}
        strokeWidth={6}
        fill="none"
      />
      <Circle cx="50" cy="70" r="25" fill={leafColorInterpolation} />
      <Circle cx="20" cy="85" r="20" fill={leafColorInterpolation} />
      <Circle cx="80" cy="85" r="20" fill={leafColorInterpolation} />
      <Circle cx="20" cy="115" r="15" fill={leafColorInterpolation} />
      <Circle cx="80" cy="95" r="15" fill={leafColorInterpolation} />
      <Circle cx="30" cy="75" r="15" fill={leafColorInterpolation} />
    </G>
  );
  
  const renderForest = () => (
    <G>
      {/* Main tree */}
      <Path 
        d={`M 50 200 L 50 70 M 30 200 C 35 150, 45 110, 15 80 M 70 200 C 65 150, 55 110, 85 80`}
        stroke={treeColorInterpolation}
        strokeWidth={7}
        fill="none"
      />
      <Circle cx="50" cy="60" r="30" fill={leafColorInterpolation} />
      <Circle cx="15" cy="75" r="25" fill={leafColorInterpolation} />
      <Circle cx="85" cy="75" r="25" fill={leafColorInterpolation} />
      
      {/* Additional trees */}
      <Path 
        d={`M 15 200 L 15 150 M 85 200 L 85 150`}
        stroke={treeColorInterpolation}
        strokeWidth={5}
        fill="none"
      />
      <Circle cx="15" cy="140" r="20" fill={leafColorInterpolation} />
      <Circle cx="85" cy="140" r="20" fill={leafColorInterpolation} />
    </G>
  );
  
  // Render the appropriate tree based on the current streak stage
  const renderTree = () => {
    switch (currentStage) {
      case 'sapling':
        return renderSapling();
      case 'youngTree':
        return renderYoungTree();
      case 'matureTree':
        return renderMatureTree();
      case 'forest':
        return renderForest();
      default:
        return renderSapling();
    }
  };
  
  useEffect(() => {
    const loadStreaks = async () => {
      try {
        setLoading(true);
        await fetchStreaks(); // Call the function to fetch streaks
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadStreaks();
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.streakLabel}>
        {isActive ? 'Current Streak' : 'Streak Ended'}
      </Text>
      <Text style={styles.streakCount}>
        {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
      </Text>
      
      <Animated.View 
        style={[
          styles.svgContainer,
          {
            transform: [
              { scale: treeScale },
              { rotate: shakeInterpolation }
            ]
          }
        ]}
      >
        <Svg height="220" width="100" viewBox="0 0 100 220">
          {renderTree()}
          
          {/* Ground */}
          <Path 
            d="M 0 200 Q 50 190, 100 200 L 100 220 L 0 220 Z" 
            fill="#8a6642" 
          />
        </Svg>
      </Animated.View>
      
      <Text style={styles.motivationText}>
        {isActive 
          ? getMotivationalText(currentStreak, currentStage) 
          : "Don't worry! You can start again."}
      </Text>
    </View>
  );
};

// Helper function to get motivational text based on streak
const getMotivationalText = (streak, stage) => {
  if (stage === 'sapling') {
    return "Great start! Keep nurturing your habit.";
  } else if (stage === 'youngTree') {
    return "Your habit is growing stronger every day!";
  } else if (stage === 'matureTree') {
    return "Impressive dedication! Your tree is thriving.";
  } else {
    return "Amazing! You've created a forest of healthy habits!";
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  svgContainer: {
    marginVertical: 20,
  },
  streakLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 5,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
  },
  motivationText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  }
});

export default StreakTreeVisualizer;