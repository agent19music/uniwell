import React, { useState } from 'react';
import { Image,View, Text, StyleSheet, useWindowDimensions, ScrollView, Pressable } from 'react-native';
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

import { HugeiconsIcon } from '@hugeicons/react-native';

interface Position {
  rotate: string;
  translateX: number;
  translateY: number;
  zIndex: number;
  scale: number;
}

const WebOnboarding: React.FC = () => {
  const { skipOnboarding } = useOnboarding();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState<number>(1); // Middle mockup is active by default
  
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(-20);
  
  // Animated values for each mockup
  const mockupAnimValues = onboardingSlides.slice(0, 3).map(() => ({
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
    const nextIndex = (activeIndex + 1) % 3;
    animateMockupsToPositions(nextIndex);
    setActiveIndex(nextIndex);
  };

  // Function to handle selecting a specific mockup
  const handleSelectMockup = (index: number) => {
    if (index !== activeIndex) {
      animateMockupsToPositions(index);
      setActiveIndex(index);
    }
  };

  // Update the getMockupPositions function to handle 4 positions
  const getMockupPositions = (activeIdx: number): Position[] => {
    const largeSpread = isLargeScreen() ? 180 : 120;
    const mediumSpread = isMediumScreen() ? 140 : 80;
    
    if (activeIdx === 0) {
      return [
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: 3, scale: 1 },
        { rotate: '15deg', translateX: largeSpread, translateY: 60, zIndex: 2, scale: 0.85 },
        { rotate: '25deg', translateX: largeSpread * 1.8, translateY: 100, zIndex: 1, scale: 0.75 },
        { rotate: '35deg', translateX: largeSpread * 2.4, translateY: 140, zIndex: 0, scale: 0.65 },
      ];
    } else if (activeIdx === 1) {
      return [
        { rotate: '-15deg', translateX: -largeSpread, translateY: 60, zIndex: 2, scale: 0.85 },
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: 3, scale: 1 },
        { rotate: '15deg', translateX: largeSpread, translateY: 60, zIndex: 2, scale: 0.85 },
        { rotate: '25deg', translateX: largeSpread * 1.8, translateY: 100, zIndex: 1, scale: 0.75 },
      ];
    } else if (activeIdx === 2) {
      return [
        { rotate: '-25deg', translateX: -largeSpread * 1.8, translateY: 100, zIndex: 1, scale: 0.75 },
        { rotate: '-15deg', translateX: -largeSpread, translateY: 60, zIndex: 2, scale: 0.85 },
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: 3, scale: 1 },
        { rotate: '15deg', translateX: largeSpread, translateY: 60, zIndex: 2, scale: 0.85 },
      ];
    } else {
      return [
        { rotate: '-35deg', translateX: -largeSpread * 2.4, translateY: 140, zIndex: 0, scale: 0.65 },
        { rotate: '-25deg', translateX: -largeSpread * 1.8, translateY: 100, zIndex: 1, scale: 0.75 },
        { rotate: '-15deg', translateX: -largeSpread, translateY: 60, zIndex: 2, scale: 0.85 },
        { rotate: '0deg', translateX: 0, translateY: 0, zIndex: 3, scale: 1 },
      ];
    }
  };

  // Animate mockups to new positions based on active index
  const animateMockupsToPositions = (newActiveIdx: number) => {
    const newPositions = getMockupPositions(newActiveIdx);
    
    onboardingSlides.slice(0, 3).forEach((_, idx) => {
      const { rotate, translateX, translateY, zIndex, scale } = newPositions[idx];
      
      // First update the z-index for proper stacking
      mockupAnimValues[idx].zIndex.value = zIndex;
      
      // Then animate other properties
      mockupAnimValues[idx].rotate.value = withTiming(rotate, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      mockupAnimValues[idx].translateX.value = withTiming(translateX, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      mockupAnimValues[idx].translateY.value = withTiming(translateY, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      
      mockupAnimValues[idx].scale.value = withTiming(scale, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    });
  };
  
  // Initialize mockup positions on component mount
  React.useEffect(() => {
    const initialPositions = getMockupPositions(activeIndex);
    
    onboardingSlides.slice(0, 3).forEach((_, idx) => {
      const { rotate, translateX, translateY, zIndex, scale } = initialPositions[idx];
      
      mockupAnimValues[idx].rotate.value = rotate;
      mockupAnimValues[idx].translateX.value = translateX;
      mockupAnimValues[idx].translateY.value = translateY;
      mockupAnimValues[idx].zIndex.value = zIndex;
      mockupAnimValues[idx].scale.value = scale;
    });
  }, [width, activeIndex]); // Re-run when width or activeIndex changes
  
  const renderMockups = () => {
    return (
      <View style={styles.mockupsContainer}>
        {onboardingSlides.slice(0, 3).map((slide, index) => {
          // Create animated style for each mfockup
          const mockupAnimatedStyle = useAnimatedStyle(() => {
            return {
              transform: [
                { translateX: mockupAnimValues[index].translateX.value },
                { translateY: mockupAnimValues[index].translateY.value },
                { rotate: mockupAnimValues[index].rotate.value },
                { scale: mockupAnimValues[index].scale.value },
              ],
              zIndex: mockupAnimValues[index].zIndex.value,
            };
          });
          
          return (
            <Pressable 
              key={slide.id} 
              onPress={() => handleSelectMockup(index)}
              style={styles.mockupPressable}
            >
              <Animated.View
                style={[
                  styles.mockupWrapper,
                  mockupAnimatedStyle,
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
        
        {/* Next button now centered below mockups */}
        <Pressable 
          style={styles.nextButton} 
          onPress={handleNextMockup}
        >
          <Text style={styles.nextButtonText}>→</Text>
        </Pressable>
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
            {onboardingSlides.map((slide, index) => (
              console.log('slide icon', slide.icon),
              <View key={slide.id} style={styles.featureBlock}>
                <View style={[styles.featureIcon, { backgroundColor: index === 0 ? '#ffa07a' : '#212121' }]}>
                  {/* <HugeiconsIcon 
                    icon={slide.icon}
                    size={32}
                    color="#FFFFFF"
                    strookeWidth={1.5}
                  /> */}
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
    alignItems: 'center',},
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
    marginTop: 120, // Increased to account for logo
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center', // Added for better centering
    maxWidth: 900,
    width: '100%', // Added to ensure full width
    paddingHorizontal: 20,
    alignSelf: 'center', // Added to center the container itself
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%', // Added to ensure full width text alignment
    marginBottom: 16,
    color: '#212121',
    letterSpacing: -1,
    fontFamily: 'SF-Regular',
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#4A4A4A',
    lineHeight: 30,
    maxWidth: 700,
    width: '100%', // Added to ensure full width text alignment
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
  },
  mockupPressable: {
    position: 'absolute',
  },
  mockupWrapper: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 15,
  },
  nextButton: {
    position: 'absolute',
    bottom: 30,
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
    zIndex: 10,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
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