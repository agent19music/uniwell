import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  interpolateColor,
  type SharedValue,
} from 'react-native-reanimated';

interface PaginationProps {
  scrollX: SharedValue<number>;
  data: Array<any>;
}

const Pagination: React.FC<PaginationProps> = ({ scrollX, data }) => {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {data.map((_, index) => {
        const animatedDotStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          
          const dotWidth = interpolate(
            scrollX.value,
            inputRange,
            [8, 24, 8],
            Extrapolate.CLAMP
          );
          
          const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolate.CLAMP
          );
          
          const backgroundColor = interpolateColor(
            scrollX.value,
            inputRange,
            ['#CCCCCC', '#304FFE', '#CCCCCC']
          );
          
          return {
            width: dotWidth,
            opacity,
            backgroundColor,
          };
        });
        
        return (
          <Animated.View
            key={`dot-${index}`}
            style={[styles.dot, animatedDotStyle]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default Pagination; 