import React, { useEffect } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography } from '@/src/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface MacroRingProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  unit?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  current,
  target,
  size = 140,
  strokeWidth = 12,
  color = colors.scarlet,
  trackColor = colors.grayLight,
  label = 'Calories',
  unit = 'kcal',
  showPercentage = false,
  children,
  style,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const validTarget = Math.max(target, 1);
  const rawProgress = Math.max(0, current / validTarget);
  const clampedProgress = Math.min(rawProgress, 1);
  const percentage = Math.round(rawProgress * 100);

  const isWeb = Platform.OS === 'web';

  // Animated progress value for native platforms
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (!isWeb) {
      progressAnim.value = withTiming(clampedProgress, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [clampedProgress, progressAnim, isWeb]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progressAnim.value);
    return {
      strokeDashoffset,
    };
  });

  const webStrokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          {/* Background Track Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Circle: Web uses CSS transition, Native uses Reanimated UI thread */}
          {isWeb ? (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={webStrokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          ) : (
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              animatedProps={animatedProps}
              strokeLinecap="round"
              fill="transparent"
            />
          )}
        </G>
      </Svg>

      {/* Center Content */}
      <View style={styles.contentOverlay}>
        {children ? (
          children
        ) : (
          <>
            <Text style={styles.valueText}>
              {current.toLocaleString()}
            </Text>
            <Text style={styles.unitText}>
              {showPercentage ? `${percentage}%` : `/ ${target.toLocaleString()} ${unit}`}
            </Text>
            {label ? <Text style={styles.labelText}>{label.toUpperCase()}</Text> : null}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  valueText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: typography.lineHeights.xxl,
    textAlign: 'center',
  },
  unitText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  labelText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.grayDark,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MacroRing;
