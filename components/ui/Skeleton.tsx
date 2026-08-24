import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width, height = 16, radius: r = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: r, backgroundColor: colors.border }, animStyle, style]}
    />
  );
}

/** Pre-shaped skeleton for a flat post row (matches PostCard layout). */
export function PostRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 8,
        gap: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
      }}
    >
      {/* Avatar */}
      <Skeleton width={32} height={32} radius={16} />

      {/* Content column */}
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Skeleton width={100} height={12} />
          <Skeleton width={44} height={11} />
        </View>
        <Skeleton width="100%" height={13} />
        <Skeleton width="80%" height={13} />
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 4 }}>
          <Skeleton width={28} height={11} />
          <Skeleton width={28} height={11} />
        </View>
      </View>
    </View>
  );
}

/** Pre-shaped skeleton for a profile stats row (streak + habit counts). */
export function StatRowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Skeleton width="48%" height={80} radius={12} />
      <Skeleton width="48%" height={80} radius={12} />
    </View>
  );
}
