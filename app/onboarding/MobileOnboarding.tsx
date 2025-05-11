import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, useWindowDimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedRef,
} from 'react-native-reanimated';

import { onboardingSlides } from './slidesData';
import OnboardingSlide from './components/OnboardingSlide';
import Pagination from './components/Pagination';
import OnboardingButton from './components/OnboardingButton';
import SkipButton from './components/SkipButton';
import { useOnboarding } from './OnboardingContext';

const MobileOnboarding: React.FC = () => {
  const { skipOnboarding } = useOnboarding();
  const { width } = useWindowDimensions();
  
  const scrollX = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.FlatList<any>>();
  
  // Handle scroll events and update scrollX shared value
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  
  // Track the current slide index when scrolling
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      flatListIndex.value = viewableItems[0].index;
    }
  }, []);
  
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };
  
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);
  
  // Go to the next slide or complete onboarding
  const handleContinue = () => {
    if (flatListIndex.value < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: flatListIndex.value + 1,
        animated: true,
      });
    }
  };
  
  // Render each slide
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <OnboardingSlide item={item} index={index} scrollX={scrollX} />
    ),
    [scrollX]
  );
  
  // Extract item keys
  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      <SkipButton
        currentIndex={flatListIndex}
        dataLength={onboardingSlides.length}
        onSkip={skipOnboarding}
      />
      
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        decelerationRate="fast"
      />
      
      <View style={styles.bottomContainer}>
        <Pagination scrollX={scrollX} data={onboardingSlides} />
        
        <OnboardingButton
          currentIndex={flatListIndex}
          scrollX={scrollX}
          dataLength={onboardingSlides.length}
          onContinue={handleContinue}
          onGetStarted={skipOnboarding}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
});

export default MobileOnboarding; 