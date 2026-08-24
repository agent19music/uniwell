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

/** Pre-shaped skeleton for a flat post row — pixel-exact match to PostCard. */
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
      {/* Avatar — 32×32 circle, marginTop:2 matches PostCard */}
      <Skeleton width={32} height={32} radius={9999} style={{ marginTop: 2, flexShrink: 0 }} />

      {/* Content column — gap:3 matches PostCard */}
      <View style={{ flex: 1, gap: 3 }}>

        {/* Author row: username · timestamp · menu dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 }}>
          <Skeleton width={90} height={14} radius={4} />
          <Skeleton width={36} height={13} radius={4} />
          <View style={{ marginLeft: 'auto' }}>
            <Skeleton width={16} height={16} radius={4} />
          </View>
        </View>

        {/* Body — 3 lines at fontSize:15 */}
        <Skeleton width="100%" height={15} radius={4} />
        <Skeleton width="80%" height={15} radius={4} />
        <Skeleton width="55%" height={15} radius={4} />

        {/* Actions — 3 icon stubs at 16×16, gap:20, marginTop:6 */}
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 6 }}>
          <Skeleton width={16} height={16} radius={9999} />
          <Skeleton width={16} height={16} radius={9999} />
          <Skeleton width={16} height={16} radius={9999} />
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
