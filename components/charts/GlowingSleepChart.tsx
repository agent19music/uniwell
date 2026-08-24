import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { SafeText } from '@/components/ThemedText';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { ChartPresentation } from './ChartPresentation';

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

const CHART_PADDING = 20;
const GRID_COUNT = 4;

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
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const width = propWidth ?? Math.max(0, windowWidth - spacing.page * 2);
  const valueFor = (point: SleepDataPoint) => chartType === 'duration' ? point.hours : point.quality ?? null;
  const filledData = useMemo(
    () => data.map((point, index) => ({ ...point, index, value: valueFor(point) })).filter((point) => point.value !== null),
    [data, chartType],
  );

  const chart = useMemo(() => {
    const chartWidth = width - CHART_PADDING * 2;
    const chartHeight = height - CHART_PADDING * 2;
    const values = filledData.map((point) => point.value as number);
    const maxValue = chartType === 'duration' ? Math.max(12, ...values) : 10;
    const points = filledData.map((point) => ({
      ...point,
      x: CHART_PADDING + (point.index * chartWidth) / Math.max(1, data.length - 1),
      y: CHART_PADDING + chartHeight - ((point.value as number) / maxValue) * chartHeight,
    }));
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${height - CHART_PADDING} L ${points[0].x} ${height - CHART_PADDING} Z`
      : '';
    const targetY = CHART_PADDING + chartHeight - (targetHours / maxValue) * chartHeight;
    return { areaPath, linePath, maxValue, points, targetY };
  }, [chartType, data.length, filledData, height, targetHours, width]);

  const summary = useMemo(() => {
    if (!filledData.length) return `No ${chartType === 'duration' ? 'sleep duration' : 'sleep quality'} entries are available for this period.`;
    const values = filledData.map((point) => point.value as number);
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    const unit = chartType === 'duration' ? ' hours' : ' out of 10';
    const targetSummary = chartType === 'duration' ? ` Target ${targetHours} hours.` : '';
    return `${filledData.length} entries. Average ${average.toFixed(1)}${unit}; range ${Math.min(...values).toFixed(1)} to ${Math.max(...values).toFixed(1)}.${targetSummary}`;
  }, [chartType, filledData, targetHours]);

  const pointColor = (value: number) => {
    if (chartType === 'duration') return value >= targetHours ? colors.success : colors.accent;
    if (value >= 8) return colors.success;
    if (value >= 5) return colors.accent;
    return colors.danger;
  };

  if (!filledData.length) {
    return (
      <ChartPresentation
        accessibilityLabel={`Sleep ${chartType} chart, no entries`}
        emptyTitle="No sleep data yet"
        emptyDescription="Track a night's sleep to see your trend here."
        summary={summary}
        style={{ width, minHeight: height }}
      />
    );
  }

  const seriesColor = chartType === 'duration' ? colors.accent : colors.link;

  return (
    <ChartPresentation accessibilityLabel={`Sleep ${chartType} chart. ${summary}`} summary={summary} style={{ width }}>
      <View style={{ height }}>
        <Svg accessible={false} height={height} width={width}>
          {showGrid && Array.from({ length: GRID_COUNT + 1 }, (_, index) => {
            const y = CHART_PADDING + (index * (height - CHART_PADDING * 2)) / GRID_COUNT;
            return <Line key={`grid-${index}`} x1={CHART_PADDING} x2={width - CHART_PADDING} y1={y} y2={y} stroke={colors.divider} strokeWidth={1} />;
          })}
          {showTargetLine && chartType === 'duration' && (
            <Line
              x1={CHART_PADDING}
              x2={width - CHART_PADDING}
              y1={chart.targetY}
              y2={chart.targetY}
              stroke={colors.borderStrong}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
          {showArea && <Path d={chart.areaPath} fill={seriesColor} fillOpacity={0.12} />}
          <Path d={chart.linePath} fill="none" stroke={seriesColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          {showDots && chart.points.map((point) => (
            <Circle key={`${point.label}-${point.index}`} cx={point.x} cy={point.y} fill={pointColor(point.value as number)} r={3} />
          ))}
        </Svg>
      </View>
      <View style={styles.axis}>
        <SafeText variant="caption" color={colors.textMuted}>0</SafeText>
        <SafeText variant="caption" color={colors.textMuted}>
          {chartType === 'duration' ? `${chart.maxValue}h` : chart.maxValue}
        </SafeText>
      </View>
      <View style={styles.labels}>
        {data.map((point, index) => (
          <SafeText key={`${point.label}-${index}`} variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {point.label}
          </SafeText>
        ))}
      </View>
      {showTargetLine && chartType === 'duration' && (
        <SafeText variant="caption" color={colors.textSecondary} style={styles.target}>
          Dashed line: {targetHours}h target
        </SafeText>
      )}
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
  target: {
    textAlign: 'center',
  },
});
