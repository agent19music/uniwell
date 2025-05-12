import React, { useCallback, useRef } from 'react';
import { StyleSheet, SafeAreaView, useWindowDimensions, StatusBar, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedRef,
} from 'react-native-reanimated';

import { onboardingSlides } from './slidesData';
import OnboardingSlide from './components/OnboardingSlide';
import { useOnboarding } from './OnboardingContext';

const MobileOnboarding: React.FC = () => {
  const { skipOnboarding } = useOnboarding();
  const { width, height } = useWindowDimensions();
  
  const scrollX = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.FlatList<any>>();
  
  // Handle scroll events and update scrollX shared value
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      
      // Calculate the current index based on the scroll position
      const newIndex = Math.round(event.contentOffset.x / width);
      if (newIndex !== flatListIndex.value) {
        flatListIndex.value = newIndex;
      }
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
  const handleContinue = useCallback((index: number) => {
    if (index < onboardingSlides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: index + 1,
        animated: true,
      });
    } else {
      skipOnboarding();
    }
  }, [skipOnboarding]);
  
  // Render each slide using the OnboardingSlide component
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <OnboardingSlide 
        item={item}
        index={index}
        scrollX={scrollX}
        onContinue={handleContinue}
      />
    ),
    [scrollX, handleContinue]
  );
  
  // Extract item keys
  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
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
        style={styles.flatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  flatList: {
    flex: 1,
  },
});

export default MobileOnboarding; 