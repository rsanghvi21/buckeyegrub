import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '@/src/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isInteractive = !disabled && !loading;

  // Base and variant styles
  const buttonVariantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[`size_${size}`];

  const getTextColor = (): string => {
    if (disabled) return colors.grayMuted;
    switch (variant) {
      case 'primary':
        return colors.textInverse;
      case 'secondary':
        return colors.textPrimary;
      case 'outline':
      case 'ghost':
      case 'icon':
        return colors.scarlet;
      default:
        return colors.textInverse;
    }
  };

  const textColor = getTextColor();

  return (
    <AnimatedPressable
      onPress={isInteractive ? onPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      style={[
        baseStyles.base,
        buttonVariantStyle,
        sizeStyle,
        fullWidth && baseStyles.fullWidth,
        disabled && baseStyles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={baseStyles.contentRow}>
          {leftIcon ? <View style={baseStyles.leftIconContainer}>{leftIcon}</View> : null}
          {title ? (
            <Text
              style={[
                textStyles.textBase,
                textStyles[`text_${size}`],
                { color: textColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
          {children}
          {rightIcon ? <View style={baseStyles.rightIconContainer}>{rightIcon}</View> : null}
        </View>
      )}
    </AnimatedPressable>
  );
};

const baseStyles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: colors.grayLight,
    borderColor: colors.grayBorder,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.scarlet,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.grayLight,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.scarlet,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  icon: {
    backgroundColor: colors.scarletWash,
    borderWidth: 0,
    aspectRatio: 1,
    paddingHorizontal: 0,
  },
});

const sizeStyles = StyleSheet.create({
  size_sm: {
    height: 36,
    paddingHorizontal: spacing.sm + 4,
  },
  size_md: {
    height: 46,
    paddingHorizontal: spacing.md + 2,
  },
  size_lg: {
    height: 54,
    paddingHorizontal: spacing.lg,
  },
});

const textStyles = StyleSheet.create({
  textBase: {
    fontWeight: typography.weights.semiBold,
    textAlign: 'center',
  },
  text_sm: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
  text_md: {
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
  },
  text_lg: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
  },
});

export default Button;
