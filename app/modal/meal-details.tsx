/**
 * BuckeyeGrub – Comprehensive Nutrition Details Modal Sheet (Checkpoint 7)
 * Displays FDA-style nutrition facts (calories, protein, carbs, fat, fiber, sodium),
 * allergen warning tags, dietary tags, Dining Dollar 35% discount pricing,
 * and "Add to Meal Plan" slot picker.
 *
 * Route params:
 *   - itemId (required): string id of a MenuItem
 */

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ExternalLink,
  Info,
  MapPin,
  Plus,
  ShieldAlert,
  Utensils,
  X,
} from 'lucide-react-native';
import { Badge, Button, Card } from '@/src/components/ui';
import { radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context';
import { OSU_MENU_ITEMS_MAP, OSU_VENUES_MAP } from '@/src/data';
import { useMealPlanStore } from '@/src/store';
import { calculateDiningDollarDiscount } from '@/src/types/dining';
import { MealSlotType } from '@/src/types/mealPlan';

export default function MealDetailsModal() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { theme } = useTheme();
  const { addItemToSlot } = useMealPlanStore();

  const [selectedSlot, setSelectedSlot] = useState<MealSlotType | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Look up item
  const item = itemId ? OSU_MENU_ITEMS_MAP[itemId] : undefined;
  const venue = item ? OSU_VENUES_MAP[item.venueId] : undefined;

  if (!item) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundTitle, { color: theme.textPrimary }]}>
            Item Not Found
          </Text>
          <Text style={[styles.notFoundSub, { color: theme.textSecondary }]}>
            The requested campus dining item could not be located in the catalog.
          </Text>
          <Button
            label="Close"
            variant="outline"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const discountedPrice = calculateDiningDollarDiscount(item.price);
  const caloriesFromFat = Math.round(item.macros.fat * 9);
  const fatPercentDv = Math.round((item.macros.fat / 78) * 100);
  const carbsPercentDv = Math.round((item.macros.carbs / 275) * 100);
  const fiberPercentDv = Math.round(((item.macros.fiber ?? 0) / 28) * 100);
  const sodiumPercentDv = Math.round(((item.macros.sodium ?? 0) / 2300) * 100);
  const proteinPercentDv = Math.round((item.macros.protein / 50) * 100);

  const handleAddSlot = (slot: MealSlotType) => {
    addItemToSlot(slot, item, 1);
    setSelectedSlot(slot);
    setAddedSuccess(true);
    setTimeout(() => {
      router.back();
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.itemTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemVenueSub, { color: theme.textSecondary }]}>
            {venue?.name || 'Campus Venue'} {item.station ? `• ${item.station}` : ''}
          </Text>
        </View>
        <Pressable
          style={[styles.closeBtn, { backgroundColor: theme.surfaceHover }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close nutrition facts"
        >
          <X size={20} color={theme.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pricing & Eligibility Card */}
        <Card variant="filled" padding="md" style={styles.pricingCard}>
          <View style={styles.pricingRow}>
            <View>
              <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Retail Price</Text>
              <Text style={[styles.retailPrice, { color: theme.textPrimary }]}>
                ${item.price.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.pricingDivider, { backgroundColor: theme.border }]} />
            <View>
              <Text style={[styles.priceLabel, { color: theme.success }]}>Dining Dollars (35% OFF)</Text>
              <Text style={[styles.discountPrice, { color: theme.success }]}>
                ${discountedPrice.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.pricingDivider, { backgroundColor: theme.border }]} />
            <View style={styles.swipeEligibilityCol}>
              <Badge
                label={item.swipeEligible ? 'Swipe Eligible' : 'Retail Only'}
                variant={item.swipeEligible ? 'paymentSwipe' : 'default'}
                size="sm"
              />
            </View>
          </View>
        </Card>

        {/* Item Description & Recipe */}
        {item.description ? (
          <Text style={[styles.itemDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        ) : null}

        {item.customizationRecipe ? (
          <Card variant="filled" padding="sm" style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
              <Utensils size={14} color={theme.scarlet} />
              <Text style={[styles.recipeTitle, { color: theme.scarlet }]}>Customization Recipe</Text>
            </View>
            <Text style={[styles.recipeBody, { color: theme.textPrimary }]}>
              {item.customizationRecipe}
            </Text>
          </Card>
        ) : null}

        {/* FDA Nutrition Facts Table */}
        <Card variant="elevated" padding="md" style={styles.nutritionFactsCard}>
          <Text style={[styles.nfHeaderTitle, { color: theme.textPrimary }]}>Nutrition Facts</Text>
          <Text style={[styles.nfServingSize, { color: theme.textSecondary }]}>
            Serving Size: {item.servingSize ? `${item.servingSize.amount} ${item.servingSize.unit}` : '1 Serving / Entree'}
          </Text>
          <View style={[styles.nfThickBar, { backgroundColor: theme.textPrimary }]} />

          <View style={styles.nfCalRow}>
            <View>
              <Text style={[styles.nfAmountPerServing, { color: theme.textSecondary }]}>
                Amount Per Serving
              </Text>
              <Text style={[styles.nfCaloriesValue, { color: theme.textPrimary }]}>
                Calories {item.calories}
              </Text>
            </View>
            <Text style={[styles.nfCalFromFat, { color: theme.textSecondary }]}>
              Calories from Fat {caloriesFromFat}
            </Text>
          </View>

          <View style={[styles.nfMediumBar, { backgroundColor: theme.textPrimary }]} />
          <Text style={[styles.nfDailyValueHeader, { color: theme.textSecondary }]}>
            % Daily Value*
          </Text>

          {/* Total Fat */}
          <View style={[styles.nfRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.nfBoldLabel, { color: theme.textPrimary }]}>
              Total Fat <Text style={styles.nfNormalText}>{item.macros.fat}g</Text>
            </Text>
            <Text style={[styles.nfPercentDv, { color: theme.textPrimary }]}>{fatPercentDv}%</Text>
          </View>

          {/* Sodium */}
          <View style={[styles.nfRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.nfBoldLabel, { color: theme.textPrimary }]}>
              Sodium <Text style={styles.nfNormalText}>{item.macros.sodium ?? 0}mg</Text>
            </Text>
            <Text style={[styles.nfPercentDv, { color: theme.textPrimary }]}>{sodiumPercentDv}%</Text>
          </View>

          {/* Total Carbohydrates */}
          <View style={[styles.nfRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.nfBoldLabel, { color: theme.textPrimary }]}>
              Total Carbohydrate <Text style={styles.nfNormalText}>{item.macros.carbs}g</Text>
            </Text>
            <Text style={[styles.nfPercentDv, { color: theme.textPrimary }]}>{carbsPercentDv}%</Text>
          </View>

          {/* Dietary Fiber */}
          <View style={[styles.nfSubRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.nfSubLabel, { color: theme.textSecondary }]}>
              Dietary Fiber {item.macros.fiber ?? 0}g
            </Text>
            <Text style={[styles.nfPercentDv, { color: theme.textPrimary }]}>{fiberPercentDv}%</Text>
          </View>

          {/* Sugars */}
          <View style={[styles.nfSubRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.nfSubLabel, { color: theme.textSecondary }]}>
              Sugars {item.macros.sugar ?? 0}g
            </Text>
            <Text style={[styles.nfPercentDv, { color: theme.textPrimary }]}>-</Text>
          </View>

          {/* Protein */}
          <View style={[styles.nfRow, { borderBottomColor: theme.border, borderBottomWidth: 3 }]}>
            <Text style={[styles.nfBoldLabel, { color: theme.textPrimary }]}>
              Protein <Text style={styles.nfNormalText}>{item.macros.protein}g</Text>
            </Text>
            <Text style={[styles.nfPercentDv, { color: theme.textPrimary }]}>{proteinPercentDv}%</Text>
          </View>

          <Text style={[styles.nfFootnote, { color: theme.textMuted }]}>
            * Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
          </Text>
        </Card>

        {/* Allergen Alerts Section */}
        <Card variant="filled" padding="md" style={styles.allergenCard}>
          <View style={styles.allergenHeaderRow}>
            <AlertTriangle size={18} color={theme.warning} />
            <Text style={[styles.allergenTitle, { color: theme.textPrimary }]}>
              Allergen Information
            </Text>
          </View>

          {item.allergens && item.allergens.length > 0 ? (
            <View style={styles.allergenBadgesRow}>
              {item.allergens.map((allergen) => (
                <Badge
                  key={allergen}
                  label={`Contains: ${allergen}`}
                  variant="dietary"
                  size="sm"
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.noAllergenText, { color: theme.textSecondary }]}>
              No major common allergens reported for this item.
            </Text>
          )}
        </Card>

        {/* Dietary Tags Section */}
        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <View style={styles.dietaryTagsSection}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              Dietary Compliance
            </Text>
            <View style={styles.dietaryChipsRow}>
              {item.dietaryTags.map((tag) => (
                <Badge key={tag} label={tag} variant="dietary" size="sm" />
              ))}
            </View>
          </View>
        )}

        {/* Add to Active Meal Plan Slot */}
        <Card variant="elevated" padding="md" style={styles.addToPlanCard}>
          <Text style={[styles.addToPlanTitle, { color: theme.textPrimary }]}>
            Add to Today's Daily Meal Plan
          </Text>
          <Text style={[styles.addToPlanSub, { color: theme.textSecondary }]}>
            Tap a meal slot to log this item immediately into your daily nutrition targets:
          </Text>

          <View style={styles.slotButtonsGrid}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlotType[]).map((slot) => {
              const isSelected = selectedSlot === slot && addedSuccess;
              return (
                <Button
                  key={slot}
                  label={isSelected ? `Added to ${slot}!` : slot.charAt(0).toUpperCase() + slot.slice(1)}
                  variant={isSelected ? 'primary' : 'outline'}
                  size="md"
                  onPress={() => handleAddSlot(slot)}
                  icon={isSelected ? <Check size={16} color={theme.textInverse} /> : <Plus size={16} color={theme.scarlet} />}
                />
              );
            })}
          </View>
        </Card>

        {/* Grubhub Order Action */}
        {venue && (
          <View style={styles.orderCtaContainer}>
            <Button
              label={`Order at ${venue.shortName || venue.name} via Grubhub`}
              variant="primary"
              size="lg"
              onPress={() => {
                router.replace({
                  pathname: '/modal/grubhub-assistant' as any,
                  params: { venueId: venue.id },
                } as any);
              }}
              icon={<ExternalLink size={18} color={theme.textInverse} />}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
  },
  notFoundSub: {
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  itemTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  itemVenueSub: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pricingCard: {
    marginBottom: spacing.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  retailPrice: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  discountPrice: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  pricingDivider: {
    width: 1,
    height: 28,
  },
  swipeEligibilityCol: {
    alignItems: 'center',
  },
  itemDescription: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  recipeCard: {
    marginVertical: spacing.xs,
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  recipeBody: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
  },
  nutritionFactsCard: {
    marginVertical: spacing.sm,
  },
  nfHeaderTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  nfServingSize: {
    fontSize: typography.fontSizes.xs,
    marginBottom: 4,
  },
  nfThickBar: {
    height: 8,
    marginVertical: 4,
  },
  nfMediumBar: {
    height: 4,
    marginVertical: 4,
  },
  nfCalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  nfAmountPerServing: {
    fontSize: 10,
  },
  nfCaloriesValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '900',
  },
  nfCalFromFat: {
    fontSize: typography.fontSizes.xs,
  },
  nfDailyValueHeader: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    marginVertical: 2,
  },
  nfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nfSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nfBoldLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
  },
  nfSubLabel: {
    fontSize: typography.fontSizes.xs,
  },
  nfNormalText: {
    fontWeight: '400',
  },
  nfPercentDv: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
  },
  nfFootnote: {
    fontSize: 10,
    marginTop: spacing.xs,
    lineHeight: 14,
  },
  allergenCard: {
    marginVertical: spacing.xs,
  },
  allergenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  allergenTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  allergenBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  noAllergenText: {
    fontSize: typography.fontSizes.xs,
    fontStyle: 'italic',
  },
  dietaryTagsSection: {
    marginVertical: spacing.xs,
  },
  sectionHeading: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
    marginBottom: 4,
  },
  dietaryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  addToPlanCard: {
    marginVertical: spacing.sm,
  },
  addToPlanTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  addToPlanSub: {
    fontSize: typography.fontSizes.xs,
    marginVertical: spacing.xs,
  },
  slotButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  orderCtaContainer: {
    marginTop: spacing.sm,
  },
});
