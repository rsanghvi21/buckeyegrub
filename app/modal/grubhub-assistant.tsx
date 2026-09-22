/**
 * BuckeyeGrub – Grubhub Order Assistant Modal (Checkpoint 6)
 * Displays a venue's order details (info, hours), the meal items + customization
 * recipe, a macro summary, and two actions: Copy Customization (clipboard + haptic) and
 * Open Grubhub to Order (deep-link with web fallback).
 *
 * Route params:
 *   - venueId (required): a DiningVenue id.
 *   - slot (optional): a MealSlotType; when present the modal shows that slot from
 *     the active meal plan (filtered to venue items), otherwise it falls back to
 *     the venue's catalog items.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Clipboard as ClipboardIcon,
  Clock,
  ExternalLink,
  MapPin,
  X,
} from 'lucide-react-native';

import { Badge, Button, Card } from '@/src/components/ui';
import { getThemeColors, radii, spacing, typography } from '@/src/constants/theme';
import {
  OSU_MENU_ITEMS_BY_VENUE,
  OSU_VENUES_MAP,
} from '@/src/data';
import { useMealPlanStore } from '@/src/store';
import {
  generateGrubhubCustomizationCopy,
  generateItemCustomizationCopy,
} from '@/src/services/ai/grubhubAssistant';
import { openVenueOrder } from '@/src/services/grubhub/deepLinkService';
import { DayOfWeek, MenuItem } from '@/src/types/dining';
import {
  MealSlot,
  MealSlotType,
  PlannedMealItem,
  calculatePlannedItemsTotals,
} from '@/src/types/mealPlan';

const DAY_KEYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const VALID_SLOTS: MealSlotType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const EMPTY_BUTTON_MIN_WIDTH = 160;
const CLOSE_ICON_SIZE = 18;
const ACTION_ICON_SIZE = 16;

/** Formats a 24h "HH:mm" string into a friendly 12h label (e.g., "7:00 AM"). */
function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${mStr.padStart(2, '0')} ${period}`;
}

/** Wraps a catalog MenuItem into a PlannedMealItem shape (1x, not logged). */
function toPlannedItem(item: MenuItem, index: number): PlannedMealItem {
  return {
    id: `catalog_${item.id}_${index}`,
    menuItem: item,
    servingMultiplier: 1,
    isLogged: false,
  };
}

export default function GrubhubAssistantModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ venueId?: string; slot?: string }>();
  const activePlan = useMealPlanStore((s) => s.activePlan);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = useMemo(() => getThemeColors(isDark), [isDark]);
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const venueId = typeof params.venueId === 'string' ? params.venueId : undefined;
  const slot: MealSlotType | undefined =
    typeof params.slot === 'string' && (VALID_SLOTS as string[]).includes(params.slot)
      ? (params.slot as MealSlotType)
      : undefined;

  const venue = venueId ? OSU_VENUES_MAP[venueId] : undefined;

  // Resolve the list of planned items: prefer the active plan slot (filtered to
  // only items for this venue to prevent cross-venue pollution), else fall
  // back to the venue's catalog items (first 4 for a concise recommendation).
  const displaySlot: MealSlot | null = useMemo(() => {
    if (!venue) return null;

    if (slot && activePlan.meals[slot] && activePlan.meals[slot].items.length > 0) {
      const venueItems = activePlan.meals[slot].items.filter(
        (entry) => entry.menuItem.venueId === venue.id
      );
      if (venueItems.length > 0) {
        return {
          ...activePlan.meals[slot],
          items: venueItems,
        };
      }
    }

    const catalogItems = (OSU_MENU_ITEMS_BY_VENUE[venue.id] ?? []).slice(0, 4);
    if (catalogItems.length === 0) return null;

    return {
      slot: slot ?? 'lunch',
      label: slot
        ? slot.charAt(0).toUpperCase() + slot.slice(1)
        : 'Recommended Items',
      items: catalogItems.map(toPlannedItem),
      isLogged: false,
    };
  }, [venue, slot, activePlan]);

  // Macro totals across the display items using centralized domain helper.
  const totals = useMemo(() => {
    if (!displaySlot) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const { calories, macros } = calculatePlannedItemsTotals(displaySlot.items);
    return {
      calories: Math.round(calories),
      protein: Math.round(macros.protein * 10) / 10,
      carbs: Math.round(macros.carbs * 10) / 10,
      fat: Math.round(macros.fat * 10) / 10,
    };
  }, [displaySlot]);

  // Today's operating hours for the venue.
  const todayHours = useMemo(() => {
    if (!venue) return null;
    const dayKey = DAY_KEYS[new Date().getDay()];
    const hours = venue.operatingHours[dayKey];
    if (!hours || hours.isClosed) {
      return { label: DAY_LABELS[dayKey], text: 'Closed today' };
    }
    return {
      label: DAY_LABELS[dayKey],
      text: `${formatTime(hours.open)} – ${formatTime(hours.close)}`,
    };
  }, [venue]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleCopy = async () => {
    if (!displaySlot || !venue) return;
    const copyText = generateGrubhubCustomizationCopy(displaySlot, venue.name);
    try {
      await Clipboard.setStringAsync(copyText);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics safe fallback for environments without vibration hardware
      }
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copy failed', 'Could not copy to clipboard. Please try again.');
    }
  };

  const handleOpenGrubhub = async () => {
    if (!venue) return;
    const result = await openVenueOrder(venue);
    if (!result.opened) {
      Alert.alert(
        'Unable to open Grubhub',
        result.error ?? 'Grubhub could not be opened right now.'
      );
    }
  };

  // Empty / invalid state guard.
  if (!venue || !displaySlot) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Stack.Screen options={{ title: 'Order Assistant' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Order details unavailable</Text>
          <Text style={styles.emptyBody}>
            {venueId
              ? 'We could not find menu items for this venue.'
              : 'No venue was provided for the Order Assistant.'}
          </Text>
          <Button
            title="Close"
            variant="primary"
            size="md"
            leftIcon={<X size={ACTION_ICON_SIZE} color={themeColors.textInverse} />}
            onPress={handleClose}
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Grubhub Order Assistant' }} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.slotLabel}>{displaySlot.label}</Text>
        </View>
        <Button
          variant="icon"
          size="sm"
          onPress={handleClose}
          accessibilityLabel="Close order assistant"
        >
          <X size={CLOSE_ICON_SIZE} color={themeColors.scarlet} />
        </Button>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Venue info */}
        <Card variant="filled" padding="md" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MapPin size={ACTION_ICON_SIZE} color={themeColors.scarlet} />
            <Text style={styles.infoText}>{venue.address}</Text>
          </View>
          {todayHours ? (
            <View style={styles.infoRow}>
              <Clock size={ACTION_ICON_SIZE} color={themeColors.scarlet} />
              <Text style={styles.infoText}>
                {todayHours.label}: {todayHours.text}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Macro summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Nutrition</Text>
        </View>
        <Card variant="elevated" padding="md" style={styles.macroCard}>
          <View style={styles.macroRow}>
            <MacroStat
              label="Calories"
              value={`${totals.calories}`}
              unit="kcal"
              color={themeColors.macros.calories}
              styles={styles}
            />
            <MacroStat
              label="Protein"
              value={`${totals.protein}`}
              unit="g"
              color={themeColors.macros.protein}
              styles={styles}
            />
            <MacroStat
              label="Carbs"
              value={`${totals.carbs}`}
              unit="g"
              color={themeColors.macros.carbs}
              styles={styles}
            />
            <MacroStat
              label="Fat"
              value={`${totals.fat}`}
              unit="g"
              color={themeColors.macros.fat}
              styles={styles}
            />
          </View>
        </Card>

        {/* Items + customization recipe */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items & Customization</Text>
          <Text style={styles.sectionSubtitle}>
            Show this to Grubhub, or paste the copied notes into special instructions.
          </Text>
        </View>

        {displaySlot.items.map((entry) => (
          <Card
            key={entry.id}
            variant="outlined"
            padding="md"
            style={styles.itemCard}
          >
            <Text style={styles.itemName}>{entry.menuItem.name}</Text>
            {entry.menuItem.customizationRecipe ? (
              <Text style={styles.itemRecipe}>{entry.menuItem.customizationRecipe}</Text>
            ) : null}
            <Text style={styles.itemMeta}>{generateItemCustomizationCopy(entry)}</Text>
            {entry.menuItem.dietaryTags.length > 0 ? (
              <View style={styles.badgeRow}>
                {entry.menuItem.dietaryTags.includes('highProtein') ? (
                  <Badge label="High-Protein" variant="high-protein" size="sm" />
                ) : null}
                {entry.menuItem.dietaryTags.includes('vegan') ? (
                  <Badge label="Vegan" variant="vegan" size="sm" />
                ) : null}
                {entry.menuItem.dietaryTags.includes('glutenFree') ? (
                  <Badge label="Gluten-Free" variant="gluten-free" size="sm" />
                ) : null}
                {entry.menuItem.dietaryTags.includes('halal') ? (
                  <Badge label="Halal" variant="halal" size="sm" />
                ) : null}
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Button
          title={copied ? 'Copied!' : 'Copy Customization'}
          variant={copied ? 'secondary' : 'outline'}
          size="md"
          leftIcon={
            copied ? (
              <Check size={ACTION_ICON_SIZE} color={themeColors.success} />
            ) : (
              <ClipboardIcon size={ACTION_ICON_SIZE} color={themeColors.scarlet} />
            )
          }
          onPress={handleCopy}
          style={styles.actionButton}
        />
        <Button
          title="Open Grubhub to Order"
          variant="primary"
          size="md"
          leftIcon={<ExternalLink size={ACTION_ICON_SIZE} color={themeColors.textInverse} />}
          onPress={handleOpenGrubhub}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
}

interface MacroStatProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
}

const MacroStat: React.FC<MacroStatProps> = ({ label, value, unit, color, styles }) => (
  <View style={styles.macroStat}>
    <Text style={[styles.macroValue, { color }]}>{value}</Text>
    <Text style={styles.macroUnit}>{unit}</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const createStyles = (c: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerText: {
      flex: 1,
      marginRight: spacing.sm,
    },
    venueName: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: c.textPrimary,
    },
    slotLabel: {
      fontSize: typography.sizes.sm,
      color: c.scarlet,
      fontWeight: typography.weights.semiBold,
      marginTop: spacing.xs / 2,
    },
    infoCard: {
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    infoText: {
      flex: 1,
      fontSize: typography.sizes.sm,
      color: c.textSecondary,
    },
    sectionHeader: {
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: c.textPrimary,
    },
    sectionSubtitle: {
      fontSize: typography.sizes.xs,
      color: c.textSecondary,
      marginTop: spacing.xs / 2,
    },
    macroCard: {
      marginBottom: spacing.lg,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    macroStat: {
      alignItems: 'center',
      flex: 1,
    },
    macroValue: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
    },
    macroUnit: {
      fontSize: typography.sizes.xs,
      color: c.textMuted,
    },
    macroLabel: {
      fontSize: typography.sizes.xs,
      color: c.textSecondary,
      marginTop: spacing.xs / 2,
    },
    itemCard: {
      marginBottom: spacing.sm,
    },
    itemName: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: c.textPrimary,
    },
    itemRecipe: {
      fontSize: typography.sizes.sm,
      color: c.textSecondary,
      marginTop: spacing.xs,
      fontStyle: 'italic',
    },
    itemMeta: {
      fontSize: typography.sizes.xs,
      color: c.textMuted,
      marginTop: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    actionBar: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    actionButton: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    emptyTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: c.textPrimary,
      marginBottom: spacing.sm,
    },
    emptyBody: {
      fontSize: typography.sizes.sm,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    emptyButton: {
      minWidth: EMPTY_BUTTON_MIN_WIDTH,
      borderRadius: radii.md,
    },
  });
