import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs/lib/typescript/src/index';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

const FluidTabBar = ({ state, navigation, descriptors }: BottomTabBarProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withSpring(state.index * (width / state.routes.length), {
      damping: 80,
      stiffness: 400,
    });
  }, [state.index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newIndex = Math.round(event.translationX / (width / state.routes.length));
      if (newIndex >= 0 && newIndex < state.routes.length) {
        translateX.value = withTiming(newIndex * (width / state.routes.length), {
          duration: 150,
        });
      }
    })
    .onEnd((event) => {
      const newIndex = Math.round(event.translationX / (width / state.routes.length));
      if (newIndex >= 0 && newIndex < state.routes.length && newIndex !== state.index) {
        navigation.navigate(state.routes[newIndex].name);
      } else {
        translateX.value = withSpring(state.index * (width / state.routes.length), {
          damping: 20,
          stiffness: 180,
        });
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <Animated.View
          style={[
            styles.animatedContainer,
            animatedStyle,
            { backgroundColor: isDark ? '#FF7F50' : '#FF7F50' },
          ]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.tabBarLabel ?? options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isDark ? '#FFFFFF' : '#666666',
            size: isFocused ? 24 : 20,
          });

          return (
            <View
              key={route.key}
              style={styles.tabItem}
              onTouchEnd={onPress}
            >
              {icon}
              {/* {isFocused && (
                <Text style={[
                  styles.label,
                  { 
                    color: isDark ? '#FFFFFF' : '#666666',
                    fontFamily: 'SF-Regular',
                  }
                ]}>
                  {typeof label === 'string' ? label : ''}
                </Text>
              )} */}
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    position: 'relative',
  },
  animatedContainer: {
    position: 'absolute',
    width: width / 5,
    height: '100%',
    borderRadius: 30,
    opacity: 0.2,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 

export default FluidTabBar;
