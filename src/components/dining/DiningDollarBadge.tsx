/**
 * BuckeyeGrub BuckID Dining Dollar 35% Discount Calculator Badge
 * Interactive badge displayed on retail venues and menu items.
 * Shows the 35% discount and launches the interactive Discount Calculator sheet on tap.
 */

import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { hapticSelection } from '@/src/utils/haptics';

export interface DiningDollarBadgeProps {
  venueId?: string;
  itemPrice?: number;
  label?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  onPressCustom?: () => void;
}

export const DiningDollarBadge: React.FC<DiningDollarBadgeProps> = ({
  venueId,
  itemPrice,
  label = '35% Off Dining $',
  size = 'sm',
  style,
  onPressCustom,
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handlePress = async () => {
    await hapticSelection();
    if (onPressCustom) {
      onPressCustom();
    } else {
      router.push({
        pathname: '/modal/discount-calculator' as any,
        params: {
          venueId: venueId || '',
          price: itemPrice !== undefined ? String(itemPrice) : '',
        },
      } as any);
    }
  };

  const isSmall = size === 'sm';

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open 35 percent dining dollar discount calculator. ${label}`}
      style={({ pressed }) => [
        styles.badgeBase,
        isSmall ? styles.sizeSm : styles.sizeMd,
        {
          backgroundColor: colors.payment.diningDollars.bg,
          borderColor: colors.payment.diningDollars.border,
        },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <View style={styles.iconContainer}>
        <Calculator size={isSmall ? 12 : 14} color={theme.success} />
      </View>
      <Text
        style={[
          styles.badgeText,
          isSmall ? styles.textSm : styles.textMd,
          { color: theme.success },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sizeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  iconContainer: {
    marginRight: 4,
  },
  badgeText: {
    fontWeight: typography.weights.bold,
  },
  textSm: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
  },
  textMd: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
  },
});

export default DiningDollarBadge;
