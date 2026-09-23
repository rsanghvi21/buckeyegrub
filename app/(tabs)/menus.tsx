import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  MapPin,
  Plus,
  Search,
  Utensils,
  X,
} from 'lucide-react-native';
import { Header } from '@/src/components/navigation/Header';
import { Badge, Button, Card } from '@/src/components/ui';
import { DiningDollarBadge } from '@/src/components/dining/DiningDollarBadge';
import { radii, spacing, typography } from '@/src/constants/theme';
import { useTheme } from '@/src/context';
import { OSU_MENU_ITEMS_BY_VENUE, OSU_MENU_ITEMS_MAP, OSU_VENUES } from '@/src/data';
import { useDiningStore, useMealPlanStore } from '@/src/store';
import { CampusZone, PaymentType, calculateDiningDollarDiscount } from '@/src/types/dining';
import { DIETARY_TAG_OPTIONS, DietaryTag } from '@/src/constants/theme';
import { MealSlotType } from '@/src/types/mealPlan';

export default function MenusScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    selectedZone,
    setZone,
    selectedPayment,
    setPaymentType,
    searchQuery,
    setSearchQuery,
    selectedDietaryTags,
    toggleDietaryTag,
  } = useDiningStore();

  const { addItemToSlot } = useMealPlanStore();

  // Expanded venue cards map
  const [expandedVenues, setExpandedVenues] = useState<Record<string, boolean>>({
    'traditions-at-scott': true, // Scott expanded by default
  });

  // Slot selector modal state for quick adding
  const [addingItem, setAddingItem] = useState<{ id: string; name: string } | null>(null);

  const toggleVenueExpanded = (venueId: string) => {
    setExpandedVenues((prev) => ({
      ...prev,
      [venueId]: !prev[venueId],
    }));
  };

  // Filtered venues & items calculation
  const filteredVenuesWithItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return OSU_VENUES.filter((venue) => {
      // Zone match
      if (selectedZone !== 'All' && venue.zone !== selectedZone) {
        return false;
      }

      // Payment match
      if (selectedPayment !== 'All') {
        if (!venue.acceptedPayments.includes(selectedPayment as PaymentType)) {
          return false;
        }
      }

      // Venue items
      const venueItems = OSU_MENU_ITEMS_BY_VENUE[venue.id] || [];

      // Dietary tags match
      let matchingItems = venueItems;
      if (selectedDietaryTags.length > 0) {
        matchingItems = matchingItems.filter((item) =>
          selectedDietaryTags.every((tag) => item.dietaryTags.includes(tag))
        );
      }

      // Search query match (venue name or item name)
      if (query) {
        const venueMatches = venue.name.toLowerCase().includes(query) ||
          venue.shortName.toLowerCase().includes(query) ||
          venue.address.toLowerCase().includes(query);

        const hasMatchingItem = matchingItems.some((item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.station && item.station.toLowerCase().includes(query))
        );

        return venueMatches || hasMatchingItem;
      }

      return true;
    }).map((venue) => {
      let venueItems = OSU_MENU_ITEMS_BY_VENUE[venue.id] || [];
      if (selectedDietaryTags.length > 0) {
        venueItems = venueItems.filter((item) =>
          selectedDietaryTags.every((tag) => item.dietaryTags.includes(tag))
        );
      }
      if (query) {
        venueItems = venueItems.filter((item) =>
          item.name.toLowerCase().includes(query) ||
          venue.name.toLowerCase().includes(query)
        );
      }
      return { venue, items: venueItems };
    });
  }, [selectedZone, selectedPayment, searchQuery, selectedDietaryTags]);

  const handleQuickAdd = (item: typeof OSU_MENU_ITEMS_BY_VENUE[string][number], slot: MealSlotType) => {
    addItemToSlot(slot, item, 1);
    setAddingItem(null);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header
        title="Campus Dining Menus"
        subtitle="10+ OSU locations, live macros & Grubhub"
        showBuckeyeLeaf
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Bar */}
        <View style={[styles.searchBarContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search chicken, salads, bowls, or Scott..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Campus Zone Filter Pills */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterHeading, { color: theme.textSecondary }]}>CAMPUS ZONE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {(['All', 'North', 'South', 'West'] as const).map((zone) => {
              const isSelected = selectedZone === zone;
              return (
                <Pressable
                  key={zone}
                  style={[
                    styles.pillButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.scarlet, borderColor: theme.scarlet },
                  ]}
                  onPress={() => setZone(zone)}
                >
                  <Text style={[styles.pillText, { color: isSelected ? theme.textInverse : theme.textPrimary }]}>
                    {zone === 'All' ? 'All Zones' : `${zone} Campus`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Payment Filter Pills */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterHeading, { color: theme.textSecondary }]}>PAYMENT ACCEPTED</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {[
              { key: 'All', label: 'All Payments' },
              { key: 'swipe', label: 'Traditions Swipe' },
              { key: 'dining_dollars', label: 'Dining Dollars (35% OFF)' },
            ].map(({ key, label }) => {
              const isSelected = selectedPayment === key;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.pillButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.scarlet, borderColor: theme.scarlet },
                  ]}
                  onPress={() => setPaymentType(key as PaymentType | 'All')}
                >
                  <Text style={[styles.pillText, { color: isSelected ? theme.textInverse : theme.textPrimary }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Dietary Tag Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterHeading, { color: theme.textSecondary }]}>DIETARY RESTRICTIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {DIETARY_TAG_OPTIONS.map(({ tag, label }) => {
              const isSelected = selectedDietaryTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[
                    styles.dietChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.scarletWash, borderColor: theme.scarlet },
                  ]}
                  onPress={() => toggleDietaryTag(tag)}
                >
                  <Text
                    style={[
                      styles.dietChipText,
                      { color: isSelected ? theme.scarlet : theme.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Counter */}
        <View style={styles.counterRow}>
          <Text style={[styles.counterText, { color: theme.textSecondary }]}>
            Showing {filteredVenuesWithItems.length} locations
          </Text>
        </View>

        {/* Venue Cards List */}
        {filteredVenuesWithItems.map(({ venue, items }) => {
          const isExpanded = !!expandedVenues[venue.id];
          return (
            <Card key={venue.id} variant="elevated" padding="md" style={styles.venueCard}>
              {/* Venue Header */}
              <Pressable
                style={styles.venueHeaderPressable}
                onPress={() => toggleVenueExpanded(venue.id)}
              >
                <View style={styles.venueTitleRow}>
                  <View style={styles.venueTitleCol}>
                    <Text style={[styles.venueName, { color: theme.textPrimary }]}>{venue.name}</Text>
                    <View style={styles.venueSubRow}>
                      <MapPin size={12} color={theme.textSecondary} />
                      <Text style={[styles.venueZone, { color: theme.textSecondary }]}>
                        {venue.zone} Campus • {items.length} items
                      </Text>
                    </View>
                  </View>
                  <View style={styles.venueExpandIcon}>
                    {isExpanded ? (
                      <ChevronUp size={20} color={theme.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={theme.textSecondary} />
                    )}
                  </View>
                </View>

                {/* Venue Badges Row */}
                <View style={styles.venueBadgesRow}>
                  {venue.acceptedPayments.includes('swipe') && (
                    <Badge label="Swipe Eligible" variant="paymentSwipe" size="sm" />
                  )}
                  {venue.acceptedPayments.includes('dining_dollars') && (
                    <DiningDollarBadge
                      venueId={venue.id}
                      label="35% Off Dining $"
                      size="sm"
                    />
                  )}
                  {venue.hasMobileOrdering && (
                    <Badge label="Grubhub Mobile" variant="default" size="sm" />
                  )}
                </View>
              </Pressable>

              {/* Grubhub Order Shortcut */}
              <View style={styles.venueActionsRow}>
                {venue.hasMobileOrdering && (
                  <Button
                    label="Order on Grubhub"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: '/modal/grubhub-assistant' as any,
                        params: { venueId: venue.id },
                      } as any)
                    }
                    icon={<ExternalLink size={14} color={theme.scarlet} />}
                  />
                )}
                <Button
                  label={isExpanded ? 'Hide Items' : 'View Menu'}
                  variant="outline"
                  size="sm"
                  onPress={() => toggleVenueExpanded(venue.id)}
                />
              </View>

              {/* Expandable Menu Items List */}
              {isExpanded && (
                <View style={[styles.itemsAccordion, { borderTopColor: theme.border }]}>
                  {items.length === 0 ? (
                    <Text style={[styles.emptyItemsText, { color: theme.textSecondary }]}>
                      No items matched the active search and dietary filters.
                    </Text>
                  ) : (
                    items.map((item) => {
                      const discountedPrice = calculateDiningDollarDiscount(item.price);
                      return (
                        <View
                          key={item.id}
                          style={[styles.itemCard, { borderBottomColor: theme.border }]}
                        >
                          <Pressable
                            style={styles.itemMainPressable}
                            onPress={() =>
                              router.push({
                                pathname: '/modal/meal-details' as any,
                                params: { itemId: item.id },
                              } as any)
                            }
                          >
                            <View style={styles.itemHeader}>
                              <Text style={[styles.itemName, { color: theme.textPrimary }]}>
                                {item.name}
                              </Text>
                              <Text style={[styles.itemPrice, { color: theme.textPrimary }]}>
                                ${item.price.toFixed(2)}
                              </Text>
                            </View>

                            {/* Dining Dollar 35% Discount Callout */}
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/modal/discount-calculator' as any,
                                  params: { venueId: venue.id, price: String(item.price) },
                                } as any)
                              }
                              style={({ pressed }) => pressed && { opacity: 0.7 }}
                              accessibilityLabel={`Dining Dollars price: $${discountedPrice.toFixed(2)}. Tap to open discount calculator.`}
                            >
                              <Text style={[styles.discountNote, { color: theme.success }]}>
                                Dining $: ${discountedPrice.toFixed(2)} (35% OFF)
                              </Text>
                            </Pressable>

                            {item.description ? (
                              <Text style={[styles.itemDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                                {item.description}
                              </Text>
                            ) : null}

                            {/* Macro Badges Row */}
                            <View style={styles.itemMacrosRow}>
                              <Badge label={`${item.calories} kcal`} variant="scarlet" size="sm" />
                              <Badge label={`${item.macros.protein}g Protein`} variant="dietary" size="sm" />
                              <Badge label={`${item.macros.carbs}g Carbs`} variant="default" size="sm" />
                              <Badge label={`${item.macros.fat}g Fat`} variant="default" size="sm" />
                            </View>
                          </Pressable>

                          {/* Quick Add Button */}
                          <Pressable
                            style={[styles.quickAddBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => setAddingItem({ id: item.id, name: item.name })}
                          >
                            <Plus size={16} color={theme.scarlet} />
                          </Pressable>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Quick Add Meal Slot Picker Overlay */}
      {addingItem && (
        <View style={styles.slotPickerModalOverlay}>
          <View style={[styles.slotPickerCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.slotPickerTitle, { color: theme.textPrimary }]}>Add to Today's Plan</Text>
            <Text style={[styles.slotPickerItemName, { color: theme.scarlet }]}>{addingItem.name}</Text>
            <Text style={[styles.slotPickerSubtitle, { color: theme.textSecondary }]}>Select a meal slot:</Text>

            <View style={styles.slotPickerButtonsRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlotType[]).map((slot) => (
                <Button
                  key={slot}
                  label={slot.charAt(0).toUpperCase() + slot.slice(1)}
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    const item = OSU_MENU_ITEMS_MAP[addingItem.id];
                    if (item) {
                      handleQuickAdd(item, slot);
                    }
                  }}
                />
              ))}
            </View>

            <Button
              label="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setAddingItem(null)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      )}
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
  },
  filterSection: {
    marginBottom: spacing.xs,
  },
  filterHeading: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pillsRow: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  pillButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: '600',
  },
  dietChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  dietChipText: {
    fontSize: 11,
  },
  counterRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  counterText: {
    fontSize: typography.fontSizes.xs,
  },
  venueCard: {
    marginVertical: spacing.xs,
  },
  venueHeaderPressable: {
    paddingBottom: spacing.xs,
  },
  venueTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueTitleCol: {
    flex: 1,
  },
  venueName: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  venueSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  venueZone: {
    fontSize: typography.fontSizes.xs,
  },
  venueExpandIcon: {
    padding: 4,
  },
  venueBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  venueActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  itemsAccordion: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyItemsText: {
    fontSize: typography.fontSizes.xs,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  itemMainPressable: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  itemPrice: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
  },
  discountNote: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  itemDesc: {
    fontSize: typography.fontSizes.xs,
    marginVertical: 2,
  },
  itemMacrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPickerModalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  slotPickerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  slotPickerTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: '700',
  },
  slotPickerItemName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    marginVertical: spacing.xs,
    textAlign: 'center',
  },
  slotPickerSubtitle: {
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.md,
  },
  slotPickerButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
});
