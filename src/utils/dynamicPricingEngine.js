/**
 * PlateFlow Dynamic Surge / Happy-Hour Pricing Engine
 * Connection: Predictive Prep (I) → Dynamic Pricing (J) → Updates Menu Prices (A)
 *
 * Time-of-day pricing rules: off-peak discounts, rush-hour surcharges,
 * and happy-hour promotional rates that sync live with Dish Explorer.
 */

export const PRICING_STORAGE_KEY = 'plateflow-dynamic-pricing';

export const PRICING_MODES = {
  STANDARD:   { id: 'standard',   label: 'Standard Pricing',    icon: '💰', multiplier: 1.00, description: 'Regular menu rates' },
  HAPPY_HOUR: { id: 'happy_hour', label: 'Happy Hour (15% OFF)', icon: '🎉', multiplier: 0.85, description: 'Off-peak promotional pricing for 3 PM – 6 PM' },
  SURGE:      { id: 'surge',      label: 'Peak Surge (+12%)',    icon: '🔥', multiplier: 1.12, description: 'High demand surcharge during 7 PM – 9 PM dinner rush' },
  EARLY_BIRD: { id: 'early_bird', label: 'Early Bird (10% OFF)', icon: '🌅', multiplier: 0.90, description: 'Morning discount for 8 AM – 10 AM breakfast crowd' },
  LATE_NIGHT: { id: 'late_night', label: 'Late Night (+8%)',     icon: '🌙', multiplier: 1.08, description: 'Extended kitchen premium after 10 PM' },
};

/**
 * Time-based pricing schedule
 * Maps hour ranges to pricing modes
 */
export const PRICING_SCHEDULE = [
  { startHour: 8,  endHour: 10, mode: 'early_bird' },
  { startHour: 10, endHour: 15, mode: 'standard'   },
  { startHour: 15, endHour: 18, mode: 'happy_hour'  },
  { startHour: 18, endHour: 19, mode: 'standard'    },
  { startHour: 19, endHour: 21, mode: 'surge'       },
  { startHour: 21, endHour: 22, mode: 'standard'    },
  { startHour: 22, endHour: 24, mode: 'late_night'  },
];

/**
 * Get the saved pricing config (manual override or auto mode)
 */
export function getPricingConfig() {
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY);
    if (!raw) return { autoMode: true, manualOverride: null };
    return JSON.parse(raw);
  } catch {
    return { autoMode: true, manualOverride: null };
  }
}

/**
 * Save pricing config to localStorage
 */
export function savePricingConfig(config) {
  localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('plateflow-pricing-updated'));
}

/**
 * Determine the active pricing mode based on current hour
 */
export function getAutoPricingMode(hourOverride = null) {
  const hour = hourOverride !== null ? hourOverride : new Date().getHours();

  for (const rule of PRICING_SCHEDULE) {
    if (hour >= rule.startHour && hour < rule.endHour) {
      return PRICING_MODES[rule.mode.toUpperCase()] || PRICING_MODES.STANDARD;
    }
  }
  return PRICING_MODES.STANDARD;
}

/**
 * Get the current active pricing mode (respects manual override)
 */
export function getActivePricingMode() {
  const config = getPricingConfig();
  if (!config.autoMode && config.manualOverride) {
    return PRICING_MODES[config.manualOverride.toUpperCase()] || PRICING_MODES.STANDARD;
  }
  return getAutoPricingMode();
}

/**
 * Apply dynamic pricing to a base price
 */
export function applyDynamicPrice(basePrice, modeOverride = null) {
  const mode = modeOverride ? (PRICING_MODES[modeOverride.toUpperCase()] || PRICING_MODES.STANDARD) : getActivePricingMode();
  return Math.round(basePrice * mode.multiplier);
}

/**
 * Apply dynamic pricing to entire dish array
 * Returns new array with adjusted prices and original base prices preserved
 */
export function applyDynamicPricingToDishes(dishes, modeOverride = null) {
  const mode = modeOverride ? (PRICING_MODES[modeOverride.toUpperCase()] || PRICING_MODES.STANDARD) : getActivePricingMode();

  return dishes.map((dish) => ({
    ...dish,
    basePrice: dish.basePrice || dish.price,
    price: Math.round((dish.basePrice || dish.price) * mode.multiplier),
    pricingMode: mode.id,
    pricingLabel: mode.label,
  }));
}

/**
 * Format the pricing change for display
 * Returns { delta, label, isDiscount }
 */
export function formatPricingDelta(basePrice, currentPrice) {
  const diff = currentPrice - basePrice;
  if (diff === 0) return { delta: 0, label: 'Standard', isDiscount: false };
  if (diff < 0) return { delta: diff, label: `₹${Math.abs(diff)} OFF`, isDiscount: true };
  return { delta: diff, label: `+₹${diff} Surge`, isDiscount: false };
}

/**
 * Get a human-readable description of the next pricing window change
 */
export function getNextPricingChange() {
  const currentHour = new Date().getHours();
  const currentMode = getAutoPricingMode();

  for (const rule of PRICING_SCHEDULE) {
    if (rule.startHour > currentHour) {
      const nextMode = PRICING_MODES[rule.mode.toUpperCase()] || PRICING_MODES.STANDARD;
      if (nextMode.id !== currentMode.id) {
        return {
          startsAt: `${rule.startHour > 12 ? rule.startHour - 12 : rule.startHour}:00 ${rule.startHour >= 12 ? 'PM' : 'AM'}`,
          mode: nextMode,
          hoursUntil: rule.startHour - currentHour,
        };
      }
    }
  }
  return null;
}
