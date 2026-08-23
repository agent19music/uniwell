import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { ChartPresentation } from './ChartPresentation';

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

const CHART_PADDING = 20;
const GRID_COUNT = 4;

export function GlowingMoodChart({
  data,
  width: propWidth,
  height = 200,
  accentColor,
  showDots = true,
  showArea = true,
  showGrid = true,
}: GlowingMoodChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const width = propWidth ?? Math.max(0, windowWidth - spacing.page * 2);
  const accent = accentColor ?? colors.accent;
  const filledData = useMemo(
    () => data.map((point, index) => ({ ...point, index })).filter((point) => point.value !== null),
    [data],
  );

  const chart = useMemo(() => {
    const chartWidth = width - CHART_PADDING * 2;
    const chartHeight = height - CHART_PADDING * 2;
    const values = filledData.map((point) => point.value as number);
    const maxValue = Math.max(1, ...values);
    const points = filledData.map((point) => ({
      ...point,
      x: CHART_PADDING + (point.index * chartWidth) / Math.max(1, data.length - 1),
      y: CHART_PADDING + chartHeight - ((point.value as number) / maxValue) * chartHeight,
    }));
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${height - CHART_PADDING} L ${points[0].x} ${height - CHART_PADDING} Z`
      : '';

    return { areaPath, linePath, maxValue, points };
  }, [data.length, filledData, height, width]);

  const summary = useMemo(() => {
    if (!filledData.length) return 'No mood entries are available for this period.';
    const values = filledData.map((point) => point.value as number);
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    return `${filledData.length} mood entries. Average score ${average.toFixed(1)}; range ${Math.min(...values)} to ${Math.max(...values)}.`;
  }, [filledData]);

  if (!filledData.length) {
    return (
      <ChartPresentation
        accessibilityLabel="Mood trend chart, no entries"
        emptyTitle="No mood data yet"
        emptyDescription="Log a mood to see your trend here."
        summary={summary}
        style={{ width, minHeight: height }}
      />
    );
  }

  return (
    <ChartPresentation accessibilityLabel={`Mood trend chart. ${summary}`} summary={summary} style={{ width }}>
      <View style={{ height }}>
        <Svg accessible={false} height={height} width={width}>
          {showGrid && Array.from({ length: GRID_COUNT + 1 }, (_, index) => {
            const y = CHART_PADDING + (index * (height - CHART_PADDING * 2)) / GRID_COUNT;
            return (
              <Line
                key={`grid-${index}`}
                x1={CHART_PADDING}
                x2={width - CHART_PADDING}
                y1={y}
                y2={y}
                stroke={colors.divider}
                strokeWidth={1}
              />
            );
          })}
          {showArea && <Path d={chart.areaPath} fill={accent} fillOpacity={0.12} />}
          <Path
            d={chart.linePath}
            fill="none"
            stroke={accent}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          {showDots && chart.points.map((point) => (
            <Circle
              key={`${point.label}-${point.index}`}
              cx={point.x}
              cy={point.y}
              fill={point.color ?? accent}
              r={3}
            />
          ))}
        </Svg>
      </View>
      <View style={styles.axis}>
        <SafeText variant="caption" color={colors.textMuted}>0</SafeText>
        <SafeText variant="caption" color={colors.textMuted}>{Math.round(chart.maxValue)}</SafeText>
      </View>
      <View style={styles.labels}>
        {data.map((point, index) => (
          <SafeText key={`${point.label}-${index}`} variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {point.label}
          </SafeText>
        ))}
      </View>
    </ChartPresentation>
  );
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.macro,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
