import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  Dumbbell,
  PiggyBank,
  RotateCcw,
  Send,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react-native';
import { Header } from '@/src/components/navigation/Header';
import { BuckeyeLeaf } from '@/src/components/navigation/BuckeyeLeaf';
import { Badge, Button, Card } from '@/src/components/ui';
import { palette, radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context';
import { useChatStore, useMealPlanStore, useUserStore } from '@/src/store';
import { CampusZone } from '@/src/types/dining';
import { DailyMealPlan, MealSlotType } from '@/src/types/mealPlan';
import { GoalPreset } from '@/src/types/ai';

interface PresetOption {
  id: GoalPreset;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const PRESETS: PresetOption[] = [
  {
    id: 'post_rpac',
    title: 'Post-RPAC Chest Day',
    subtitle: 'Max protein surplus to fuel muscle recovery',
    icon: <Dumbbell size={20} color={palette.scarlet} />,
  },
  {
    id: 'cut_lean',
    title: 'Cut & Lean',
    subtitle: 'High-satiety calorie deficit with lean campus picks',
    icon: <TrendingDown size={20} color={palette.scarlet} />,
  },
  {
    id: 'budget_day',
    title: 'Budget Day',
    subtitle: 'Prioritizes Traditions Swipes & lowest cost items',
    icon: <PiggyBank size={20} color={palette.scarlet} />,
  },
  {
    id: 'bulk_power',
    title: 'Bulk & Power',
    subtitle: 'Calorie dense, high-carb athletic fuel',
    icon: <Zap size={20} color={palette.scarlet} />,
  },
];

const SUGGESTION_CHIPS = [
  'High-protein meals under $10',
  'What should I eat after RPAC?',
  'Best post-workout meal at Scott?',
  'Vegan options at Traditions',
  'Quick lunch between classes near Union',
];

export default function AIPlannerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile } = useUserStore();
  const { setActivePlan, saveCurrentPlan } = useMealPlanStore();
  const {
    messages,
    isLoading,
    isGeneratingPlan,
    fallbackNotice,
    clearFallbackNotice,
    sendMessage,
    generateDayPlan,
    clearChat,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'generator' | 'chat'>('generator');
  const [selectedPreset, setSelectedPreset] = useState<GoalPreset>('post_rpac');
  const [selectedZone, setSelectedZone] = useState<CampusZone | 'All'>('All');
  const [generatedPlan, setGeneratedPlan] = useState<DailyMealPlan | null>(null);
  const [planApplied, setPlanApplied] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);

  const handleGeneratePlan = async () => {
    setPlanApplied(false);
    setPlanSaved(false);
    try {
      const plan = await generateDayPlan({
        goalPreset: selectedPreset,
        zone: selectedZone,
      });
      setGeneratedPlan(plan);
    } catch (e) {
      console.error('Plan generation failed:', e);
      Alert.alert(
        'BrutusAI Planning Notice',
        e instanceof Error
          ? e.message
          : 'Brutus was unable to complete plan generation. Offline fallback engaged.'
      );
    }
  };

  const handleApplyPlan = () => {
    if (!generatedPlan) return;
    setActivePlan(generatedPlan);
    setPlanApplied(true);
  };

  const handleSavePlan = () => {
    if (!generatedPlan) return;
    saveCurrentPlan(
      generatedPlan.title || 'Brutus AI Plan',
      `Generated for ${selectedPreset.replace('_', ' ')}`,
      ['AI Generated', selectedPreset]
    );
    setPlanSaved(true);
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const text = textToSend ?? chatInput.trim();
    if (!text || isLoading) return;
    setChatInput('');
    await sendMessage(text);
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header
        title="BrutusAI Planner"
        subtitle="Intelligent campus nutrition optimization"
        showBuckeyeLeaf
      />

      {/* Segmented Tab Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'generator' && [styles.activeTabButton, { borderBottomColor: theme.scarlet }],
          ]}
          onPress={() => setActiveTab('generator')}
        >
          <Sparkles size={16} color={activeTab === 'generator' ? theme.scarlet : theme.textSecondary} />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'generator' ? theme.scarlet : theme.textSecondary },
              activeTab === 'generator' && styles.activeTabButtonText,
            ]}
          >
            1-Click Plan Generator
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'chat' && [styles.activeTabButton, { borderBottomColor: theme.scarlet }],
          ]}
          onPress={() => setActiveTab('chat')}
        >
          <Bot size={16} color={activeTab === 'chat' ? theme.scarlet : theme.textSecondary} />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'chat' ? theme.scarlet : theme.textSecondary },
              activeTab === 'chat' && styles.activeTabButtonText,
            ]}
          >
            Ask Brutus Chat
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: 1-Click Plan Generator */}
      {activeTab === 'generator' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Choose a Goal Preset</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Brutus will solve a 4-meal plan matching your macro goals within ±5%.
          </Text>

          {/* Goal Presets Grid */}
          <View style={styles.presetsGrid}>
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  style={[
                    styles.presetCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { borderColor: theme.scarlet, borderWidth: 2, backgroundColor: theme.scarletWash },
                  ]}
                  onPress={() => setSelectedPreset(preset.id)}
                >
                  <View style={styles.presetHeader}>
                    {preset.icon}
                    {isSelected && <Badge label="Active" variant="scarlet" size="sm" />}
                  </View>
                  <Text style={[styles.presetTitle, { color: theme.textPrimary }]}>{preset.title}</Text>
                  <Text style={[styles.presetSubtitle, { color: theme.textSecondary }]}>
                    {preset.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Campus Zone Filter */}
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Preferred Campus Zone</Text>
          <View style={styles.zoneChipsRow}>
            {(['All', 'North', 'South', 'West'] as const).map((zone) => {
              const isSelected = selectedZone === zone;
              return (
                <Pressable
                  key={zone}
                  style={[
                    styles.zoneChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.scarlet, borderColor: theme.scarlet },
                  ]}
                  onPress={() => setSelectedZone(zone)}
                >
                  <Text
                    style={[
                      styles.zoneChipText,
                      { color: isSelected ? theme.textInverse : theme.textPrimary },
                    ]}
                  >
                    {zone}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* CTA Generate Button */}
          <View style={styles.ctaContainer}>
            <Button
              label={isGeneratingPlan ? 'Brutus is Calculating Meals...' : 'Generate Daily Meal Plan'}
              variant="primary"
              size="lg"
              onPress={handleGeneratePlan}
              disabled={isGeneratingPlan}
              icon={isGeneratingPlan ? <ActivityIndicator size="small" color={theme.textInverse} /> : <Sparkles size={18} color={theme.textInverse} />}
            />
          </View>

          {/* Generated Plan Preview */}
          {generatedPlan && (
            <Card variant="elevated" padding="md" style={styles.planPreviewCard}>
              <View style={styles.planPreviewHeader}>
                <View>
                  <Text style={[styles.planTitle, { color: theme.textPrimary }]}>
                    {generatedPlan.title}
                  </Text>
                  <Text style={[styles.planSourceText, { color: theme.textSecondary }]}>
                    Engine: {generatedPlan.source === 'heuristic' ? 'Brutus Offline Heuristic Solver' : 'Google Gemini AI'}
                  </Text>
                </View>
                <Badge
                  label={`${generatedPlan.totalCalories} kcal`}
                  variant="scarlet"
                  size="md"
                />
              </View>

              {/* Macro Specs Bar */}
              <View style={styles.previewMacroRow}>
                <Text style={[styles.previewMacroItem, { color: theme.macros.protein }]}>
                  {generatedPlan.totalMacros.protein}g Protein
                </Text>
                <Text style={{ color: theme.border }}>•</Text>
                <Text style={[styles.previewMacroItem, { color: theme.macros.carbs }]}>
                  {generatedPlan.totalMacros.carbs}g Carbs
                </Text>
                <Text style={{ color: theme.border }}>•</Text>
                <Text style={[styles.previewMacroItem, { color: theme.macros.fat }]}>
                  {generatedPlan.totalMacros.fat}g Fat
                </Text>
              </View>

              {/* Meals Preview */}
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlotType[]).map((slotKey) => {
                const slot = generatedPlan.meals[slotKey];
                return (
                  <View key={slotKey} style={[styles.previewMealRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.previewSlotLabel, { color: theme.textSecondary }]}>
                      {slot.label}
                    </Text>
                    <View style={styles.previewItemsCol}>
                      {slot.items.map((item) => (
                        <Text key={item.id} style={[styles.previewItemName, { color: theme.textPrimary }]} numberOfLines={1}>
                          • {item.menuItem.name} ({item.menuItem.calories} kcal)
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })}

              {/* Plan Actions */}
              <View style={styles.planActionsRow}>
                <Button
                  label={planApplied ? 'Applied to Today!' : 'Apply to Today’s Plan'}
                  variant={planApplied ? 'outline' : 'primary'}
                  size="md"
                  onPress={handleApplyPlan}
                  icon={planApplied ? <Check size={16} color={theme.success} /> : undefined}
                />
                <Button
                  label={planSaved ? 'Saved!' : 'Save to My Plans'}
                  variant="outline"
                  size="md"
                  onPress={handleSavePlan}
                  icon={planSaved ? <Check size={16} color={theme.scarlet} /> : undefined}
                />
              </View>
            </Card>
          )}
        </ScrollView>
      )}

      {/* TAB 2: Ask Brutus Conversational Chat */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {fallbackNotice && (
            <View style={[styles.noticeBanner, { backgroundColor: theme.goldLight, borderColor: theme.gold }]}>
              <AlertCircle size={16} color={theme.goldDark} />
              <Text style={[styles.noticeText, { color: theme.goldDark }]}>{fallbackNotice}</Text>
              <Pressable onPress={clearFallbackNotice}>
                <Text style={[styles.dismissText, { color: theme.goldDark }]}>Dismiss</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            ref={chatScrollRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isAssistant ? styles.assistantRow : styles.userRow,
                  ]}
                >
                  {isAssistant && (
                    <View style={[styles.avatarBubble, { backgroundColor: theme.scarlet }]}>
                      <BuckeyeLeaf size={16} color={theme.white} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isAssistant
                        ? [styles.assistantBubble, { backgroundColor: theme.surface, borderColor: theme.border }]
                        : [styles.userBubble, { backgroundColor: theme.scarlet }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: isAssistant ? theme.textPrimary : theme.white },
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              );
            })}

            {isLoading && (
              <View style={[styles.messageRow, styles.assistantRow]}>
                <View style={[styles.avatarBubble, { backgroundColor: theme.scarlet }]}>
                  <BuckeyeLeaf size={16} color={theme.white} />
                </View>
                <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <ActivityIndicator size="small" color={theme.scarlet} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Suggestion Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionScroll}
            contentContainerStyle={styles.suggestionContent}
          >
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <Pressable
                key={idx}
                style={[styles.suggestionChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => handleSendChatMessage(chip)}
              >
                <Text style={[styles.suggestionChipText, { color: theme.textPrimary }]}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary, backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Ask Brutus about campus food & macros..."
              placeholderTextColor={theme.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={() => handleSendChatMessage()}
              returnKeyType="send"
            />
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: chatInput.trim() ? theme.scarlet : theme.gray },
              ]}
              onPress={() => handleSendChatMessage()}
              disabled={!chatInput.trim() || isLoading}
            >
              <Send size={18} color={theme.white} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetCard: {
    width: '48%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  presetTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  zoneChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  zoneChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  zoneChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  ctaContainer: {
    marginBottom: spacing.lg,
  },
  planPreviewCard: {
    marginTop: spacing.xs,
  },
  planPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  planSourceText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  previewMacroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  previewMacroItem: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '700',
  },
  previewMealRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  previewSlotLabel: {
    width: 70,
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  previewItemsCol: {
    flex: 1,
  },
  previewItemName: {
    fontSize: typography.fontSizes.xs,
    marginBottom: 2,
  },
  planActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chatContainer: {
    flex: 1,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderWidth: 1,
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: radii.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
  },
  dismissText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  assistantRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatarBubble: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  assistantBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  messageText: {
    fontSize: typography.fontSizes.sm,
    lineHeight: 20,
  },
  suggestionScroll: {
    maxHeight: 44,
  },
  suggestionContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  suggestionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizes.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
