import React from 'react';
import { View, Image, Text, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
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
  isActive?: boolean;
}

const WebScreenMockup: React.FC<WebScreenMockupProps> = ({
  title,
  description,
  imageSource,
  backgroundColor,
  delay,
  index,
  isActive = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const scale = useSharedValue(0.95);

  // Sample images based on the inspo design
  const demoImages: ImageSourcePropType[] = [
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/caregiverillustration-removebg.png' },
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/communityillustration-removebg.png' },
    {uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/selfcareillustration-removebg.png' },
    { uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/productivityillustration-removebg.png' },

  ];

  // Sample content based on the inspo design
  interface DemoContent {
    title: string;
    description: string;
  }
  
  const demoContent: DemoContent[] = [
    {
      title: 'Proffessional Support',
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
  const currentTitle = demoContent[index]?.title || title;
  const currentDescription = demoContent[index]?.description || description;

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
      <Animated.View 
        style={[
          styles.container, 
          animatedStyle, 
          { backgroundColor }
        ]}
      >
        <View style={styles.mockupHeader}>
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>{index + 1} of 4</Text>
            <Text style={styles.skipText}>Skip</Text>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.illustrationContainer}>
            {/* Rendering the image similar to the inspo screenshot */}
            <Image 
              source={demoImages[index] || imageSource} 
              style={styles.image} 
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentTitle}</Text>
            <Text style={styles.description}>{currentDescription}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.indicatorContainer}>
            <View style={[styles.indicator, index === 0 && styles.activeIndicator]} />
            <View style={[styles.indicator, index === 1 && styles.activeIndicator]} />
            <View style={[styles.indicator, index === 2 && styles.activeIndicator]} />
            <View style={[styles.indicator, index === 3 && styles.activeIndicator]} />
          </View>
          
          {index === 3 && (
            <View style={styles.buttonContainer}>
              <View style={styles.getStartedButton}>
                <Text style={styles.buttonText}>Let's Get Started</Text>
              </View>
            </View>
          )}
          
          {index !== 3 && (
            <View style={styles.buttonContainer}>
              <View style={styles.nextButton}>
                <Text style={styles.nextButtonText}>→</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 580,
    borderRadius: 40,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  mockupHeader: {
    height: 60,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 20,
  },
  illustrationContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: 200,
    height: 200,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFFF',
    fontFamily: 'SF-Regular',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 20,
    fontFamily: 'SF-Regular',
  },
  footer: {
    height: 100,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
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
  buttonContainer: {
    paddingTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 20,
    color: '#212121',
    fontWeight: '600',
  },
  getStartedButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '600',
  },
});

export default WebScreenMockup;