/**
 * BuckeyeGrub BuckID Financial Intelligence & 35% Dining Dollar Discount Engine
 *
 * Ohio State dining policies:
 * - Dining Dollars provide an automatic 35% discount on food purchases at all campus retail dining locations
 *   (e.g., Curl Market, Union Market, Berry Cafe, 12th Ave Bread Co, Marketplace on Neil, Woody's, PAD).
 * - Therefore, a $10.00 retail item costs only $6.50 when paying with Dining Dollars ($3.50 savings).
 * - Effective Purchasing Power multiplier is 1 / 0.65 ~= 1.5385x.
 *   ($250.00 in Dining Dollars buys $384.62 in retail food!).
 */

/**
 * Calculates the discounted price when paying with Dining Dollars (35% OFF).
 * @param retailPrice Standard retail cash/credit price.
 * @returns Discounted price in USD, rounded to 2 decimal places.
 */
export function calculateDiningDollarDiscount(retailPrice: number): number {
  if (retailPrice <= 0) return 0;
  return Math.round(retailPrice * 0.65 * 100) / 100;
}

/**
 * Calculates the exact dollar savings achieved using Dining Dollars (35% savings).
 * @param retailPrice Standard retail cash/credit price.
 * @returns Dollar savings in USD, rounded to 2 decimal places.
 */
export function calculateDiningDollarSavings(retailPrice: number): number {
  if (retailPrice <= 0) return 0;
  return Math.round(retailPrice * 0.35 * 100) / 100;
}

/**
 * Calculates the total purchasing power in retail food value given a Dining Dollar balance.
 * $100.00 in Dining Dollars / 0.65 = $153.85 in retail food purchasing power.
 * @param diningDollars Current Dining Dollar balance.
 * @returns Purchasing power in retail USD, rounded to 2 decimal places.
 */
export function calculatePurchasingPower(diningDollars: number): number {
  if (diningDollars <= 0) return 0;
  return Math.round((diningDollars / 0.65) * 100) / 100;
}

export interface DiningDollarPriceSummary {
  retailPrice: number;
  discountedPrice: number;
  savings: number;
  savingsPercentage: number;
}

/**
 * Generates an itemized discount and savings summary for a given retail price.
 */
export function getDiningDollarPriceSummary(retailPrice: number): DiningDollarPriceSummary {
  const safeRetail = Math.max(0, retailPrice);
  const discountedPrice = calculateDiningDollarDiscount(safeRetail);
  const savings = calculateDiningDollarSavings(safeRetail);

  return {
    retailPrice: Math.round(safeRetail * 100) / 100,
    discountedPrice,
    savings,
    savingsPercentage: 35,
  };
}

export interface PlanFinancialSavings {
  totalRetailPrice: number;
  totalDiningDollarPrice: number;
  totalSavings: number;
  itemCount: number;
}

/**
 * Calculates aggregate retail price, Dining Dollar cost, and total savings
 * across a list of items (e.g. daily planned meals).
 */
export function calculateItemsFinancialSavings(
  items: Array<{ price?: number }>
): PlanFinancialSavings {
  let totalRetailPrice = 0;
  let totalDiningDollarPrice = 0;
  let totalSavings = 0;
  let itemCount = 0;

  for (const item of items) {
    if (typeof item.price === 'number' && item.price > 0) {
      itemCount++;
      totalRetailPrice += item.price;
      const discounted = calculateDiningDollarDiscount(item.price);
      totalDiningDollarPrice += discounted;
      totalSavings += calculateDiningDollarSavings(item.price);
    }
  }

  return {
    totalRetailPrice: Math.round(totalRetailPrice * 100) / 100,
    totalDiningDollarPrice: Math.round(totalDiningDollarPrice * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    itemCount,
  };
}
