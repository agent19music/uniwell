import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { OnboardingSlide as OnboardingSlideType } from '../../../onboarding/types';
import Animated, { 
  Extrapolate, 
  interpolate, 
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

interface Props {
  item: OnboardingSlideType;
  index: number;
  scrollX: SharedValue<number>;
  onContinue?: (index: number) => void;
}

const OnboardingSlide: React.FC<Props> = ({ item, index, scrollX, onContinue }) => {
  const { width, height } = useWindowDimensions();
  const scale = useSharedValue(1);

  // Sample images based on the inspo design - same as WebScreenMockup
  const demoImages = [
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/caregiverillustration-removebg.png' },
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/communityillustration-removebg.png' },
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/selfcareillustration-removebg.png' },
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/productivityillustration-removebg.png' },
  ];

  // Sample content based on the inspo design - same as WebScreenMockup
  const demoContent = [
    {
      title: 'Professional Support',
      description: 'Book counseling appointments, browse mental health resources, and access crisis support when you need it most.',
    },
    {
      title: 'Join the Community',
      description: 'Connect with peers through discussion forums, group activities, and anonymous sharing in a supportive environment.'
    },
    {
      title: 'Self-Help Resources',
      description: 'Access personalized resources like podcasts, articles, and videos to support your mental health journey.'
    },
    {
      title: 'Boost Your Productivity',
      description: 'Stay on track with study timers, focus sessions, and goal tracking tools designed specifically for students.'
    }
  ];

  // Use the demo content based on index
  const currentTitle = demoContent[index]?.title || item.title;
  const currentDescription = demoContent[index]?.description || item.description;

  // Determine background color based on slide index
  const getBackgroundColor = () => {
    return index === 0 ? '#FF7F50' : '#171717';
  };

  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [{ scale: scale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20, 0, 20],
      Extrapolate.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(1.05, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return (
    <View style={[styles.slideWrapper, { width, height }]}>
      <View style={styles.container}>
        {/* Header with status text */}
        <View style={styles.header}>
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>{index + 1} of 4</Text>
            <Text style={styles.skipText}>Skip</Text>
          </View>
        </View>
        
        {/* Main content */}
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.illustrationContainer, animatedImageStyle]}>
          {/* Each slide uses its corresponding illustration. */}
          <Image
              source={demoImages[index]}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
          
          <Animated.View style={[styles.textContainer, animatedTextStyle]}>
            <Text style={styles.title}>{currentTitle}</Text>
            <Text style={styles.description}>{currentDescription}</Text>
          </Animated.View>
        </View>
        
        {/* Footer with indicators and buttons */}
        <View style={styles.footer}>
          <View style={styles.indicatorContainer}>
            <View style={[styles.indicator, index === 0 && styles.activeIndicator]} />
            <View style={[styles.indicator, index === 1 && styles.activeIndicator]} />
            <View style={[styles.indicator, index === 2 && styles.activeIndicator]} />
            <View style={[styles.indicator, index === 3 && styles.activeIndicator]} />
          </View>
          
          {index === 3 ? (
            <Pressable 
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.getStartedButton}
              onPress={() => onContinue?.(index)}
            >
              <Text style={styles.buttonText}>Let's Get Started</Text>
            </Pressable>
          ) : (
            <Pressable 
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.nextButton}
              onPress={() => onContinue?.(index)}
            >
              <Text style={styles.nextButtonText}>→</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slideWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#171717', // Dark background
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 10,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: 280,
    height: 280,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFFF',
    fontFamily: 'SF-Regular',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 24,
    fontFamily: 'SF-Regular',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 24,
    color: '#171717',
    fontWeight: '600',
  
  },
  getStartedButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#171717',
    fontWeight: '600',
  },
});

export default OnboardingSlide; 