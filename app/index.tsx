import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import {
  Flame,
  RotateCcw,
  Search,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { Header } from '@/src/components/navigation/Header';
import { BuckeyeLeaf } from '@/src/components/navigation/BuckeyeLeaf';
import {
  Badge,
  Button,
  Card,
  Input,
  MacroRing,
  ProgressBar,
  SwipeableCard,
} from '@/src/components/ui';
import { colors, radii, spacing, typography } from '@/src/constants/theme';
import { useDiningStore, useMealPlanStore, useUserStore } from '@/src/store';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, resetToDemo: resetUserDemo } = useUserStore();
  const {
    activePlan,
    toggleSlotLogged,
    getLoggedTotals,
    resetToDemoPlan,
  } = useMealPlanStore();
  const { searchQuery, setSearchQuery, resetFilters } = useDiningStore();

  const [buttonLoading, setButtonLoading] = useState(false);
  const loggedTotals = getLoggedTotals();

  const handleToggleLog = () => {
    setButtonLoading(true);
    setTimeout(() => {
      if (!activePlan.meals.dinner.isLogged) {
        toggleSlotLogged('dinner');
      } else {
        toggleSlotLogged('snack');
      }
      setButtonLoading(false);
    }, 300);
  };

  const handleResetDemo = () => {
    resetUserDemo();
    resetToDemoPlan();
    resetFilters();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="BuckeyeGrub"
        subtitle={`Welcome back, ${profile.name.split(' ')[0]}!`}
        rightAction={
          <Badge
            label={`${profile.streakDays} Streak`}
            variant="scarlet"
            size="sm"
            icon={<BuckeyeLeaf size={14} color={colors.scarlet} />}
          />
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* BuckID Status Bar */}
        <Card variant="filled" padding="sm" style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>
              Swipes: <Text style={styles.balanceHighlight}>{profile.balances.swipes}</Text>
            </Text>
            <Text style={styles.balanceDivider}>•</Text>
            <Text style={styles.balanceText}>
              Dining $: <Text style={styles.balanceHighlight}>${profile.balances.diningDollars.toFixed(2)}</Text>
            </Text>
            <Text style={styles.balanceDivider}>•</Text>
            <Text style={styles.balanceText}>
              BuckID Cash: <Text style={styles.balanceHighlight}>${profile.balances.buckidCash.toFixed(2)}</Text>
            </Text>
          </View>
        </Card>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerTitle}>OSU Design System & State Layer</Text>
          <Text style={styles.bannerSubtitle}>
            Zustand v5 Client State & AsyncStorage Persistence Active
          </Text>
        </View>

        {/* Section 1: Daily Nutrition & Macro Progress */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Nutrition Target</Text>
          <Text style={styles.sectionSubtitle}>
            Animated SVG MacroRing & Progress Bars (Reactive to Store)
          </Text>
        </View>

        <Card variant="elevated" padding="lg" style={styles.macroCard}>
          <View style={styles.macroOverviewRow}>
            <MacroRing
              current={loggedTotals.calories}
              target={profile.targetCalories}
              size={144}
              strokeWidth={12}
              color={colors.macros.calories}
              label="Calories"
              unit="kcal"
            />

            <View style={styles.macroBarsColumn}>
              <ProgressBar
                label="Protein"
                current={loggedTotals.macros.protein}
                target={profile.targetMacros.protein}
                unit="g"
                color={colors.macros.protein}
              />
              <ProgressBar
                label="Carbs"
                current={loggedTotals.macros.carbs}
                target={profile.targetMacros.carbs}
                unit="g"
                color={colors.macros.carbs}
              />
              <ProgressBar
                label="Fat"
                current={loggedTotals.macros.fat}
                target={profile.targetMacros.fat}
                unit="g"
                color={colors.macros.fat}
              />
            </View>
          </View>

          <View style={styles.macroActionsRow}>
            <Button
              title={
                !activePlan.meals.dinner.isLogged
                  ? 'Log Dinner (+640 kcal)'
                  : !activePlan.meals.snack.isLogged
                  ? 'Log Snack (+570 kcal)'
                  : 'All Meals Logged (Reset Day)'
              }
              variant="outline"
              size="sm"
              leftIcon={<Flame size={16} color={colors.scarlet} />}
              loading={buttonLoading}
              onPress={
                activePlan.meals.dinner.isLogged && activePlan.meals.snack.isLogged
                  ? handleResetDemo
                  : handleToggleLog
              }
              style={styles.flexButton}
            />
            <Button
              title="Reset Demo"
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={15} color={colors.textPrimary} />}
              onPress={handleResetDemo}
            />
          </View>
        </Card>

        {/* Section 2: Dining Hall Cards & Dietary Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Campus Meal Cards</Text>
          <Text style={styles.sectionSubtitle}>Elevated Cards with Dietary & Payment Tags</Text>
        </View>

        <Card variant="elevated" padding="md" style={styles.mealCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.mealTitle}>Scott Traditions – Power Bowl</Text>
            <Badge label="Traditions Swipe" variant="swipe" size="sm" />
          </View>

          <View style={styles.badgeWrapRow}>
            <Badge label="High-Protein" variant="high-protein" size="sm" />
            <Badge label="Gluten-Free" variant="gluten-free" size="sm" />
            <Badge label="Halal" variant="halal" size="sm" />
          </View>

          <Text style={styles.mealNutrition}>
            680 kcal • 54g Protein • 62g Carbs • 18g Fat
          </Text>

          <View style={styles.cardActionsRow}>
            <Button
              title="Add to Plan"
              variant="primary"
              size="sm"
              leftIcon={<Utensils size={15} color={colors.textInverse} />}
              style={styles.flexButton}
            />
            <Button
              title="Assistant"
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={15} color={colors.textPrimary} />}
              onPress={() =>
                router.push(
                  '/modal/grubhub-assistant?venueId=traditions-at-scott&slot=dinner' as Href
                )
              }
              style={styles.flexButton}
            />
          </View>
        </Card>

        <SwipeableCard
          variant="outlined"
          padding="md"
          style={styles.mealCard}
          leftAction={{
            label: 'Favorite',
            backgroundColor: colors.scarlet,
            onPress: () => {},
          }}
          rightAction={{
            label: 'Swap',
            backgroundColor: colors.grayDark,
            onPress: () => {},
          }}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.mealTitle}>Curl Market – Glazed Salmon (Swipeable)</Text>
            <Badge label="Dining Dollars (35% OFF)" variant="dining-dollars" size="sm" />
          </View>

          <View style={styles.badgeWrapRow}>
            <Badge label="High-Protein" variant="high-protein" size="sm" />
            <Badge label="Dairy-Free" variant="dairy-free" size="sm" />
          </View>

          <Text style={styles.mealNutrition}>
            520 kcal • 42g Protein • 38g Carbs • 20g Fat
          </Text>
        </SwipeableCard>

        {/* Section 3: Dietary Tags & Payment Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dietary & BuckID Badges</Text>
          <Text style={styles.sectionSubtitle}>Accessible high-contrast tags</Text>
        </View>

        <Card variant="filled" padding="md" style={styles.badgesCard}>
          <Text style={styles.badgesGroupTitle}>Campus Payment Types</Text>
          <View style={styles.badgeWrapRow}>
            <Badge label="Traditions Swipe" variant="swipe" />
            <Badge label="Dining Dollars (35% OFF)" variant="dining-dollars" />
            <Badge label="BuckID Cash" variant="buckid-cash" />
          </View>

          <Text style={[styles.badgesGroupTitle, { marginTop: spacing.md }]}>
            Dietary Filters
          </Text>
          <View style={styles.badgeWrapRow}>
            <Badge label="High-Protein" variant="high-protein" />
            <Badge label="Vegan" variant="vegan" />
            <Badge label="Vegetarian" variant="vegetarian" />
            <Badge label="Halal" variant="halal" />
            <Badge label="Gluten-Free" variant="gluten-free" />
            <Badge label="Dairy-Free" variant="dairy-free" />
          </View>
        </Card>

        {/* Section 4: Inputs & Interactive Buttons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inputs & Action Buttons</Text>
          <Text style={styles.sectionSubtitle}>Branded Scarlet focus states</Text>
        </View>

        <Card variant="elevated" padding="md">
          <Input
            label="Search Campus Dining"
            placeholder="Scott, Kennedy, Curl Market..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={18} color={colors.grayDark} />}
            helperText="Filter by 10+ OSU dining venues across North, South, and West campus"
          />

          <View style={styles.buttonStack}>
            <Button
              title="Primary Scarlet Button"
              variant="primary"
              size="md"
              fullWidth
            />
            <Button
              title="Secondary Buckeye Gray"
              variant="secondary"
              size="md"
              fullWidth
            />
            <Button
              title="Outline Button"
              variant="outline"
              size="md"
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  bannerContainer: {
    backgroundColor: colors.scarletWash,
    borderColor: colors.scarlet,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.scarlet,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  macroCard: {
    marginBottom: spacing.lg,
  },
  macroOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  macroBarsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  macroActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  balanceCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceHover,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  balanceHighlight: {
    color: colors.scarlet,
    fontWeight: typography.weights.bold,
  },
  balanceDivider: {
    color: colors.gray,
    fontSize: typography.sizes.xs,
  },
  quickLogButton: {
    marginTop: spacing.md,
  },
  mealCard: {
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mealTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginVertical: spacing.xs,
  },
  mealNutrition: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  badgesCard: {
    marginBottom: spacing.lg,
  },
  badgesGroupTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.grayDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  buttonStack: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
