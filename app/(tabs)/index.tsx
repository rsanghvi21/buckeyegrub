import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Plus,
  RotateCcw,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { Header } from '@/src/components/navigation/Header';
import { BuckeyeLeaf } from '@/src/components/navigation/BuckeyeLeaf';
import {
  Badge,
  Button,
  Card,
  MacroRing,
  ProgressBar,
} from '@/src/components/ui';
import { radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context';
import { OSU_MENU_ITEMS_MAP, OSU_VENUES_MAP } from '@/src/data';
import { useMealPlanStore, useUserStore } from '@/src/store';
import { MealSlotType } from '@/src/types/mealPlan';
import { calculatePowerScore } from '@/src/utils/nutrition';

const SLOT_ORDER: { key: MealSlotType; label: string; timeHint: string }[] = [
  { key: 'breakfast', label: 'Breakfast', timeHint: '7:00 AM – 10:30 AM' },
  { key: 'lunch', label: 'Lunch', timeHint: '11:00 AM – 2:30 PM' },
  { key: 'dinner', label: 'Dinner', timeHint: '4:30 PM – 8:00 PM' },
  { key: 'snack', label: 'Snack / Pre-RPAC', timeHint: 'Anytime Fuel' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { profile, resetToDemo: resetUserDemo } = useUserStore();
  const {
    activePlan,
    toggleSlotLogged,
    getLoggedTotals,
    getDailyTotals,
    resetToDemoPlan,
  } = useMealPlanStore();

  const loggedTotals = getLoggedTotals();
  const dailyTotals = getDailyTotals();

  // Calculated dynamic Power Score based on real logged totals vs targets
  const livePowerScore = useMemo(() => {
    return calculatePowerScore(loggedTotals, profile.targetCalories, profile.targetMacros);
  }, [loggedTotals, profile.targetCalories, profile.targetMacros]);

  const caloriePercentage = Math.min(
    150,
    Math.round((loggedTotals.calories / (profile.targetCalories || 1)) * 100)
  );

  const handleResetDemo = () => {
    resetUserDemo();
    resetToDemoPlan();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header
        title="BuckeyeGrub"
        subtitle={`Welcome back, ${profile.name.split(' ')[0]}!`}
        rightAction={
          <View style={styles.headerBadgesRow}>
            <Badge
              label={`${profile.streakDays}d Streak`}
              variant="scarlet"
              size="sm"
              icon={<BuckeyeLeaf size={14} color={theme.scarlet} />}
            />
            <Badge
              label={`${livePowerScore} Score`}
              variant="gold"
              size="sm"
              icon={<Award size={14} color={theme.goldDark} />}
            />
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BuckID Status Bar */}
        <Card variant="filled" padding="sm" style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Swipes</Text>
              <Text style={[styles.balanceValue, { color: theme.scarlet }]}>
                {profile.balances.swipes}
              </Text>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: theme.border }]} />
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Dining $</Text>
              <Text style={[styles.balanceValue, { color: theme.success }]}>
                ${profile.balances.diningDollars.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: theme.border }]} />
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>BuckID Cash</Text>
              <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
                ${profile.balances.buckidCash.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Daily Nutrition & Macro Progress Card */}
        <Card variant="elevated" padding="lg" style={styles.macroCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Daily Nutrition</Text>
            <Badge
              label={`${caloriePercentage}% of Goal`}
              variant={caloriePercentage >= 90 && caloriePercentage <= 110 ? 'success' : 'default'}
              size="sm"
            />
          </View>

          <View style={styles.macroOverviewRow}>
            <View style={styles.ringWrapper}>
              <MacroRing
                current={loggedTotals.calories}
                target={profile.targetCalories}
                size={140}
                strokeWidth={12}
                color={theme.macros.calories}
                label="Calories"
                unit="kcal"
              />
            </View>

            <View style={styles.macroBarsColumn}>
              <ProgressBar
                label="Protein"
                current={loggedTotals.macros.protein}
                target={profile.targetMacros.protein}
                unit="g"
                color={theme.macros.protein}
              />
              <ProgressBar
                label="Carbs"
                current={loggedTotals.macros.carbs}
                target={profile.targetMacros.carbs}
                unit="g"
                color={theme.macros.carbs}
              />
              <ProgressBar
                label="Fat"
                current={loggedTotals.macros.fat}
                target={profile.targetMacros.fat}
                unit="g"
                color={theme.macros.fat}
              />
            </View>
          </View>

          <View style={[styles.macroSummaryFooter, { borderTopColor: theme.border }]}>
            <Text style={[styles.summaryFooterText, { color: theme.textSecondary }]}>
              Logged: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{loggedTotals.calories} kcal</Text>
              {'  '}•{'  '}
              Planned: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{dailyTotals.calories} kcal</Text>
              {'  '}•{'  '}
              Goal: <Text style={{ color: theme.scarlet, fontWeight: '700' }}>{profile.targetCalories} kcal</Text>
            </Text>
          </View>
        </Card>

        {/* Quick Action Banner */}
        <View style={styles.quickActionRow}>
          <Pressable
            style={[styles.quickActionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/ai-planner' as any)}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: theme.scarletWash }]}>
              <Sparkles size={18} color={theme.scarlet} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Plan My Day</Text>
              <Text style={[styles.actionButtonSub, { color: theme.textSecondary }]}>1-Click Brutus AI</Text>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.quickActionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/menus' as any)}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: theme.grayWash }]}>
              <Utensils size={18} color={theme.textPrimary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionButtonTitle, { color: theme.textPrimary }]}>Campus Menus</Text>
              <Text style={[styles.actionButtonSub, { color: theme.textSecondary }]}>10+ OSU Venues</Text>
            </View>
            <ChevronRight size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Daily Timeline */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today's Meal Timeline</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {activePlan.title || 'Personalized Daily Plan'}
          </Text>
        </View>

        {SLOT_ORDER.map(({ key, label, timeHint }) => {
          const slotData = activePlan.meals[key];
          const items = slotData?.items ?? [];
          const slotCalories = items.reduce(
            (sum, item) => sum + item.menuItem.calories * (item.servingMultiplier || 1),
            0
          );
          const isLogged = slotData?.isLogged ?? false;

          // Find venue for Grubhub ordering
          const firstVenueId = items[0]?.menuItem?.venueId;
          const venue = firstVenueId ? OSU_VENUES_MAP[firstVenueId] : undefined;

          return (
            <Card
              key={key}
              variant="elevated"
              padding="md"
              style={[
                styles.slotCard,
                isLogged && { borderColor: theme.success, borderWidth: 1.5 },
              ]}
            >
              <View style={styles.slotHeaderRow}>
                <View>
                  <View style={styles.slotTitleWithBadge}>
                    <Text style={[styles.slotTitle, { color: theme.textPrimary }]}>{label}</Text>
                    <Badge
                      label={isLogged ? 'Logged' : 'Planned'}
                      variant={isLogged ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.slotTimeHint, { color: theme.textSecondary }]}>{timeHint}</Text>
                </View>
                <Text style={[styles.slotCaloriesText, { color: theme.scarlet }]}>
                  {Math.round(slotCalories)} kcal
                </Text>
              </View>

              {/* Items List */}
              <View style={styles.slotItemsContainer}>
                {items.length === 0 ? (
                  <Text style={[styles.emptySlotText, { color: theme.textSecondary }]}>
                    No items planned yet for {label.toLowerCase()}.
                  </Text>
                ) : (
                  items.map((entry) => {
                    const item = entry.menuItem;
                    const itemVenue = OSU_VENUES_MAP[item.venueId];
                    return (
                      <Pressable
                        key={entry.id}
                        style={({ pressed }) => [
                          styles.itemRow,
                          { borderBottomColor: theme.border },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: '/modal/meal-details' as any,
                            params: { itemId: item.id },
                          } as any)
                        }
                      >
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.itemVenue, { color: theme.textSecondary }]}>
                            {itemVenue?.shortName || itemVenue?.name || 'Campus Venue'}
                          </Text>
                        </View>
                        <View style={styles.itemMacroBadges}>
                          <Text style={[styles.itemCalText, { color: theme.textPrimary }]}>
                            {item.calories} kcal
                          </Text>
                          <Badge
                            label={`${item.macros.protein}g P`}
                            variant="dietary"
                            size="sm"
                          />
                        </View>
                        <ChevronRight size={16} color={theme.textSecondary} />
                      </Pressable>
                    );
                  })
                )}
              </View>

              {/* Slot Actions Row */}
              <View style={styles.slotActionsRow}>
                <Button
                  label={isLogged ? 'Mark Planned' : 'Log Meal'}
                  variant={isLogged ? 'outline' : 'primary'}
                  size="sm"
                  onPress={() => toggleSlotLogged(key)}
                  icon={isLogged ? <CheckCircle2 size={16} color={theme.scarlet} /> : undefined}
                />

                {venue && (
                  <Button
                    label="Order via Grubhub"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: '/modal/grubhub-assistant' as any,
                        params: { venueId: venue.id, slot: key },
                      } as any)
                    }
                    icon={<ExternalLink size={14} color={theme.scarlet} />}
                  />
                )}
              </View>
            </Card>
          );
        })}

        {/* Buckeye Power Score Insight */}
        <Card variant="filled" padding="md" style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <BuckeyeLeaf size={24} color={theme.scarlet} />
            <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>
              Brutus Coaching Insight
            </Text>
          </View>
          <Text style={[styles.insightBody, { color: theme.textSecondary }]}>
            {loggedTotals.macros.protein >= profile.targetMacros.protein
              ? 'Awesome job hitting your protein target today! Your Buckeye Power Score is boosted.'
              : `You are ${Math.max(
                  0,
                  Math.round(profile.targetMacros.protein - loggedTotals.macros.protein)
                )}g away from your daily protein goal. Traditions at Scott and Curl Market have great high-protein options!`}
          </Text>
        </Card>

        {/* Demo Reset Shortcut */}
        <View style={styles.resetContainer}>
          <Button
            label="Reset Demo State"
            variant="outline"
            size="sm"
            onPress={handleResetDemo}
            icon={<RotateCcw size={14} color={theme.textSecondary} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceCard: {
    marginVertical: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  balanceCol: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  balanceDivider: {
    width: 1,
    height: 28,
  },
  macroCard: {
    marginVertical: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
  },
  macroOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroBarsColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  macroSummaryFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  summaryFooterText: {
    fontSize: typography.fontSizes.xs,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  actionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  actionButtonSub: {
    fontSize: typography.fontSizes.xs,
  },
  sectionHeaderRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
  },
  slotCard: {
    marginVertical: spacing.xs,
  },
  slotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  slotTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  slotTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  slotTimeHint: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  slotCaloriesText: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  slotItemsContainer: {
    marginVertical: spacing.xs,
  },
  emptySlotText: {
    fontSize: typography.fontSizes.xs,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
  },
  itemVenue: {
    fontSize: typography.fontSizes.xs,
  },
  itemMacroBadges: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemCalText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  slotActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  insightCard: {
    marginVertical: spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  insightTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  insightBody: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
