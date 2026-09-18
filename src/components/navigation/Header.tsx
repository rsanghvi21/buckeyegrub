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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '@/src/constants/theme';
import { BuckeyeLeaf } from './BuckeyeLeaf';

export type HeaderVariant = 'surface' | 'scarlet' | 'transparent';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBuckeyeLeaf?: boolean;
  rightAction?: React.ReactNode;
  variant?: HeaderVariant;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'BuckeyeGrub',
  subtitle,
  showBack = false,
  onBack,
  showBuckeyeLeaf = true,
  rightAction,
  variant = 'surface',
  style,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const isScarlet = variant === 'scarlet';
  const isTransparent = variant === 'transparent';

  // Dynamic safe area inset padding
  const topPadding = Math.max(insets.top, spacing.xs);

  const containerStyle = [
    styles.container,
    { paddingTop: topPadding },
    isScarlet ? styles.scarletContainer : isTransparent ? styles.transparentContainer : styles.surfaceContainer,
    style,
  ];

  const titleColor = isScarlet ? colors.textInverse : colors.textPrimary;
  const subtitleColor = isScarlet ? colors.white85 : colors.textSecondary;
  const iconColor = isScarlet ? colors.textInverse : colors.textPrimary;

  // Extracted leaf color logic
  const leafColor = isScarlet ? colors.textInverse : colors.scarlet;
  const leafStemColor = isScarlet ? colors.white60 : colors.grayDark;

  return (
    <View style={containerStyle}>
      <View style={styles.headerContent}>
        {/* Left Section: Back Button or Buckeye Leaf */}
        <View style={styles.leftSection}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color={iconColor} />
            </Pressable>
          ) : showBuckeyeLeaf ? (
            <View style={styles.leafWrapper}>
              <BuckeyeLeaf
                size={30}
                color={leafColor}
                stemColor={leafStemColor}
              />
            </View>
          ) : null}
        </View>

        {/* Center Section: Title & Subtitle */}
        <View style={styles.centerSection}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: subtitleColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right Section: Action Slot or Buckeye Leaf if Back was shown */}
        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : showBack && showBuckeyeLeaf ? (
            <BuckeyeLeaf
              size={24}
              color={leafColor}
              stemColor={leafStemColor}
            />
          ) : (
            <View style={styles.rightPlaceholder} />
          )}
        </View>
      </View>

      {/* Decorative OSU Scarlet Accent Line (Surface variant only) */}
      {variant === 'surface' ? <View style={styles.scarletAccentLine} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  surfaceContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBorder,
    ...shadows.sm,
  },
  scarletContainer: {
    backgroundColor: colors.scarlet,
    ...shadows.md,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 4,
    minHeight: 48,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-start',
  },
  backButton: {
    padding: spacing.xs,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafWrapper: {
    paddingRight: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.lg,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  rightPlaceholder: {
    width: 24,
  },
  scarletAccentLine: {
    height: 2,
    backgroundColor: colors.scarlet,
    width: '100%',
  },
});

export default Header;
