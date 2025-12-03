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
import { useTheme } from '../../hooks/useTheme';

interface SleepDataPoint {
  label: string;
  hours: number | null;
  quality?: number | null;
  goalAchieved?: boolean;
}

interface GlowingSleepChartProps {
  data: SleepDataPoint[];
  width?: number;
  height?: number;
  chartType?: 'duration' | 'quality';
  targetHours?: number;
  showDots?: boolean;
  showArea?: boolean;
  showGrid?: boolean;
  showTargetLine?: boolean;
}

// Sleep quality color scale
const getQualityColor = (quality: number) => {
  if (quality >= 8) return '#4CAF50'; // Excellent - green
  if (quality >= 6) return '#A8B896'; // Good - sage
  if (quality >= 4) return '#F4D03F'; // Fair - yellow
  return '#E89B8E'; // Poor - coral
};

const getSleepHoursColor = (hours: number, target: number) => {
  if (hours >= target) return '#4CAF50'; // Met goal - green
  if (hours >= target * 0.85) return '#A8B896'; // Close - sage
  if (hours >= target * 0.7) return '#F4D03F'; // Getting there - yellow
  return '#E89B8E'; // Needs improvement - coral
};

export function GlowingSleepChart({
  data,
  width: propWidth,
  height = 220,
  chartType = 'duration',
  targetHours = 8,
  showDots = true,
  showArea = true,
  showGrid = true,
  showTargetLine = true,
}: GlowingSleepChartProps) {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 64;

  // Theme-aware colors
  const chartColors = useMemo(() => ({
    background: isDark ? '#1A1A1A' : '#FFFFFF',
    card: isDark ? '#2A2A2A' : '#FFFFFF',
    grid: isDark ? '#3A3A3A' : '#E8DDD6',
    text: isDark ? '#C8BCB3' : '#9E9289',
    // Warm, muted tones that match UniWell aesthetic
    accent: chartType === 'duration' ? '#A8B896' : '#B8A3C8', // Sage for duration, lavender for quality
    accentGlow: chartType === 'duration' ? '#A8B896' : '#B8A3C8',
    target: '#6b8e5e',
  }), [isDark, chartType]);

  // Get value based on chart type
  const getValue = (d: SleepDataPoint) => {
    if (chartType === 'duration') return d.hours;
    return d.quality ?? null;
  };

  // Filter out null values and get valid data points
  const validData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      index: i,
      hasValue: getValue(d) !== null && getValue(d) !== undefined,
    }));
  }, [data, chartType]);

  const filledData = validData.filter(d => d.hasValue);

  // Calculate path
  const { linePath, areaPath, points, targetY } = useMemo(() => {
    if (filledData.length === 0) {
      return { linePath: '', areaPath: '', points: [], targetY: 0 };
    }

    const values = filledData.map(d => getValue(d) as number);
    const maxValue = chartType === 'duration' 
      ? Math.max(12, Math.max(...values) * 1.1) // Max 12 hours for sleep
      : 10; // Max 10 for quality
    const minValue = 0;
    const padding = { top: 30, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const stepX = chartWidth / (data.length - 1);

    const pts: { x: number; y: number; value: number; index: number; color: string }[] = [];

    filledData.forEach((d) => {
      const value = getValue(d) as number;
      const x = padding.left + d.index * stepX;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      const color = chartType === 'duration' 
        ? getSleepHoursColor(value, targetHours)
        : getQualityColor(value);
      
      pts.push({ x, y, value, index: d.index, color });
    });

    if (pts.length === 0) {
      return { linePath: '', areaPath: '', points: [], targetY: 0 };
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
    const areaD = `${pathD} L ${pts[pts.length - 1].x},${height - padding.bottom} L ${pts[0].x},${height - padding.bottom} Z`;

    // Calculate target line Y position
    const targetLineY = padding.top + chartHeight - (targetHours / maxValue) * chartHeight;

    return { linePath: pathD, areaPath: areaD, points: pts, targetY: targetLineY };
  }, [data, filledData, width, height, chartType, targetHours]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const padding = { top: 30, bottom: 20 };
    const numLines = 5;
    const stepY = (height - padding.top - padding.bottom) / numLines;

    for (let i = 0; i <= numLines; i++) {
      const y = padding.top + i * stepY;
      lines.push(y);
    }
    return lines;
  }, [height]);

  // Y-axis labels
  const yLabels = useMemo(() => {
    const maxValue = chartType === 'duration' ? 12 : 10;
    const labels = [];
    const numLabels = 5;
    
    for (let i = 0; i <= numLabels; i++) {
      const value = maxValue - (i * maxValue / numLabels);
      labels.push(chartType === 'duration' ? `${value.toFixed(0)}h` : `${value.toFixed(0)}`);
    }
    return labels;
  }, [chartType]);

  if (filledData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: chartColors.text }]}>
            No sleep data yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height: height + 32 }]}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Area Gradient */}
          <LinearGradient id="sleepAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={chartColors.accent} stopOpacity={0.5} />
            <Stop offset="40%" stopColor={chartColors.accent} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={chartColors.accent} stopOpacity={0} />
          </LinearGradient>

          {/* Target area gradient */}
          <LinearGradient id="targetGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={chartColors.target} stopOpacity={0} />
            <Stop offset="10%" stopColor={chartColors.target} stopOpacity={0.15} />
            <Stop offset="90%" stopColor={chartColors.target} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={chartColors.target} stopOpacity={0} />
          </LinearGradient>

          {/* Dot pattern for grid */}
          <Pattern id="sleepDotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1" fill={chartColors.grid} opacity={0.4} />
          </Pattern>
        </Defs>

        {/* Background dot grid */}
        {showGrid && (
          <Rect x="0" y="0" width={width} height={height} fill="url(#sleepDotGrid)" />
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
            strokeDasharray="5,5"
            opacity={0.25}
          />
        ))}

        {/* Target line - minimal dashed line */}
        {showTargetLine && chartType === 'duration' && (
          <Line
            x1={20}
            y1={targetY}
            x2={width - 20}
            y2={targetY}
            stroke={chartColors.target}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        )}

        {/* Area fill - the main glow effect */}
        {showArea && areaPath && (
          <Path
            d={areaPath}
            fill="url(#sleepAreaGradient)"
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
            fill={point.color}
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
              getValue(d) !== null && { 
                color: isDark ? '#FFFFFF' : colors.textPrimary, 
                fontWeight: '600' 
              }
            ]}
          >
            {d.label}
          </Text>
        ))}
      </View>

      {/* Target label */}
      {showTargetLine && chartType === 'duration' && (
        <View style={styles.targetLabel}>
          <View style={[styles.targetBadge, { backgroundColor: `${chartColors.target}20` }]}>
            <View style={[styles.targetDot, { backgroundColor: chartColors.target }]} />
            <Text style={[styles.targetText, { color: chartColors.target }]}>
              Goal: {targetHours}h
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
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
  targetLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Vercetti-Regular',
  },
});
