import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet, useWindowDimensions, ScrollView, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Footer from './components/Footer';

import { onboardingSlides } from './slidesData';
import WebScreenMockup from './components/WebScreenMockup';
import WebCTAButton from './components/WebCTAButton';
import { useOnboarding } from './OnboardingContext';
import { isLargeScreen, isMediumScreen } from './utils';

// Import needed icons from Expo vector icons
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Type for valid Material Community Icons
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface Position {
  rotate: string;
  translateX: number;
  translateY: number;
  zIndex: number;
  scale: number;
  opacity: number;
}

const WebOnboarding: React.FC = () => {
  const { skipOnboarding } = useOnboarding();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState<number>(0); // First mockup is active by default
  const [slides, setSlides] = useState(onboardingSlides || []);
  
  // Initialize slides if needed
  useEffect(() => {
    if (!slides || slides.length === 0) {
      console.warn('onboardingSlides is not available. Using fallback data.');
      setSlides([
        {
          id: 'fallback1',
          title: 'Boost Your Productivity',
          description: 'Stay on track with study timers, focus sessions, and goal tracking tools.',
          imageSource: { uri: 'https://placehold.co/600x400/orange/white?text=Productivity' },
          backgroundColor: '#E6F3FF',
          icon: 'check-circle-outline',
        },
        {
          id: 'fallback2',
          title: 'Professional Support',
          description: 'Book counseling appointments, browse mental health resources, and access crisis support.',
          imageSource: { uri: 'https://placehold.co/600x400/orange/white?text=Support' },
          backgroundColor: '#FFF1E6',
          icon: 'heart-pulse',
        },
        {
          id: 'fallback3',
          title: 'Join the Community',
          description: 'Connect with peers through discussion forums, group activities, and anonymous sharing.',
          imageSource: { uri: 'https://placehold.co/600x400/orange/white?text=Community' },
          backgroundColor: '#E6FFE9',
          icon: 'account-group-outline',
        }
      ]);
    }
  }, []);
  
  // Map Hugeicons icon names to MaterialCommunityIcons
  const getIconName = (iconName: string | undefined): IconName => {
    if (!iconName) return 'check-circle-outline';
    
    switch (iconName) {
      case 'TaskDone01Icon':
      case 'TaskDone01':
        return 'check-circle-outline';
      case 'HealtCareIcon':
      case 'HealtCare':
        return 'heart-pulse';
      case 'MessageMultiple01Icon':
      case 'MessageMultiple01':
        return 'message-text-outline';
      case 'BookOpen02Icon':
      case 'BookOpen02':
        return 'book-open-outline';
      default:
        return 'check-circle-outline';
    }
  };
  
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(-20);
  
  // Safely get slides for animation (with fallback to empty array)
  const safeSlidesForAnimation = slides && slides.length > 0 ? slides.slice(0, 4) : [];
  
  // Animated values for each mockup
  const mockupAnimValues = safeSlidesForAnimation.map(() => ({
    rotate: useSharedValue('0deg'),
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    zIndex: useSharedValue(1),
    scale: useSharedValue(1),
    opacity: useSharedValue(1),
  }));
  
  React.useEffect(() => {
    titleOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    titleTranslateY.value = withDelay(
      200,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    subtitleOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    subtitleTranslateY.value = withDelay(
      500,
      withTiming(0, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [titleOpacity, titleTranslateY, subtitleOpacity, subtitleTranslateY]);
  
  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    };
  });
  
  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateY.value }],
    };
  });

  // Function to handle advancing to the next mockup
  const handleNextMockup = () => {
    if (!safeSlidesForAnimation.length) return;
    const maxIndex = safeSlidesForAnimation.length - 1;
    const nextIndex = activeIndex >= maxIndex ? 0 : activeIndex + 1;
    animateMockupsToPositions(nextIndex);
    setActiveIndex(nextIndex);
  };

  // Function to handle selecting a specific mockup
  const handleSelectMockup = (index: number) => {
    if (!safeSlidesForAnimation.length) return;
    if (index !== activeIndex) {
      animateMockupsToPositions(index);
      setActiveIndex(index);
    }
  };

  // Enhanced getMockupPositions function for improved stacking and visibility
  const getMockupPositions = (activeIdx: number): Position[] => {
    const largeSpread = isLargeScreen() ? 220 : 160;
    const mediumSpread = isMediumScreen() ? 180 : 120;
    
    // Using a higher z-index value for active item to ensure it's always on top
    const ACTIVE_Z_INDEX = 10;
    const BEHIND_Z_INDEX = 3;
    const FAR_BEHIND_Z_INDEX = 2;
    const FARTHEST_Z_INDEX = 1;
    
    if (activeIdx === 0) {
      return [
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: ACTIVE_Z_INDEX, scale: 1, opacity: 1 },
        { rotate: '12deg', translateX: largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
        { rotate: '20deg', translateX: largeSpread * 1.6, translateY: 80, zIndex: FAR_BEHIND_Z_INDEX, scale: 0.75, opacity: 0.7 },
        { rotate: '28deg', translateX: largeSpread * 2.2, translateY: 120, zIndex: FARTHEST_Z_INDEX, scale: 0.65, opacity: 0.5 },
      ];
    } else if (activeIdx === 1) {
      return [
        { rotate: '-12deg', translateX: -largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: ACTIVE_Z_INDEX, scale: 1, opacity: 1 },
        { rotate: '12deg', translateX: largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
        { rotate: '20deg', translateX: largeSpread * 1.6, translateY: 80, zIndex: FAR_BEHIND_Z_INDEX, scale: 0.75, opacity: 0.7 },
      ];
    } else if (activeIdx === 2) {
      return [
        { rotate: '-20deg', translateX: -largeSpread * 1.6, translateY: 80, zIndex: FAR_BEHIND_Z_INDEX, scale: 0.75, opacity: 0.7 },
        { rotate: '-12deg', translateX: -largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: ACTIVE_Z_INDEX, scale: 1, opacity: 1 },
        { rotate: '12deg', translateX: largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
      ];
    } 
     if (activeIdx === 3) {
    return [
      { rotate: '-28deg', translateX: -largeSpread * 2.2, translateY: 120, zIndex: FARTHEST_Z_INDEX, scale: 0.65, opacity: 0.5 },
      { rotate: '-20deg', translateX: -largeSpread * 1.6, translateY: 80, zIndex: FAR_BEHIND_Z_INDEX, scale: 0.75, opacity: 0.7 },
      { rotate: '-12deg', translateX: -largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
      { rotate: '0deg', translateX: 0, translateY: 0, zIndex: ACTIVE_Z_INDEX, scale: 1, opacity: 1 },
    ];
  }
    else {
      return [
        { rotate: '-28deg', translateX: -largeSpread * 2.2, translateY: 120, zIndex: FARTHEST_Z_INDEX, scale: 0.65, opacity: 0.5 },
        { rotate: '-20deg', translateX: -largeSpread * 1.6, translateY: 80, zIndex: FAR_BEHIND_Z_INDEX, scale: 0.75, opacity: 0.7 },
        { rotate: '-12deg', translateX: -largeSpread, translateY: 40, zIndex: BEHIND_Z_INDEX, scale: 0.85, opacity: 0.9 },
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: ACTIVE_Z_INDEX, scale: 1, opacity: 1 },
      ];
    }
  };

  // Improved animation function with better timing and easing
  const animateMockupsToPositions = (newActiveIdx: number) => {
    if (!safeSlidesForAnimation.length || !mockupAnimValues.length) return;
    
    const newPositions = getMockupPositions(newActiveIdx);
    
    // First, lower the zIndex of the current active mockup to ensure
    // smooth animation and proper stacking order during transition
    mockupAnimValues[activeIndex].zIndex.value = 1;
    
    // Enhanced animation with staggered timings for smoother perception
    safeSlidesForAnimation.forEach((_, idx) => {
      if (idx >= mockupAnimValues.length) return;
      
      const { rotate, translateX, translateY, zIndex, scale, opacity } = newPositions[idx];
      
      // Calculate delay based on distance from active index for smoother cascade effect
      const delay = Math.abs(idx - newActiveIdx) * 50;
      
      // First update zIndex for proper stacking (immediate change, no animation)
      mockupAnimValues[idx].zIndex.value = zIndex;
      
      // Then animate other properties with custom spring-like easing
      mockupAnimValues[idx].rotate.value = withDelay(
        delay,
        withTiming(rotate, {
          duration: 650,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.1), // Slightly bouncy
        })
      );
      
      mockupAnimValues[idx].translateX.value = withDelay(
        delay,
        withTiming(translateX, {
          duration: 650,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Spring-like
        })
      );
      
      mockupAnimValues[idx].translateY.value = withDelay(
        delay,
        withTiming(translateY, {
          duration: 650,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Spring-like
        })
      );
      
      mockupAnimValues[idx].scale.value = withDelay(
        delay,
        withTiming(scale, {
          duration: 700,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.1), // Slightly bouncy
        })
      );
      
      mockupAnimValues[idx].opacity.value = withDelay(
        delay,
        withTiming(opacity, {
          duration: 450, // Faster opacity change for better perception
          easing: Easing.bezier(0.4, 0, 0.2, 1), // Standard material design easing
        })
      );
    });
  };
  
  // Initialize mockup positions on component mount with refined animation
  React.useEffect(() => {
    if (!safeSlidesForAnimation.length || !mockupAnimValues.length) return;
    
    const initialPositions = getMockupPositions(activeIndex);
    
    safeSlidesForAnimation.forEach((_, idx) => {
      if (idx >= mockupAnimValues.length) return;
      
      const { rotate, translateX, translateY, zIndex, scale, opacity } = initialPositions[idx];
      
      // Sequential animation for initial setup - feels more intentional
      const initialDelay = 300 + idx * 150;
      
      mockupAnimValues[idx].zIndex.value = zIndex;
      
      // Animate from slightly below their final position
      mockupAnimValues[idx].translateY.value = translateY + 30;
      mockupAnimValues[idx].opacity.value = 0;
      
      mockupAnimValues[idx].translateX.value = withDelay(
        initialDelay,
        withTiming(translateX, {
          duration: 800,
          easing: Easing.bezier(0.16, 1, 0.3, 1), // Ease out expo - nice for entrances
        })
      );
      
      mockupAnimValues[idx].translateY.value = withDelay(
        initialDelay,
        withTiming(translateY, {
          duration: 800,
          easing: Easing.bezier(0.16, 1, 0.3, 1), // Ease out expo
        })
      );
      
      mockupAnimValues[idx].rotate.value = withDelay(
        initialDelay,
        withTiming(rotate, { 
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
      
      mockupAnimValues[idx].scale.value = withDelay(
        initialDelay,
        withTiming(scale, {
          duration: 850,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Spring-like
        })
      );
      
      mockupAnimValues[idx].opacity.value = withDelay(
        initialDelay,
        withTiming(opacity, {
          duration: 600,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        })
      );
    });
  }, [width, safeSlidesForAnimation.length]);
  
  const renderMockups = () => {
    if (!safeSlidesForAnimation.length || !mockupAnimValues.length) {
      return <View style={styles.mockupsContainer} />;
    }
    
    return (
      <View style={styles.mockupsContainer}>
        {safeSlidesForAnimation.map((slide, index) => {
          if (index >= mockupAnimValues.length) return null;
          
          // Enhanced animated style for each mockup
          const mockupAnimatedStyle = useAnimatedStyle(() => {
            return {
              transform: [
                { translateX: mockupAnimValues[index].translateX.value },
                { translateY: mockupAnimValues[index].translateY.value },
                { rotate: mockupAnimValues[index].rotate.value },
                { scale: mockupAnimValues[index].scale.value },
              ],
              zIndex: mockupAnimValues[index].zIndex.value,
              opacity: mockupAnimValues[index].opacity.value,
            };
          });
          
          return (
            <Pressable 
              key={slide.id} 
              onPress={() => handleSelectMockup(index)}
              style={[
                styles.mockupPressable,
                // Enhanced hit area for better UX
                { zIndex: index === activeIndex ? 11 : 1 }
              ]}
            >
              <Animated.View
                style={[
                  styles.mockupWrapper,
                  mockupAnimatedStyle,
                  // Enhanced shadow for active item
                  index === activeIndex ? styles.activeMockupShadow : styles.inactiveMockupShadow
                ]}
              >
                <WebScreenMockup
                  title={slide.title}
                  description={slide.description}
                  imageSource={slide.imageSource}
                  backgroundColor={index === 0 ? '#ffa07a' : '#212121'}
                  delay={300 + index * 150}
                  index={index}
                  isActive={index === activeIndex}
                />
              </Animated.View>
            </Pressable>
          );
        })}
        
        {/* Improved next button with animation */}
        <Animated.View style={styles.nextButtonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.nextButton,
              pressed ? styles.nextButtonPressed : null
            ]} 
            onPress={handleNextMockup}
          >
            <Text style={styles.nextButtonText}>→</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };
  
  return (
    <View style={styles.background}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.logoHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/splash-removebg.png' }}
              style={{ width: 60, height: 60 }}
            />
           
            <Text style={styles.logoText}>UniWell</Text>
          </View>
        </View>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Animated.Text style={[styles.title, titleAnimatedStyle]}>
              Mental Wellness for Students
            </Animated.Text>
            <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
              Tools and resources to help students thrive academically and emotionally
            </Animated.Text>
          </View>
          
          {renderMockups()}
          
          <View style={styles.ctaContainer}>
            <WebCTAButton
              title="Get Started"
              onPress={skipOnboarding}
              icon="arrow-forward"
              primary={true}
              delay={1200}
            />
            <WebCTAButton
              title="Learn More"
              onPress={skipOnboarding}
              primary={false}
              delay={1400}
            />
          </View>
          
          <View style={styles.featuresContainer}>
            {(slides || []).map((slide, index) => (
              <View key={slide.id} style={styles.featureBlock}>
                <View style={[styles.featureIcon, { backgroundColor: index === 0 ? '#ffa07a' : '#212121' }]}>
                  <MaterialCommunityIcons
                    name={getIconName(slide.icon)}
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.featureTitle}>{slide.title}</Text>
                <Text style={styles.featureDescription}>{slide.description}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.footerWrapper}>
          <Footer />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  logoHeader: {
    position: 'absolute',
    top: 20,
    left: 40,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    fontFamily: 'SF-Regular',
  },
  logoTagline: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'SF-Regular',
    marginTop: 4,
  },
  background: {
    flex: 1,
    backgroundColor: '#fbeee3',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    marginTop: 120,
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 900,
    width: '100%',
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    marginBottom: 16,
    color: '#212121',
    letterSpacing: -1,
    fontFamily: 'SF-Regular',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#4A4A4A',
    lineHeight: 30,
    maxWidth: 700,
    width: '100%',
    fontWeight: '400',
    fontFamily: 'SF-Regular',
  },
  mockupsContainer: {
    height: 700,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    perspective: 1200, // Add perspective for a more 3D feel
  },
  mockupPressable: {
    position: 'absolute',
    cursor: 'pointer', // Better cursor feedback for web
  },
  mockupWrapper: {
    backfaceVisibility: 'hidden', // Prevent flickering during animation
  },
  // Enhanced shadows for better depth perception
  activeMockupShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  inactiveMockupShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 30,
    zIndex: 20, // Ensure button is always clickable
  },
  nextButton: {
    backgroundColor: '#212121',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 20,
    transform: [{ translateY: 0 }], // For animation in pressed state
    transition: 'transform 0.2s ease', // For smooth press animation
  },
  nextButtonPressed: {
    transform: [{ translateY: 3 }], // Move down slightly when pressed
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 48,
    flexWrap: 'wrap',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1200,
    marginVertical: 60,
    gap: 32,
  },
  featureBlock: {
    width: 300,
    padding: 20,
    alignItems: 'center',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#212121',
    fontFamily: 'SF-Regular',
  },
  featureDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4A4A4A',
    lineHeight: 24,
    fontFamily: 'SF-Regular',
  },
  footerWrapper: {
    marginTop: 40,
    marginHorizontal: 20,
    paddingBottom: 40,
  },
});

export default WebOnboarding;