/**
 * BuckeyeGrub BuckID Dining Dollar 35% Discount Calculator Modal Sheet
 * Allows Ohio State students to input any food item retail price and calculate
 * their instant 35% discount, dollar savings, and balance purchasing power.
 */

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calculator,
  DollarSign,
  Sparkles,
  TrendingUp,
  Wallet,
  ArrowRight,
} from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { ModalHeader } from '@/src/components/ui/ModalHeader';
import { useTheme } from '@/src/context/ThemeContext';
import { useUserStore } from '@/src/store/useUserStore';
import {
  calculateDiningDollarDiscount,
  calculateDiningDollarSavings,
  calculatePurchasingPower,
} from '@/src/utils/diningDiscount';
import { radii, spacing, typography } from '@/src/constants/theme';
import { hapticLight, hapticSelection } from '@/src/utils/haptics';

export default function DiscountCalculatorModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ venueId?: string; price?: string }>();
  const { theme } = useTheme();
  const { profile } = useUserStore();

  const initialPrice = params.price ? parseFloat(params.price) : 12.0;
  const [priceInput, setPriceInput] = useState(
    !isNaN(initialPrice) && initialPrice > 0 ? initialPrice.toFixed(2) : '12.00'
  );

  const numericPrice = parseFloat(priceInput) || 0;

  const discountedPrice = useMemo(
    () => calculateDiningDollarDiscount(numericPrice),
    [numericPrice]
  );
  const savings = useMemo(
    () => calculateDiningDollarSavings(numericPrice),
    [numericPrice]
  );
  const balanceAfter = useMemo(
    () => Math.max(0, profile.balances.diningDollars - discountedPrice),
    [profile.balances.diningDollars, discountedPrice]
  );
  const totalPurchasingPower = useMemo(
    () => calculatePurchasingPower(profile.balances.diningDollars),
    [profile.balances.diningDollars]
  );

  const handleClose = async () => {
    await hapticLight();
    router.back();
  };

  const handlePresetSelect = async (amount: number) => {
    await hapticSelection();
    setPriceInput(amount.toFixed(2));
  };

  const presets = [
    { label: '$5.50 Snack', val: 5.5 },
    { label: '$8.50 Berry Cafe', val: 8.5 },
    { label: '$12.00 Curl Bowl', val: 12.0 },
    { label: '$16.00 Union Grill', val: 16.0 },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      <ModalHeader
        title="Dining Dollar 35% Calculator"
        icon={<Calculator size={22} color={theme.success} />}
        onClose={handleClose}
        accessibilityLabel="Close discount calculator"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Retail Price Input Card */}
        <Card variant="elevated" padding="md" style={styles.inputCard}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
            Enter Retail Menu Price (USD)
          </Text>
          <View
            style={[
              styles.inputRow,
              { backgroundColor: theme.surfaceHover, borderColor: theme.border },
            ]}
          >
            <DollarSign size={20} color={theme.textSecondary} />
            <TextInput
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              style={[styles.numericInput, { color: theme.textPrimary }]}
              maxLength={8}
            />
          </View>

          {/* Preset Buttons */}
          <Text style={[styles.presetsLabel, { color: theme.textSecondary }]}>
            Quick Campus Presets:
          </Text>
          <View style={styles.presetChipsRow}>
            {presets.map((preset) => (
              <Pressable
                key={preset.label}
                onPress={() => handlePresetSelect(preset.val)}
                style={({ pressed }) => [
                  styles.presetChip,
                  {
                    backgroundColor:
                      numericPrice === preset.val ? theme.scarletWash : theme.surfaceHover,
                    borderColor:
                      numericPrice === preset.val ? theme.scarlet : theme.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    {
                      color:
                        numericPrice === preset.val ? theme.scarlet : theme.textPrimary,
                    },
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Calculation Result Callout Card */}
        <Card variant="elevated" padding="lg" style={styles.resultsCard}>
          <View style={styles.discountBadgeHeader}>
            <Badge
              label="Automatic 35% OSU Discount"
              variant="paymentDiningDollars"
              size="md"
              icon={<Sparkles size={14} color={theme.success} />}
            />
          </View>

          <View style={styles.comparisonRow}>
            {/* Retail Cost */}
            <View style={styles.compCol}>
              <Text style={[styles.compLabel, { color: theme.textSecondary }]}>
                Retail Price
              </Text>
              <Text
                style={[
                  styles.retailStrikethrough,
                  { color: theme.textSecondary },
                ]}
              >
                ${numericPrice.toFixed(2)}
              </Text>
              <Text style={[styles.compNote, { color: theme.textSecondary }]}>
                Cash / Credit
              </Text>
            </View>

            <ArrowRight size={22} color={theme.textSecondary} />

            {/* Dining Dollar Cost */}
            <View style={styles.compCol}>
              <Text style={[styles.compLabel, { color: theme.textSecondary }]}>
                With Dining $
              </Text>
              <Text style={[styles.discountedBigPrice, { color: theme.success }]}>
                ${discountedPrice.toFixed(2)}
              </Text>
              <Text style={[styles.compNote, { color: theme.success }]}>
                35% Discount Applied
              </Text>
            </View>
          </View>

          {/* Savings Highlight Bar */}
          <View
            style={[
              styles.savingsHighlightBar,
              { backgroundColor: theme.savingsWash, borderColor: theme.success },
            ]}
          >
            <View style={styles.savingsIconWrapper}>
              <TrendingUp size={20} color={theme.success} />
            </View>
            <View>
              <Text style={[styles.savingsTitle, { color: theme.success }]}>
                You Save ${savings.toFixed(2)} (35%)
              </Text>
              <Text style={[styles.savingsSub, { color: theme.textSecondary }]}>
                Instant savings retained in your BuckID account!
              </Text>
            </View>
          </View>
        </Card>

        {/* BuckID Account Purchasing Power */}
        <Card variant="filled" padding="md" style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Wallet size={18} color={theme.scarlet} />
            <Text style={[styles.walletTitle, { color: theme.textPrimary }]}>
              BuckID Purchasing Power
            </Text>
          </View>

          <View style={styles.walletMetricsRow}>
            <View style={styles.walletMetric}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Dining $ Balance
              </Text>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                ${profile.balances.diningDollars.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.walletDivider, { backgroundColor: theme.border }]} />

            <View style={styles.walletMetric}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                After Purchase
              </Text>
              <Text style={[styles.metricValue, { color: theme.success }]}>
                ${balanceAfter.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.walletDivider, { backgroundColor: theme.border }]} />

            <View style={styles.walletMetric}>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                Retail Power
              </Text>
              <Text style={[styles.metricValue, { color: theme.scarlet }]}>
                ${totalPurchasingPower.toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={[styles.purchasingPowerExplainer, { color: theme.textSecondary }]}>
            💡 Because Dining Dollars give 35% off, your ${profile.balances.diningDollars.toFixed(2)} balance
            actually buys ${totalPurchasingPower.toFixed(2)} worth of retail cafe food!
          </Text>
        </Card>

        {/* Brutus Smart Budgeting Tip */}
        <Card variant="elevated" padding="md" style={[styles.brutusCard, { borderLeftColor: theme.gold }]}>
          <View style={styles.brutusHeader}>
            <Sparkles size={16} color={theme.goldDark} />
            <Text style={[styles.brutusTitle, { color: theme.textPrimary }]}>
              Brutus's Dining Rule of Thumb
            </Text>
          </View>
          <Text style={[styles.brutusBody, { color: theme.textSecondary }]}>
            Use Traditions Swipes at Scott, Kennedy, and Morrill for unlimited volume and buffet carbs.
            Save your Dining Dollars exclusively for Curl Market, Berry Cafe, and 12th Ave Bread Co where that 35% discount doubles down your value!
          </Text>
        </Card>

        {/* Dismiss Button */}
        <Button
          label="Done"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleClose}
          style={styles.actionBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  inputCard: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  numericInput: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  presetsLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  resultsCard: {
    marginBottom: spacing.md,
  },
  discountBadgeHeader: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: spacing.sm,
  },
  compCol: {
    alignItems: 'center',
  },
  compLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  retailStrikethrough: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textDecorationLine: 'line-through',
  },
  discountedBigPrice: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
  },
  compNote: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    marginTop: 2,
  },
  savingsHighlightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  savingsIconWrapper: {
    marginRight: spacing.sm,
  },
  savingsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  savingsSub: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  walletCard: {
    marginBottom: spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  walletTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  walletMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  walletMetric: {
    alignItems: 'center',
    flex: 1,
  },
  walletDivider: {
    width: 1,
    height: 32,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  purchasingPowerExplainer: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs + 2,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  brutusCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  brutusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  brutusTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  brutusBody: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs + 3,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
});
