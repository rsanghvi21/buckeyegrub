/**
 * BuckeyeGrub Reusable Modal Header Component
 * Provides standard title, optional left icon, and right-aligned dismiss button
 * with safe-area padding and theme integration.
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
import { X } from 'lucide-react-native';
import { radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context/ThemeContext';
import { hapticLight } from '@/src/utils/haptics';

export interface ModalHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  icon,
  onClose,
  accessibilityLabel = 'Close modal',
  style,
}) => {
  const { theme } = useTheme();

  const handleClose = async () => {
    await hapticLight();
    onClose();
  };

  return (
    <View style={[styles.headerBar, { borderBottomColor: theme.border }, style]}>
      <View style={styles.headerTitleRow}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Pressable
        onPress={handleClose}
        style={styles.closeBtn}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: radii.sm,
  },
});

export default ModalHeader;
