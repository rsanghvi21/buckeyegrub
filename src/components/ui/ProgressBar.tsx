import React, { useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/src/constants/theme';

export interface ProgressBarProps {
  label?: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
  trackColor?: string;
  height?: number;
  showValues?: boolean;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  current,
  target,
  unit = 'g',
  color = colors.scarlet,
  trackColor = colors.grayLight,
  height = 8,
  showValues = true,
  animated = true,
  style,
}) => {
  const validTarget = Math.max(target, 1);
  const progressRatio = Math.max(0, current / validTarget);
  const clampedRatio = Math.min(progressRatio, 1);
  const percentage = Math.round(progressRatio * 100);

  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progressAnim.value = withTiming(clampedRatio, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progressAnim.value = clampedRatio;
    }
  }, [clampedRatio, animated, progressAnim]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnim.value * 100}%`,
    };
  });

  return (
    <View style={[styles.container, style]}>
      {(label || showValues) && (
        <View style={styles.headerRow}>
          {label ? <Text style={styles.labelText}>{label}</Text> : null}
          {showValues ? (
            <Text style={styles.valuesText}>
              <Text style={styles.currentValue}>{current}{unit}</Text>
              <Text style={styles.targetValue}> / {target}{unit} ({percentage}%)</Text>
            </Text>
          ) : null}
        </View>
      )}

      {/* Track */}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: trackColor,
            borderRadius: radii.full,
          },
        ]}
      >
        {/* Fill */}
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              borderRadius: radii.full,
            },
            animatedBarStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.sm + 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  labelText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  valuesText: {
    fontSize: typography.sizes.xs,
  },
  currentValue: {
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  targetValue: {
    color: colors.textSecondary,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export default ProgressBar;
