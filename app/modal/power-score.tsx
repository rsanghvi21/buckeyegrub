/**
 * BuckeyeGrub Buckeye Power Score Breakdown Modal Sheet
 * Provides full transparency into how the student's daily 0-100 score is derived
 * across Protein adherence (50%), Calorie accuracy (40%), and Meal logging consistency (10%).
 */

import React from 'react';
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
  Zap,
  CheckCircle2,
  Sparkles,
  X,
  Target,
  Flame,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { MacroRing } from '@/src/components/ui/MacroRing';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { useTheme } from '@/src/context/ThemeContext';
import { useUserStore } from '@/src/store/useUserStore';
import { useMealPlanStore } from '@/src/store/useMealPlanStore';
import { calculatePowerScoreBreakdown } from '@/src/utils/nutrition';
import { radii, spacing, typography } from '@/src/constants/theme';
import { hapticLight } from '@/src/utils/haptics';

export default function PowerScoreModal() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { profile } = useUserStore();
  const { activePlan, getLoggedTotals } = useMealPlanStore();

  const loggedTotals = getLoggedTotals();

  // Count logged slots
  const loggedSlotCount = Object.values(activePlan.meals).filter((m) => m.isLogged).length;

  const breakdown = calculatePowerScoreBreakdown(
    loggedTotals,
    profile.targetCalories,
    profile.targetMacros,
    loggedSlotCount
  );

  const handleClose = async () => {
    await hapticLight();
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ModalHeader
        title="Buckeye Power Score"
        icon={<Award size={22} color={theme.scarlet} />}
        onClose={handleClose}
        accessibilityLabel="Close power score breakdown"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Score Hero Card */}
        <Card variant="elevated" padding="lg" style={styles.heroCard}>
          <View style={styles.heroCenter}>
            <View style={styles.gaugeContainer}>
              <MacroRing
                current={breakdown.totalScore}
                target={100}
                size={140}
                strokeWidth={14}
                color={breakdown.tierVariant === 'scarlet' ? theme.scarlet : breakdown.tierVariant === 'gold' ? theme.gold : breakdown.tierVariant === 'success' ? theme.success : theme.textSecondary}
                label="Power"
                unit="pts"
                showPercentage={false}
              />
            </View>

            <View style={styles.tierRow}>
              <Badge
                label={breakdown.tier}
                variant={breakdown.tierVariant}
                size="md"
                icon={<Zap size={14} color={breakdown.tierVariant === 'scarlet' ? theme.scarlet : breakdown.tierVariant === 'gold' ? theme.goldDark : theme.success} />}
              />
            </View>

            <Text style={[styles.scoreSummaryText, { color: theme.textSecondary }]}>
              Daily nutritional discipline & meal logging score
            </Text>
          </View>
        </Card>

        {/* Itemized Points Breakdown */}
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
          Score Breakdown (0 – 100)
        </Text>

        {/* 1. Protein Adherence (50 pts) */}
        <Card variant="filled" padding="md" style={styles.breakdownCard}>
          <View style={styles.itemHeaderRow}>
            <View style={styles.itemTitleGroup}>
              <Flame size={18} color={theme.scarlet} />
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                Protein Adherence (50 pts)
              </Text>
            </View>
            <Text style={[styles.itemScorePoints, { color: theme.scarlet }]}>
              {breakdown.proteinScore} / 50
            </Text>
          </View>
          <Text style={[styles.itemDescription, { color: theme.textSecondary }]}>
            Logged {loggedTotals.macros.protein}g / {profile.targetMacros.protein}g protein target (
            {Math.round(breakdown.proteinRatio * 100)}% achieved). High-protein diets protect lean muscle during campus life!
          </Text>
          <View style={[styles.miniBarBg, { backgroundColor: theme.surfaceHover }]}>
            <View
              style={[
                styles.miniBarFill,
                {
                  width: `${Math.min(100, Math.round((breakdown.proteinScore / 50) * 100))}%`,
                  backgroundColor: theme.scarlet,
                },
              ]}
            />
          </View>
        </Card>

        {/* 2. Calorie Target Adherence (40 pts) */}
        <Card variant="filled" padding="md" style={styles.breakdownCard}>
          <View style={styles.itemHeaderRow}>
            <View style={styles.itemTitleGroup}>
              <Target size={18} color={theme.goldDark} />
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                Calorie Target Accuracy (40 pts)
              </Text>
            </View>
            <Text style={[styles.itemScorePoints, { color: theme.goldDark }]}>
              {breakdown.calorieScore} / 40
            </Text>
          </View>
          <Text style={[styles.itemDescription, { color: theme.textSecondary }]}>
            Logged {loggedTotals.calories} / {profile.targetCalories} kcal (
            {Math.round(breakdown.calorieRatio * 100)}% of daily energy). Balanced within ±10% buffer avoids overeating penalties.
          </Text>
          <View style={[styles.miniBarBg, { backgroundColor: theme.surfaceHover }]}>
            <View
              style={[
                styles.miniBarFill,
                {
                  width: `${Math.min(100, Math.round((breakdown.calorieScore / 40) * 100))}%`,
                  backgroundColor: theme.gold,
                },
              ]}
            />
          </View>
        </Card>

        {/* 3. Meal Logging Consistency (10 pts) */}
        <Card variant="filled" padding="md" style={styles.breakdownCard}>
          <View style={styles.itemHeaderRow}>
            <View style={styles.itemTitleGroup}>
              <CheckCircle2 size={18} color={theme.success} />
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                Meal Logging Bonus (10 pts)
              </Text>
            </View>
            <Text style={[styles.itemScorePoints, { color: theme.success }]}>
              {breakdown.loggingScore} / 10
            </Text>
          </View>
          <Text style={[styles.itemDescription, { color: theme.textSecondary }]}>
            {breakdown.loggedSlotsCount} of 4 meals logged today (+2.5 pts per meal slot: Breakfast, Lunch, Dinner, Snack).
          </Text>
          <View style={[styles.miniBarBg, { backgroundColor: theme.surfaceHover }]}>
            <View
              style={[
                styles.miniBarFill,
                {
                  width: `${Math.min(100, Math.round((breakdown.loggingScore / 10) * 100))}%`,
                  backgroundColor: theme.success,
                },
              ]}
            />
          </View>
        </Card>

        {/* Brutus Coaching Card */}
        <Card variant="elevated" padding="md" style={[styles.coachingCard, { borderLeftColor: theme.gold }]}>
          <View style={styles.coachingHeader}>
            <Sparkles size={18} color={theme.goldDark} />
            <Text style={[styles.coachingTitle, { color: theme.textPrimary }]}>
              BrutusAI Coaching Tip
            </Text>
          </View>
          <Text style={[styles.coachingBody, { color: theme.textSecondary }]}>
            "{breakdown.coachingTip}"
          </Text>
        </Card>

        {/* Action Button */}
        <Button
          label="Got It, Go Bucks!"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleClose}
          style={styles.actionBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  heroCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  heroCenter: {
    alignItems: 'center',
  },
  gaugeContainer: {
    marginBottom: spacing.sm,
  },
  tierRow: {
    marginVertical: spacing.xs,
  },
  scoreSummaryText: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  breakdownCard: {
    marginBottom: spacing.sm,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  itemScorePoints: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
  },
  itemDescription: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs + 3,
    marginBottom: spacing.xs,
  },
  miniBarBg: {
    height: 6,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  coachingCard: {
    marginVertical: spacing.md,
    borderLeftWidth: 4,
  },
  coachingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  coachingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  coachingBody: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    lineHeight: typography.lineHeights.sm + 2,
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
});
