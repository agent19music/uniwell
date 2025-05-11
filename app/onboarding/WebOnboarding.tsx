import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { onboardingSlides } from './slidesData';
import WebScreenMockup from './components/WebScreenMockup';
import WebCTAButton from './components/WebCTAButton';
import { useOnboarding } from './OnboardingContext';
import { isLargeScreen, isMediumScreen } from './utils';

const WebOnboarding: React.FC = () => {
  const { skipOnboarding } = useOnboarding();
  const { width } = useWindowDimensions();
  
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(-20);
  
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
  
  const renderMockups = () => {
    return (
      <View style={[
        styles.mockupsContainer,
        {
          flexDirection: isLargeScreen() ? 'row' : 'column',
          alignItems: isLargeScreen() ? 'center' : 'center',
          justifyContent: isLargeScreen() ? 'center' : 'flex-start',
        }
      ]}>
        {onboardingSlides.map((slide, index) => (
          <WebScreenMockup
            key={slide.id}
            title={slide.title}
            description={slide.description}
            imageSource={slide.imageSource}
            backgroundColor={slide.backgroundColor}
            delay={300 + index * 150}
            index={index}
          />
        ))}
      </View>
    );
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
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
            title="Sign Up"
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
            <View key={slide.id} style={styles.featureBlock}>
              <Animated.View
                style={[
                  styles.featureIcon,
                  { backgroundColor: slide.backgroundColor },
                ]}
              />
              <Text style={styles.featureTitle}>{slide.title}</Text>
              <Text style={styles.featureDescription}>{slide.description}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    marginTop: 80,
    marginBottom: 40,
    alignItems: 'center',
    maxWidth: 800,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#555',
    lineHeight: 26,
    maxWidth: 600,
  },
  mockupsContainer: {
    marginVertical: 40,
    flexWrap: 'wrap',
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 40,
    flexWrap: 'wrap',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1200,
    marginVertical: 40,
  },
  featureBlock: {
    width: 260,
    margin: 20,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  featureDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
  },
});

export default WebOnboarding; 