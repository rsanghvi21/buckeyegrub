import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Activity,
  Award,
  Calculator,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Flame,
  Key,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  User,
} from 'lucide-react-native';
import { Header } from '@/src/components/navigation/Header';
import { BuckeyeLeaf } from '@/src/components/navigation/BuckeyeLeaf';
import { Badge, Button, Card } from '@/src/components/ui';
import { radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context';
import { useMealPlanStore, useUserStore } from '@/src/store';
import { DietaryTag } from '@/src/constants/theme';
import { FitnessGoal } from '@/src/types/user';
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  calculateBmr,
  calculateSuggestedMacros,
  calculateTdee,
} from '@/src/utils/nutrition';

const GOAL_OPTIONS: { id: FitnessGoal; label: string; desc: string }[] = [
  { id: 'athletic', label: 'Athletic', desc: 'Balanced macros for peak campus & club performance' },
  { id: 'bulk', label: 'Muscle Gain (Bulk)', desc: 'Caloric surplus with high carbohydrate foundation' },
  { id: 'cut', label: 'Fat Loss (Cut)', desc: 'High-protein caloric deficit preserving muscle' },
  { id: 'maintain', label: 'Maintenance', desc: 'Sustained energy and weight equilibrium' },
];

const DIETARY_OPTIONS: { tag: DietaryTag; label: string }[] = [
  { tag: 'highProtein', label: 'High-Protein' },
  { tag: 'vegan', label: 'Vegan' },
  { tag: 'vegetarian', label: 'Vegetarian' },
  { tag: 'glutenFree', label: 'Gluten-Free' },
  { tag: 'halal', label: 'Halal' },
  { tag: 'dairyFree', label: 'Dairy-Free' },
];

