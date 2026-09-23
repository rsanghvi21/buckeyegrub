/**
 * BuckeyeGrub Streak Milestone Card Component
 * Displays the student's Buckeye Leaf Streak, 7-day activity visualizer,
 * progress bar to next milestone, and unlocked milestone badges (3, 7, 14, 30 days).
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Flame,
  Award,
  Trophy,
  Crown,
  Lock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BuckeyeLeaf } from '../navigation/BuckeyeLeaf';
import { useTheme } from '@/src/context/ThemeContext';
import { radii, spacing, typography } from '@/src/constants/theme';
import {
  evaluateMilestones,
  getNextMilestone,
  MilestoneProgressItem,
} from '@/src/utils/gamification';

export interface StreakMilestoneCardProps {
  streakDays: number;
  lastActiveDate?: string;
  onPressBadge?: (milestone: MilestoneProgressItem) => void;
  onPressCard?: () => void;
}

export const StreakMilestoneCard: React.FC<StreakMilestoneCardProps> = ({
  streakDays,
  onPressBadge,
  onPressCard,
}) => {
  const { theme } = useTheme();
  const milestones = evaluateMilestones(streakDays);
  const nextMilestone = getNextMilestone(streakDays);

  const renderMilestoneIcon = (iconName: string, isUnlocked: boolean) => {
    const size = 18;
    const color = isUnlocked ? theme.scarlet : theme.textSecondary;
    switch (iconName) {
      case 'Flame':
        return <Flame size={size} color={color} />;
      case 'Award':
        return <Award size={size} color={color} />;
      case 'Trophy':
        return <Trophy size={size} color={color} />;
      case 'Crown':
      default:
        return <Crown size={size} color={color} />;
    }
  };

  // 7-day rolling schedule (last 7 days)
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Card variant="elevated" padding="md" style={styles.card}>
      <Pressable
        onPress={onPressCard}
        disabled={!onPressCard}
        style={({ pressed }) => [
          styles.headerPressable,
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.leafContainer, { backgroundColor: theme.scarletWash }]}>
            <BuckeyeLeaf size={28} color={theme.scarlet} />
          </View>
          <View>
            <View style={styles.streakTitleRow}>
              <Text style={[styles.streakNumber, { color: theme.scarlet }]}>
                {streakDays}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.textPrimary }]}>
                Day Buckeye Streak!
              </Text>
            </View>
            <Text style={[styles.streakSubtitle, { color: theme.textSecondary }]}>
              {nextMilestone
                ? `${nextMilestone.daysRemaining} days to unlock "${nextMilestone.title}"`
                : 'Campus Legend achieved! Maximum streak prestige.'}
            </Text>
          </View>
        </View>

        {onPressCard && <ChevronRight size={18} color={theme.textSecondary} />}
      </Pressable>

      {/* 7-day visualizer */}
      <View style={styles.weekRow}>
        {weekdays.map((day, idx) => {
          // Highlight active days up to streakDays (capped at 7 for visualizer)
          const isActive = idx < Math.min(7, streakDays);
          return (
            <View key={idx} style={styles.dayCol}>
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: isActive ? theme.scarlet : theme.surfaceHover,
                    borderColor: isActive ? theme.scarlet : theme.border,
                  },
                ]}
              >
                {isActive && <CheckCircle2 size={12} color="#FFFFFF" />}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  { color: isActive ? theme.textPrimary : theme.textSecondary },
                ]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Milestone Progress Bar */}
      {nextMilestone && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
              Next: {nextMilestone.title} ({nextMilestone.days}d)
            </Text>
            <Text style={[styles.progressPercentText, { color: theme.scarlet }]}>
              {nextMilestone.progressPercent}%
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceHover }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${nextMilestone.progressPercent}%`,
                  backgroundColor: theme.scarlet,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Milestone Badges Grid */}
      <View style={[styles.milestonesDivider, { backgroundColor: theme.border }]} />
      <Text style={[styles.milestonesSectionTitle, { color: theme.textSecondary }]}>
        Streak Milestone Badges
      </Text>

      <View style={styles.badgesGrid}>
        {milestones.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => onPressBadge && onPressBadge(m)}
            disabled={!onPressBadge}
            style={({ pressed }) => [
              styles.badgeItem,
              {
                backgroundColor: m.isUnlocked ? theme.scarletWash : theme.surfaceHover,
                borderColor: m.isUnlocked ? theme.scarlet : theme.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.badgeHeaderRow}>
              {renderMilestoneIcon(m.iconName, m.isUnlocked)}
              {m.isUnlocked ? (
                <CheckCircle2 size={14} color={theme.scarlet} />
              ) : (
                <Lock size={12} color={theme.textSecondary} />
              )}
            </View>
            <Text
              style={[
                styles.badgeTitle,
                { color: m.isUnlocked ? theme.textPrimary : theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {m.badgeLabel}
            </Text>
            <Text
              style={[
                styles.badgeSub,
                { color: m.isUnlocked ? theme.scarlet : theme.textSecondary },
              ]}
              numberOfLines={1}
            >
              {m.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
  },
  headerPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leafContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    marginRight: 6,
  },
  streakLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  streakSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dayCol: {
    alignItems: 'center',
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  progressPercentText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  progressBarBg: {
    height: 6,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  milestonesDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  milestonesSectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  badgeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  badgeSub: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
});

export default StreakMilestoneCard;
