import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface WebScreenMockupProps {
  title: string;
  description: string;
  imageSource: ImageSourcePropType;
  backgroundColor: string;
  delay: number;
  index: number;
}

const WebScreenMockup: React.FC<WebScreenMockupProps> = ({
  title,
  description,
  imageSource,
  backgroundColor,
  delay,
  index,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const scale = useSharedValue(0.95);

  // Animate mockup entrance
  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [delay, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(1.05, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, animatedStyle, { backgroundColor }]}>
        <View style={styles.mockupHeader}>
          <View style={styles.statusBar}>
            <View style={styles.statusBarIndicator} />
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <Image source={imageSource} style={styles.image} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        <View style={styles.indicatorContainer}>
          <View style={[styles.indicator, index === 0 && styles.activeIndicator]} />
          <View style={[styles.indicator, index === 1 && styles.activeIndicator]} />
          <View style={[styles.indicator, index === 2 && styles.activeIndicator]} />
          <View style={[styles.indicator, index === 3 && styles.activeIndicator]} />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: 480,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    margin: 10,
  },
  mockupHeader: {
    height: 50,
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
  },
  statusBar: {
    width: 120,
    height: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBarIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    marginBottom: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 20,
    backgroundColor: '#304FFE',
  },
});

export default WebScreenMockup; 