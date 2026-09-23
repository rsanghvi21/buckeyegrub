/**
 * BuckeyeGrub Branded Toast Notification Component
 * Smooth floating toast with entering/exiting animations, OSU color accents, and icons.
 */

import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Award,
  AlertCircle,
  Info,
  X,
  Flame,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';

export type ToastType = 'success' | 'scarlet' | 'gold' | 'info' | 'warning';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'scarlet',
  onDismiss,
  durationMs = 3000,
}) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 250 });

      const timer = setTimeout(() => {
        handleDismiss();
      }, durationMs);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-120, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, message]);

  const handleDismiss = () => {
    translateY.value = withTiming(-120, { duration: 200 }, () => {
      // Finished transition
    });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(onDismiss, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) {
    return null;
  }

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color={theme.success} />;
      case 'gold':
        return <Award size={20} color={theme.goldDark} />;
      case 'warning':
        return <AlertCircle size={20} color={colors.warning} />;
      case 'info':
        return <Info size={20} color={colors.info} />;
      case 'scarlet':
      default:
        return <Flame size={20} color={theme.scarlet} />;
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'success':
        return theme.success;
      case 'gold':
        return theme.gold;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      case 'scarlet':
      default:
        return theme.scarlet;
    }
  };

  const topInset = Math.max(insets.top + 8, 48);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.toastWrapper,
        { top: topInset },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.toastContainer,
          {
            backgroundColor: isDark ? '#26262E' : '#FFFFFF',
            borderColor: theme.border,
            borderLeftColor: getAccentColor(),
          },
        ]}
      >
        <View style={styles.iconContainer}>{renderIcon()}</View>
        <Text
          style={[styles.messageText, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {message}
        </Text>
        <Pressable
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={theme.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  messageText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.sm,
  },
  closeButton: {
    marginLeft: spacing.sm,
    padding: 2,
  },
});

export default Toast;
