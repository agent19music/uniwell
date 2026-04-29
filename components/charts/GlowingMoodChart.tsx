import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
  Line,
  Rect,
  Pattern,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  withTiming,
  useSharedValue,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DataPoint {
  label: string;
  value: number | null;
  color?: string;
}

interface GlowingMoodChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  accentColor?: string;
  showDots?: boolean;
  showArea?: boolean;
  showGrid?: boolean;
}

// Mood colors for the chart
const MOOD_COLORS = {
  happy: '#F4D03F',
  calm: '#A8B896',
  stressed: '#F0D5D8',
  angry: '#E89B8E',
  sad: '#B8B3C8',
};

export function GlowingMoodChart({
  data,
  width: propWidth,
  height = 200,
  accentColor,
  showDots = true,
  showArea = true,
  showGrid = true,
}: GlowingMoodChartProps) {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 80;
  
  // Theme-aware colors
  const chartColors = useMemo(() => ({
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    card: isDark ? '#2A2A2A' : '#FFFFFF',
    grid: isDark ? '#3A3A3A' : '#E8DDD6',
    text: isDark ? '#C8BCB3' : '#9E9289',
    accent: accentColor || (isDark ? '#A8B896' : '#A8B896'), // Sage green
    accentGlow: accentColor || '#A8B896',
  }), [isDark, accentColor]);

  // Filter out null values and get valid data points
  const validData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      index: i,
      hasValue: d.value !== null && d.value !== undefined,
    }));
  }, [data]);

  const filledData = validData.filter(d => d.hasValue);

  // Calculate path
  const { linePath, areaPath, points } = useMemo(() => {
    if (filledData.length === 0) {
      return { linePath: '', areaPath: '', points: [] };
    }

    const maxValue = Math.max(...filledData.map(d => d.value as number)) * 1.2;
    const minValue = 0;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const stepX = chartWidth / (data.length - 1);

    const pts: { x: number; y: number; value: number; index: number; color?: string }[] = [];

    filledData.forEach((d) => {
      const x = padding + d.index * stepX;
      const y = padding + chartHeight - ((d.value as number) / maxValue) * chartHeight;
      pts.push({ x, y, value: d.value as number, index: d.index, color: d.color });
    });

    if (pts.length === 0) {
      return { linePath: '', areaPath: '', points: [] };
    }

    // Generate smooth bezier curve path
    let pathD = `M ${pts[0].x},${pts[0].y}`;
    
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      
      // Control points for smooth curve
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpy1 = prev.y;
      const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3;
      const cpy2 = curr.y;
      
      pathD += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${curr.x},${curr.y}`;
    }

    // Area path (close the path to bottom)
    const areaD = `${pathD} L ${pts[pts.length - 1].x},${height - padding} L ${pts[0].x},${height - padding} Z`;

    return { linePath: pathD, areaPath: areaD, points: pts };
  }, [data, filledData, width, height]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const padding = 20;
    const numLines = 5;
    const stepY = (height - padding * 2) / numLines;

    for (let i = 0; i <= numLines; i++) {
      const y = padding + i * stepY;
      lines.push(y);
    }
    return lines;
  }, [height]);

  if (filledData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: chartColors.text }]}>
            No mood data yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Area Gradient */}
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={chartColors.accent} stopOpacity={0.4} />
            <Stop offset="50%" stopColor={chartColors.accent} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={chartColors.accent} stopOpacity={0} />
          </LinearGradient>

          {/* Glow Gradient for stroke */}
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={chartColors.accent} stopOpacity={1} />
            <Stop offset="50%" stopColor={chartColors.accentGlow} stopOpacity={1} />
            <Stop offset="100%" stopColor={chartColors.accent} stopOpacity={1} />
          </LinearGradient>

          {/* Dot pattern for grid */}
          <Pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1" fill={chartColors.grid} opacity={0.5} />
          </Pattern>
        </Defs>

        {/* Background dot grid */}
        {showGrid && (
          <Rect x="0" y="0" width={width} height={height} fill="url(#dotGrid)" />
        )}

        {/* Horizontal grid lines */}
        {showGrid && gridLines.map((y, i) => (
          <Line
            key={`grid-${i}`}
            x1={20}
            y1={y}
            x2={width - 20}
            y2={y}
            stroke={chartColors.grid}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.3}
          />
        ))}

        {/* Area fill - the main glow effect going down */}
        {showArea && areaPath && (
          <Path
            d={areaPath}
            fill="url(#areaGradient)"
          />
        )}

        {/* Subtle line glow - very muted */}
        {linePath && (
          <Path
            d={linePath}
            fill="none"
            stroke={chartColors.accentGlow}
            strokeWidth={5}
            strokeOpacity={0.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Main line - slim */}
        {linePath && (
          <Path
            d={linePath}
            fill="none"
            stroke={chartColors.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Minimal data points - just small dots */}
        {showDots && points.map((point, i) => (
          <Circle
            key={`dot-${i}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={point.color || chartColors.accent}
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={[styles.labelsContainer, { width }]}>
        {data.map((d, i) => (
          <Text
            key={`label-${i}`}
            style={[
              styles.label,
              { color: chartColors.text },
              d.value !== null && { color: isDark ? '#FFFFFF' : colors.textPrimary, fontWeight: '600' }
            ]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Vercetti-Regular',
    textAlign: 'center',
  },
});
