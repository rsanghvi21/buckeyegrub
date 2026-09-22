import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '@/src/constants/theme';

export type BadgeVariant =
  | 'default'
  | 'scarlet'
  | 'gold'
  | 'outline'
  | 'success'
  | 'dietary'
  | 'high-protein'
  | 'highProtein'
  | 'vegan'
  | 'vegetarian'
  | 'halal'
  | 'gluten-free'
  | 'glutenFree'
  | 'dairy-free'
  | 'dairyFree'
  | 'swipe'
  | 'paymentSwipe'
  | 'dining-dollars'
  | 'paymentDiningDollars'
  | 'buckid-cash';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'scarlet':
        return {
          bg: colors.scarletWash,
          text: colors.scarlet,
          border: colors.scarlet,
        };
      case 'gold':
        return {
          bg: colors.goldLight,
          text: colors.goldDark,
          border: colors.gold,
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: colors.textPrimary,
          border: colors.grayBorder,
        };
      case 'success':
        return {
          bg: '#EBFBEE',
          text: '#2B8A3E',
          border: '#8CE99A',
        };
      case 'dietary':
      case 'high-protein':
      case 'highProtein':
        return colors.dietary.highProtein;
      case 'vegan':
        return colors.dietary.vegan;
      case 'vegetarian':
        return colors.dietary.vegetarian;
      case 'halal':
        return colors.dietary.halal;
      case 'gluten-free':
      case 'glutenFree':
        return colors.dietary.glutenFree;
      case 'dairy-free':
      case 'dairyFree':
        return colors.dietary.dairyFree;
      case 'swipe':
      case 'paymentSwipe':
        return colors.payment.swipe;
      case 'dining-dollars':
      case 'paymentDiningDollars':
        return colors.payment.diningDollars;
      case 'buckid-cash':
        return colors.payment.buckidCash;
      case 'default':
      default:
        return {
          bg: colors.grayWash,
          text: colors.textPrimary,
          border: colors.grayBorder,
        };
    }
  };

  const badgeColor = getBadgeColors();
  const sizeStyle = containerStyles[`size_${size}`];
  const textSizeStyle = textStyles[`text_${size}`];

  return (
    <View
      style={[
        containerStyles.base,
        sizeStyle,
        {
          backgroundColor: badgeColor.bg,
          borderColor: badgeColor.border,
        },
        style,
      ]}
    >
      {icon ? <View style={containerStyles.iconContainer}>{icon}</View> : null}
      <Text
        style={[
          textStyles.textBase,
          textSizeStyle,
          { color: badgeColor.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const containerStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  // Sizes
  size_sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
});

const textStyles = StyleSheet.create({
  textBase: {
    fontWeight: typography.weights.semiBold,
  },
  // Text sizes
  text_sm: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  text_md: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
});

export default Badge;
