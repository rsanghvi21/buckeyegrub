import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  ChevronRight,
  Flame,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Utensils,
} from 'lucide-react-native';
import { Header } from '@/src/components/navigation/Header';
import { Badge, Button, Card } from '@/src/components/ui';
import { radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context';
import { OSU_VENUES_MAP } from '@/src/data';
import { useMealPlanStore } from '@/src/store';
import { MealSlotType } from '@/src/types/mealPlan';

export default function SavedScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    savedPlans,
    favorites,
    loadSavedPlan,
    deleteSavedPlan,
    removeFavoriteCombo,
    addItemToSlot,
  } = useMealPlanStore();

  const [activeTab, setActiveTab] = useState<'plans' | 'combos'>('plans');

  const handleLoadPlan = (planId: string) => {
    loadSavedPlan(planId);
    router.push('/' as any);
  };

  const handleApplyCombo = (combo: typeof favorites[number]) => {
    for (const item of combo.items) {
      addItemToSlot(combo.slot, item, 1);
    }
    router.push('/' as any);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header
        title="Saved & Favorites"
        subtitle="1-tap re-use for campus meal combos and daily plans"
        showBuckeyeLeaf
      />

      {/* Segmented Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'plans' && [styles.activeTabButton, { borderBottomColor: theme.scarlet }],
          ]}
          onPress={() => setActiveTab('plans')}
        >
          <Calendar size={16} color={activeTab === 'plans' ? theme.scarlet : theme.textSecondary} />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'plans' ? theme.scarlet : theme.textSecondary },
              activeTab === 'plans' && styles.activeTabButtonText,
            ]}
          >
            Saved Plans ({savedPlans.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'combos' && [styles.activeTabButton, { borderBottomColor: theme.scarlet }],
          ]}
          onPress={() => setActiveTab('combos')}
        >
          <Star size={16} color={activeTab === 'combos' ? theme.scarlet : theme.textSecondary} />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'combos' ? theme.scarlet : theme.textSecondary },
              activeTab === 'combos' && styles.activeTabButtonText,
            ]}
          >
            Favorite Combos ({favorites.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: Saved Daily Plans */}
        {activeTab === 'plans' && (
          <View>
            {savedPlans.length === 0 ? (
              <Card variant="filled" padding="lg" style={styles.emptyCard}>
                <Bookmark size={36} color={theme.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  No Saved Plans Yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Use BrutusAI to generate balanced campus meal plans, then tap "Save to My Plans" to access them here for 1-tap re-use.
                </Text>
                <Button
                  label="Create Plan with BrutusAI"
                  variant="primary"
                  size="md"
                  onPress={() => router.push('/(tabs)/ai-planner' as any)}
                  icon={<Sparkles size={16} color={theme.textInverse} />}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            ) : (
              savedPlans.map((saved) => (
                <Card key={saved.id} variant="elevated" padding="md" style={styles.planCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleCol}>
                      <Text style={[styles.planTitle, { color: theme.textPrimary }]}>{saved.name}</Text>
                      {saved.description ? (
                        <Text style={[styles.planDesc, { color: theme.textSecondary }]}>
                          {saved.description}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      label={`${saved.plan.totalCalories} kcal`}
                      variant="scarlet"
                      size="md"
                    />
                  </View>

                  {/* Macro Row */}
                  <View style={styles.macroRow}>
                    <Text style={[styles.macroItem, { color: theme.macros.protein }]}>
                      {saved.plan.totalMacros.protein}g Protein
                    </Text>
                    <Text style={{ color: theme.border }}>•</Text>
                    <Text style={[styles.macroItem, { color: theme.macros.carbs }]}>
                      {saved.plan.totalMacros.carbs}g Carbs
                    </Text>
                    <Text style={{ color: theme.border }}>•</Text>
                    <Text style={[styles.macroItem, { color: theme.macros.fat }]}>
                      {saved.plan.totalMacros.fat}g Fat
                    </Text>
                  </View>

                  {/* Tags */}
                  {saved.tags && saved.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {saved.tags.map((t, idx) => (
                        <Badge key={idx} label={t} variant="default" size="sm" />
                      ))}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={[styles.cardActionsRow, { borderTopColor: theme.border }]}>
                    <Button
                      label="Delete"
                      variant="outline"
                      size="sm"
                      onPress={() => deleteSavedPlan(saved.id)}
                      icon={<Trash2 size={14} color={theme.textSecondary} />}
                    />
                    <Button
                      label="1-Tap Re-Use Plan"
                      variant="primary"
                      size="sm"
                      onPress={() => handleLoadPlan(saved.id)}
                      icon={<ArrowRight size={14} color={theme.textInverse} />}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* TAB 2: Favorite Meal Combos */}
        {activeTab === 'combos' && (
          <View>
            {favorites.length === 0 ? (
              <Card variant="filled" padding="lg" style={styles.emptyCard}>
                <Star size={36} color={theme.textMuted} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                  No Favorite Combos Yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Explore Campus Menus to assemble your favorite lunch bowls and post-workout combos.
                </Text>
                <Button
                  label="Browse Campus Menus"
                  variant="primary"
                  size="md"
                  onPress={() => router.push('/(tabs)/menus' as any)}
                  icon={<Utensils size={16} color={theme.textInverse} />}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            ) : (
              favorites.map((combo) => {
                const venue = OSU_VENUES_MAP[combo.venueId];
                return (
                  <Card key={combo.id} variant="elevated" padding="md" style={styles.planCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardTitleCol}>
                        <Text style={[styles.planTitle, { color: theme.textPrimary }]}>{combo.name}</Text>
                        <Text style={[styles.planDesc, { color: theme.textSecondary }]}>
                          {venue?.name || 'Campus Venue'} • {combo.slot.toUpperCase()}
                        </Text>
                      </View>
                      <Badge
                        label={`${combo.totalCalories} kcal`}
                        variant="scarlet"
                        size="md"
                      />
                    </View>

                    {/* Macro Specs */}
                    <View style={styles.macroRow}>
                      <Text style={[styles.macroItem, { color: theme.macros.protein }]}>
                        {combo.totalMacros.protein}g Protein
                      </Text>
                      <Text style={{ color: theme.border }}>•</Text>
                      <Text style={[styles.macroItem, { color: theme.macros.carbs }]}>
                        {combo.totalMacros.carbs}g Carbs
                      </Text>
                      <Text style={{ color: theme.border }}>•</Text>
                      <Text style={[styles.macroItem, { color: theme.macros.fat }]}>
                        {combo.totalMacros.fat}g Fat
                      </Text>
                    </View>

                    {/* Items List */}
                    <View style={styles.comboItemsList}>
                      {combo.items.map((item, idx) => (
                        <Text key={idx} style={[styles.comboItemText, { color: theme.textPrimary }]}>
                          • {item.name} ({item.calories} kcal)
                        </Text>
                      ))}
                    </View>

                    {/* Actions */}
                    <View style={[styles.cardActionsRow, { borderTopColor: theme.border }]}>
                      <Button
                        label="Remove"
                        variant="outline"
                        size="sm"
                        onPress={() => removeFavoriteCombo(combo.id)}
                        icon={<Trash2 size={14} color={theme.textSecondary} />}
                      />
                      <Button
                        label="Add to Today's Plan"
                        variant="primary"
                        size="sm"
                        onPress={() => handleApplyCombo(combo)}
                        icon={<Plus size={14} color={theme.textInverse} />}
                      />
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '500',
  },
  activeTabButtonText: {
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  planCard: {
    marginVertical: spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitleCol: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  planTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  planDesc: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  macroItem: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: spacing.xs,
  },
  comboItemsList: {
    marginVertical: spacing.xs,
  },
  comboItemText: {
    fontSize: typography.fontSizes.xs,
    marginBottom: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