export default function ProfileScreen() {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const {
    profile,
    updateProfile,
    setFitnessGoal,
    setCalorieTarget,
    setMacroTargets,
    addSwipes,
    deductSwipe,
    addDiningDollars,
    deductDiningDollars,
    addBuckIDCash,
    deductBuckIDCash,
    toggleDietaryRestriction,
    setApiKeys,
    resetToDemo,
  } = useUserStore();

  const { resetToDemoPlan } = useMealPlanStore();

  // TDEE Calculator local state
  const [showTdeeCalc, setShowTdeeCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState(String(profile.weightLbs || 195));
  const [calcHeight, setCalcHeight] = useState(String(profile.heightInches || 72));
  const [calcAge, setCalcAge] = useState('21');
  const [calcSex, setCalcSex] = useState<'male' | 'female'>('male');
  const [calcActivity, setCalcActivity] = useState<ActivityLevel>('moderate');
  const [tdeeResult, setTdeeResult] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    macros: { protein: number; carbs: number; fat: number };
  } | null>(null);

  // Manual Target editing
  const [editCalories, setEditCalories] = useState(String(profile.targetCalories));
  const [editProtein, setEditProtein] = useState(String(profile.targetMacros.protein));
  const [editCarbs, setEditCarbs] = useState(String(profile.targetMacros.carbs));
  const [editFat, setEditFat] = useState(String(profile.targetMacros.fat));
  const [targetsSaved, setTargetsSaved] = useState(false);

  // API Keys state
  const [geminiKeyInput, setGeminiKeyInput] = useState(profile.geminiApiKey || '');
  const [openaiKeyInput, setOpenaiKeyInput] = useState(profile.openaiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);

  // Calculate TDEE
  const handleCalculateTdee = () => {
    const weight = parseFloat(calcWeight) || 195;
    const height = parseFloat(calcHeight) || 72;
    const age = parseInt(calcAge, 10) || 21;

    const bmr = calculateBmr(weight, height, age, calcSex);
    const tdee = calculateTdee(bmr, calcActivity);
    const suggested = calculateSuggestedMacros(tdee, profile.fitnessGoal);

    setTdeeResult({
      bmr,
      tdee,
      targetCalories: suggested.targetCalories,
      macros: suggested.targetMacros,
    });
  };

  const handleApplyTdeeMacros = () => {
    if (!tdeeResult) return;
    setCalorieTarget(tdeeResult.targetCalories);
    setMacroTargets(tdeeResult.macros);
    setEditCalories(String(tdeeResult.targetCalories));
    setEditProtein(String(tdeeResult.macros.protein));
    setEditCarbs(String(tdeeResult.macros.carbs));
    setEditFat(String(tdeeResult.macros.fat));
    setTargetsSaved(true);
  };

  const handleSaveManualTargets = () => {
    const cals = parseInt(editCalories, 10) || profile.targetCalories;
    const p = parseInt(editProtein, 10) || profile.targetMacros.protein;
    const c = parseInt(editCarbs, 10) || profile.targetMacros.carbs;
    const f = parseInt(editFat, 10) || profile.targetMacros.fat;

    setCalorieTarget(cals);
    setMacroTargets({ protein: p, carbs: c, fat: f });
    setTargetsSaved(true);
    setTimeout(() => setTargetsSaved(false), 2000);
  };

  const handleSaveApiKeys = () => {
    setApiKeys({
      geminiApiKey: geminiKeyInput.trim() || undefined,
      openaiApiKey: openaiKeyInput.trim() || undefined,
    });
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);
  };

  const handleResetAllDemo = () => {
    resetToDemo();
    resetToDemoPlan();
    setEditCalories(String(profile.targetCalories));
    setEditProtein(String(profile.targetMacros.protein));
    setEditCarbs(String(profile.targetMacros.carbs));
    setEditFat(String(profile.targetMacros.fat));
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header
        title="Student Profile"
        subtitle="Nutrition goals, BuckID balances & settings"
        showBuckeyeLeaf
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Card */}
        <Card variant="elevated" padding="md" style={styles.profileHeaderCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.scarlet }]}>
              <BuckeyeLeaf size={32} color={theme.white} />
            </View>
            <View style={styles.profileInfoCol}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{profile.name}</Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                {profile.email || 'buckeye.1@osu.edu'}
              </Text>
              <View style={styles.userBadgesRow}>
                <Badge
                  label={`${profile.streakDays}d Streak`}
                  variant="scarlet"
                  size="sm"
                  icon={<BuckeyeLeaf size={12} color={theme.scarlet} />}
                />
                <Badge
                  label={`${profile.powerScore} Power Score`}
                  variant="gold"
                  size="sm"
                  icon={<Award size={12} color={theme.goldDark} />}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Section 1: Fitness Goal Selector */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Fitness Goal</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Determines calorie scaling and macronutrient target distribution.
          </Text>
        </View>

        <View style={styles.goalsContainer}>
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = profile.fitnessGoal === goal.id;
            return (
              <Pressable
                key={goal.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && { borderColor: theme.scarlet, borderWidth: 2, backgroundColor: theme.scarletWash },
                ]}
                onPress={() => setFitnessGoal(goal.id)}
              >
                <View style={styles.goalHeaderRow}>
                  <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goal.label}</Text>
                  {isSelected && <Badge label="Active" variant="scarlet" size="sm" />}
                </View>
                <Text style={[styles.goalDesc, { color: theme.textSecondary }]}>{goal.desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Section 2: TDEE Calculator Assistance */}
        <Card variant="filled" padding="md" style={styles.tdeeCard}>
          <Pressable
            style={styles.tdeeToggleRow}
            onPress={() => setShowTdeeCalc((prev) => !prev)}
          >
            <View style={styles.tdeeTitleWithIcon}>
              <Calculator size={18} color={theme.scarlet} />
              <Text style={[styles.tdeeTitle, { color: theme.textPrimary }]}>
                TDEE & BMR Macro Calculator
              </Text>
            </View>
            <Badge
              label={showTdeeCalc ? 'Collapse' : 'Calculate'}
              variant="default"
              size="sm"
            />
          </Pressable>

          {showTdeeCalc && (
            <View style={styles.tdeeInputsContainer}>
              <Text style={[styles.tdeeHelpText, { color: theme.textSecondary }]}>
                Calculates your Basal Metabolic Rate using the Mifflin-St Jeor formula and activity adjustments.
              </Text>

              <View style={styles.inputsGrid}>
                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Weight (lbs)</Text>
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                    keyboardType="numeric"
                    value={calcWeight}
                    onChangeText={setCalcWeight}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Height (in)</Text>
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                    keyboardType="numeric"
                    value={calcHeight}
                    onChangeText={setCalcHeight}
                  />
                </View>

                <View style={styles.inputCol}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Age</Text>
                  <TextInput
                    style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                    keyboardType="numeric"
                    value={calcAge}
                    onChangeText={setCalcAge}
                  />
                </View>
              </View>

              {/* Sex Selector */}
              <View style={styles.sexRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Biological Sex:</Text>
                <View style={styles.sexButtonsGroup}>
                  {(['male', 'female'] as const).map((s) => (
                    <Pressable
                      key={s}
                      style={[
                        styles.sexButton,
                        { borderColor: theme.border },
                        calcSex === s && { backgroundColor: theme.scarlet, borderColor: theme.scarlet },
                      ]}
                      onPress={() => setCalcSex(s)}
                    >
                      <Text style={[styles.sexButtonText, { color: calcSex === s ? theme.textInverse : theme.textPrimary }]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Activity Level Selector */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                Campus Activity Level
              </Text>
              {(['sedentary', 'light', 'moderate', 'very_active'] as ActivityLevel[]).map((act) => (
                <Pressable
                  key={act}
                  style={[
                    styles.activityChoice,
                    { borderColor: theme.border },
                    calcActivity === act && { backgroundColor: theme.scarletWash, borderColor: theme.scarlet },
                  ]}
                  onPress={() => setCalcActivity(act)}
                >
                  <Text
                    style={[
                      styles.activityText,
                      { color: calcActivity === act ? theme.scarlet : theme.textPrimary },
                      calcActivity === act && { fontWeight: '700' },
                    ]}
                  >
                    {ACTIVITY_LABELS[act]}
                  </Text>
                </Pressable>
              ))}

              <Button
                label="Calculate TDEE & Macros"
                variant="primary"
                size="md"
                onPress={handleCalculateTdee}
                style={{ marginTop: spacing.sm }}
              />

              {tdeeResult && (
                <View style={[styles.tdeeResultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.tdeeResultHeader, { color: theme.textPrimary }]}>
                    TDEE Calculation Results
                  </Text>
                  <Text style={[styles.tdeeResultSub, { color: theme.textSecondary }]}>
                    BMR: {tdeeResult.bmr} kcal • TDEE: {tdeeResult.tdee} kcal
                  </Text>
                  <View style={styles.tdeeMacroSpecsRow}>
                    <Badge label={`${tdeeResult.targetCalories} kcal`} variant="scarlet" size="sm" />
                    <Badge label={`${tdeeResult.macros.protein}g Protein`} variant="dietary" size="sm" />
                    <Badge label={`${tdeeResult.macros.carbs}g Carbs`} variant="default" size="sm" />
                    <Badge label={`${tdeeResult.macros.fat}g Fat`} variant="default" size="sm" />
                  </View>
                  <Button
                    label="Apply Suggested Targets"
                    variant="outline"
                    size="sm"
                    onPress={handleApplyTdeeMacros}
                    style={{ marginTop: spacing.xs }}
                    icon={<Check size={14} color={theme.success} />}
                  />
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Section 3: Manual Targets Editor */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Macro Targets</Text>
        </View>

        <Card variant="elevated" padding="md" style={styles.targetsCard}>
          <View style={styles.targetsGrid}>
            <View style={styles.targetField}>
              <Text style={[styles.targetFieldLabel, { color: theme.textSecondary }]}>Calories (kcal)</Text>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                keyboardType="numeric"
                value={editCalories}
                onChangeText={setEditCalories}
              />
            </View>

            <View style={styles.targetField}>
              <Text style={[styles.targetFieldLabel, { color: theme.macros.protein }]}>Protein (g)</Text>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                keyboardType="numeric"
                value={editProtein}
                onChangeText={setEditProtein}
              />
            </View>

            <View style={styles.targetField}>
              <Text style={[styles.targetFieldLabel, { color: theme.macros.carbs }]}>Carbs (g)</Text>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                keyboardType="numeric"
                value={editCarbs}
                onChangeText={setEditCarbs}
              />
            </View>

            <View style={styles.targetField}>
              <Text style={[styles.targetFieldLabel, { color: theme.macros.fat }]}>Fat (g)</Text>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
                keyboardType="numeric"
                value={editFat}
                onChangeText={setEditFat}
              />
            </View>
          </View>

          <Button
            label={targetsSaved ? 'Targets Saved!' : 'Save Targets'}
            variant="outline"
            size="md"
            onPress={handleSaveManualTargets}
            style={{ marginTop: spacing.sm }}
            icon={targetsSaved ? <Check size={16} color={theme.success} /> : undefined}
          />
        </Card>

        {/* Section 4: BuckID Balances Manager */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>BuckID Campus Balances</Text>
        </View>

        <Card variant="elevated" padding="md" style={styles.balancesManagerCard}>
          {/* Swipes */}
          <View style={styles.balanceManageRow}>
            <View>
              <Text style={[styles.balanceManageTitle, { color: theme.textPrimary }]}>Traditions Swipes</Text>
              <Text style={[styles.balanceManageValue, { color: theme.scarlet }]}>
                {profile.balances.swipes} remaining
              </Text>
            </View>
            <View style={styles.balanceControlsRow}>
              <Pressable
                style={[styles.miniControlBtn, { borderColor: theme.border }]}
                onPress={() => deductSwipe(1)}
              >
                <Minus size={16} color={theme.textPrimary} />
              </Pressable>
              <Pressable
                style={[styles.miniControlBtn, { borderColor: theme.border }]}
                onPress={() => addSwipes(1)}
              >
                <Plus size={16} color={theme.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Dining Dollars */}
          <View style={[styles.balanceManageRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <View>
              <Text style={[styles.balanceManageTitle, { color: theme.textPrimary }]}>Dining Dollars (35% OFF)</Text>
              <Text style={[styles.balanceManageValue, { color: theme.success }]}>
                ${profile.balances.diningDollars.toFixed(2)}
              </Text>
            </View>
            <View style={styles.balanceControlsRow}>
              <Pressable
                style={[styles.miniControlBtn, { borderColor: theme.border }]}
                onPress={() => deductDiningDollars(10)}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>-10</Text>
              </Pressable>
              <Pressable
                style={[styles.miniControlBtn, { borderColor: theme.border }]}
                onPress={() => addDiningDollars(25)}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>+25</Text>
              </Pressable>
            </View>
          </View>

          {/* BuckID Cash */}
          <View style={[styles.balanceManageRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <View>
              <Text style={[styles.balanceManageTitle, { color: theme.textPrimary }]}>BuckID Cash</Text>
              <Text style={[styles.balanceManageValue, { color: theme.textPrimary }]}>
                ${profile.balances.buckidCash.toFixed(2)}
              </Text>
            </View>
            <View style={styles.balanceControlsRow}>
              <Pressable
                style={[styles.miniControlBtn, { borderColor: theme.border }]}
                onPress={() => deductBuckIDCash(10)}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>-10</Text>
              </Pressable>
              <Pressable
                style={[styles.miniControlBtn, { borderColor: theme.border }]}
                onPress={() => addBuckIDCash(25)}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>+25</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Section 5: Dietary Restrictions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Dietary Restrictions</Text>
        </View>

        <View style={styles.dietaryRow}>
          {DIETARY_OPTIONS.map((item) => {
            const isSelected = profile.dietaryRestrictions.includes(item.tag);
            return (
              <Pressable
                key={item.tag}
                style={[
                  styles.dietToggleChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && { backgroundColor: theme.scarlet, borderColor: theme.scarlet },
                ]}
                onPress={() => toggleDietaryRestriction(item.tag)}
              >
                <Text
                  style={[
                    styles.dietToggleChipText,
                    { color: isSelected ? theme.textInverse : theme.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Section 6: API Keys Configuration */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>BrutusAI Keys</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Stored locally on your device. Offline heuristic works without any key!
          </Text>
        </View>

        <Card variant="elevated" padding="md" style={styles.apiKeysCard}>
          {/* Gemini */}
          <View style={styles.apiKeyField}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Google Gemini API Key</Text>
            <View style={[styles.keyInputWrapper, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.keyTextInput, { color: theme.textPrimary }]}
                placeholder="AIzaSy..."
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showGeminiKey}
                value={geminiKeyInput}
                onChangeText={setGeminiKeyInput}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowGeminiKey((p) => !p)} style={styles.eyeBtn}>
                {showGeminiKey ? <EyeOff size={16} color={theme.textSecondary} /> : <Eye size={16} color={theme.textSecondary} />}
              </Pressable>
            </View>
          </View>

          {/* OpenAI */}
          <View style={styles.apiKeyField}>
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>OpenAI API Key (Optional)</Text>
            <View style={[styles.keyInputWrapper, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.keyTextInput, { color: theme.textPrimary }]}
                placeholder="sk-..."
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showOpenaiKey}
                value={openaiKeyInput}
                onChangeText={setOpenaiKeyInput}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowOpenaiKey((p) => !p)} style={styles.eyeBtn}>
                {showOpenaiKey ? <EyeOff size={16} color={theme.textSecondary} /> : <Eye size={16} color={theme.textSecondary} />}
              </Pressable>
            </View>
          </View>

          <Button
            label={keysSaved ? 'API Keys Saved!' : 'Save Keys'}
            variant="outline"
            size="md"
            onPress={handleSaveApiKeys}
            icon={keysSaved ? <Check size={16} color={theme.success} /> : <Key size={16} color={theme.scarlet} />}
          />
        </Card>

        {/* Section 7: Appearance & Theme Mode */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Appearance</Text>
        </View>

        <Card variant="filled" padding="md" style={styles.themeCard}>
          <View style={styles.themeOptionsRow}>
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const isSelected = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.themeModeBtn,
                    { borderColor: theme.border },
                    isSelected && { backgroundColor: theme.scarlet, borderColor: theme.scarlet },
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  {mode === 'light' ? (
                    <Sun size={16} color={isSelected ? theme.textInverse : theme.textPrimary} />
                  ) : mode === 'dark' ? (
                    <Moon size={16} color={isSelected ? theme.textInverse : theme.textPrimary} />
                  ) : (
                    <Sparkles size={16} color={isSelected ? theme.textInverse : theme.textPrimary} />
                  )}
                  <Text style={[styles.themeModeText, { color: isSelected ? theme.textInverse : theme.textPrimary }]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Reset Demo State Button */}
        <View style={styles.resetContainer}>
          <Button
            label="Reset Demo Profile (Brutus the Buckeye)"
            variant="outline"
            size="md"
            onPress={handleResetAllDemo}
            icon={<RotateCcw size={16} color={theme.scarlet} />}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileHeaderCard: {
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: typography.fontSizes.xs,
    marginBottom: 4,
  },
  userBadgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  goalsContainer: {
    gap: spacing.xs,
  },
  goalCard: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  goalTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  goalDesc: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 16,
  },
  tdeeCard: {
    marginVertical: spacing.sm,
  },
  tdeeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tdeeTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tdeeTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  tdeeInputsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  tdeeHelpText: {
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    height: 38,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    fontSize: typography.fontSizes.sm,
  },
  sexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  sexButtonsGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sexButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  sexButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityChoice: {
    padding: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginVertical: 2,
  },
  activityText: {
    fontSize: typography.fontSizes.xs,
  },
  tdeeResultCard: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  tdeeResultHeader: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  tdeeResultSub: {
    fontSize: typography.fontSizes.xs,
    marginVertical: 2,
  },
  tdeeMacroSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  targetsCard: {
    marginVertical: spacing.xs,
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  targetField: {
    width: '48%',
  },
  targetFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  balancesManagerCard: {
    marginVertical: spacing.xs,
  },
  balanceManageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  balanceManageTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
  },
  balanceManageValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
    marginTop: 2,
  },
  balanceControlsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  miniControlBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dietaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  dietToggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  dietToggleChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  apiKeysCard: {
    marginVertical: spacing.xs,
  },
  apiKeyField: {
    marginBottom: spacing.sm,
  },
  keyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    marginTop: 4,
  },
  keyTextInput: {
    flex: 1,
    height: 38,
    fontSize: typography.fontSizes.sm,
  },
  eyeBtn: {
    padding: 6,
  },
  themeCard: {
    marginVertical: spacing.xs,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  themeModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  themeModeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  resetContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
});
