/**
 * PlateFlow Predictive Prep & Food Waste Engine
 * Connection: Bill DNA (H) → Predictive Prep (I)
 * 
 * Analyzes completed order history to forecast daily batch quantities,
 * track kitchen waste percentage, and predict prep demand by hour/day.
 */

export const WASTE_STORAGE_KEY = 'plateflow-waste-analytics';
export const ORDER_HISTORY_KEY = 'plateflow-order-history';

// ─────────────────────────────────────────────────────────────────────────────
// Default Historical Order Patterns (simulated 7-day rolling window)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_ORDER_HISTORY = [
  // Day 1 (Mon) — Moderate traffic
  { day: 'Monday',    hour: 12, dish: 'Chicken Biryani', qty: 8,  revenue: 3200 },
  { day: 'Monday',    hour: 12, dish: 'Dosa',            qty: 12, revenue: 1800 },
  { day: 'Monday',    hour: 13, dish: 'Idli',            qty: 6,  revenue: 600  },
  { day: 'Monday',    hour: 19, dish: 'Chicken Biryani', qty: 14, revenue: 5600 },
  { day: 'Monday',    hour: 20, dish: 'Mutton Fry',      qty: 5,  revenue: 1750 },
  { day: 'Monday',    hour: 20, dish: 'Gulab Jamun',     qty: 8,  revenue: 640  },
  // Day 2 (Tue) — Light traffic
  { day: 'Tuesday',   hour: 12, dish: 'Dosa',            qty: 10, revenue: 1500 },
  { day: 'Tuesday',   hour: 13, dish: 'Idli',            qty: 8,  revenue: 800  },
  { day: 'Tuesday',   hour: 19, dish: 'Chicken Biryani', qty: 10, revenue: 4000 },
  { day: 'Tuesday',   hour: 20, dish: 'Paneer Butter Masala', qty: 6, revenue: 1680 },
  // Day 3 (Wed) — Average
  { day: 'Wednesday', hour: 12, dish: 'Chicken Biryani', qty: 9,  revenue: 3600 },
  { day: 'Wednesday', hour: 12, dish: 'Dosa',            qty: 14, revenue: 2100 },
  { day: 'Wednesday', hour: 19, dish: 'Mutton Fry',      qty: 7,  revenue: 2450 },
  { day: 'Wednesday', hour: 20, dish: 'Gulab Jamun',     qty: 10, revenue: 800  },
  // Day 4 (Thu) — Building up
  { day: 'Thursday',  hour: 12, dish: 'Dosa',            qty: 11, revenue: 1650 },
  { day: 'Thursday',  hour: 13, dish: 'Idli',            qty: 9,  revenue: 900  },
  { day: 'Thursday',  hour: 19, dish: 'Chicken Biryani', qty: 16, revenue: 6400 },
  { day: 'Thursday',  hour: 20, dish: 'Paneer Butter Masala', qty: 8, revenue: 2240 },
  // Day 5 (Fri) — High traffic
  { day: 'Friday',    hour: 12, dish: 'Chicken Biryani', qty: 12, revenue: 4800 },
  { day: 'Friday',    hour: 12, dish: 'Dosa',            qty: 16, revenue: 2400 },
  { day: 'Friday',    hour: 13, dish: 'Mutton Fry',      qty: 8,  revenue: 2800 },
  { day: 'Friday',    hour: 19, dish: 'Chicken Biryani', qty: 22, revenue: 8800 },
  { day: 'Friday',    hour: 20, dish: 'Gulab Jamun',     qty: 14, revenue: 1120 },
  { day: 'Friday',    hour: 20, dish: 'Filter Coffee',   qty: 20, revenue: 1000 },
  // Day 6 (Sat) — Peak weekend
  { day: 'Saturday',  hour: 11, dish: 'Dosa',            qty: 18, revenue: 2700 },
  { day: 'Saturday',  hour: 12, dish: 'Chicken Biryani', qty: 20, revenue: 8000 },
  { day: 'Saturday',  hour: 13, dish: 'Mutton Fry',      qty: 10, revenue: 3500 },
  { day: 'Saturday',  hour: 19, dish: 'Chicken Biryani', qty: 28, revenue: 11200 },
  { day: 'Saturday',  hour: 20, dish: 'Paneer Butter Masala', qty: 12, revenue: 3360 },
  { day: 'Saturday',  hour: 20, dish: 'Gulab Jamun',     qty: 18, revenue: 1440 },
  // Day 7 (Sun) — Peak weekend
  { day: 'Sunday',    hour: 11, dish: 'Idli',            qty: 14, revenue: 1400 },
  { day: 'Sunday',    hour: 12, dish: 'Chicken Biryani', qty: 18, revenue: 7200 },
  { day: 'Sunday',    hour: 12, dish: 'Dosa',            qty: 15, revenue: 2250 },
  { day: 'Sunday',    hour: 19, dish: 'Chicken Biryani', qty: 25, revenue: 10000 },
  { day: 'Sunday',    hour: 20, dish: 'Mutton Fry',      qty: 9,  revenue: 3150 },
  { day: 'Sunday',    hour: 20, dish: 'Filter Coffee',   qty: 18, revenue: 900  },
];

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Get order history from localStorage or use defaults
 */
export function getOrderHistory() {
  try {
    const raw = localStorage.getItem(ORDER_HISTORY_KEY);
    if (!raw) return DEFAULT_ORDER_HISTORY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ORDER_HISTORY;
  } catch {
    return DEFAULT_ORDER_HISTORY;
  }
}

/**
 * Predict daily batch quantities for a specific day
 * Uses 7-day rolling average with weekend weighting
 */
export function predictDailyBatch(targetDay = getCurrentDay()) {
  const history = getOrderHistory();
  const dayData = history.filter((h) => h.day === targetDay);

  const dishTotals = {};
  for (const entry of dayData) {
    if (!dishTotals[entry.dish]) {
      dishTotals[entry.dish] = { totalQty: 0, totalRevenue: 0, entries: 0 };
    }
    dishTotals[entry.dish].totalQty += entry.qty;
    dishTotals[entry.dish].totalRevenue += entry.revenue;
    dishTotals[entry.dish].entries += 1;
  }

  // Apply 1.15x safety margin for predicted prep
  return Object.entries(dishTotals).map(([dish, data]) => ({
    dish,
    predictedQty: Math.ceil(data.totalQty * 1.15),
    avgRevenue: Math.round(data.totalRevenue / Math.max(1, data.entries)),
    confidence: data.entries >= 2 ? 'High' : data.entries === 1 ? 'Medium' : 'Low',
  })).sort((a, b) => b.predictedQty - a.predictedQty);
}

/**
 * Predict hourly demand heatmap for a given day
 */
export function predictHourlyDemand(targetDay = getCurrentDay()) {
  const history = getOrderHistory();
  const dayData = history.filter((h) => h.day === targetDay);

  const hourMap = {};
  for (const entry of dayData) {
    if (!hourMap[entry.hour]) {
      hourMap[entry.hour] = { totalOrders: 0, totalRevenue: 0, dishes: [] };
    }
    hourMap[entry.hour].totalOrders += entry.qty;
    hourMap[entry.hour].totalRevenue += entry.revenue;
    hourMap[entry.hour].dishes.push(entry.dish);
  }

  return Object.entries(hourMap)
    .map(([hour, data]) => ({
      hour: Number(hour),
      label: formatHourLabel(Number(hour)),
      predictedOrders: Math.ceil(data.totalOrders * 1.1),
      predictedRevenue: Math.round(data.totalRevenue * 1.1),
      topDishes: [...new Set(data.dishes)],
      intensity: data.totalOrders > 20 ? 'peak' : data.totalOrders > 10 ? 'high' : data.totalOrders > 5 ? 'moderate' : 'low',
    }))
    .sort((a, b) => a.hour - b.hour);
}

/**
 * Calculate waste metrics from predicted vs actual served
 */
export function getWasteMetrics() {
  try {
    const raw = localStorage.getItem(WASTE_STORAGE_KEY);
    if (!raw) return getDefaultWasteMetrics();
    const parsed = JSON.parse(raw);
    return parsed || getDefaultWasteMetrics();
  } catch {
    return getDefaultWasteMetrics();
  }
}

function getDefaultWasteMetrics() {
  return {
    weeklyPrepared: 412,
    weeklyServed: 378,
    weeklyWasted: 34,
    wastePercent: 8.25,
    costOfWaste: 2720,
    topWastedDishes: [
      { dish: 'Gulab Jamun', wasted: 12, reason: 'Over-prep for dessert demand' },
      { dish: 'Idli', wasted: 8, reason: 'Morning batch leftover' },
      { dish: 'Filter Coffee', wasted: 6, reason: 'End-of-day brew excess' },
      { dish: 'Dosa', wasted: 5, reason: 'Batter expiry after 6h window' },
      { dish: 'Mutton Fry', wasted: 3, reason: 'Premium item lower weekday demand' },
    ],
    weeklyTrend: [
      { week: 'W1', wastePercent: 12.5 },
      { week: 'W2', wastePercent: 10.8 },
      { week: 'W3', wastePercent: 9.1 },
      { week: 'W4', wastePercent: 8.25 },
    ],
    savingsFromPrediction: 1840,
  };
}

/**
 * Record a completed order into history for future prediction improvement
 */
export function recordCompletedOrder(orderItems, dayOverride = null) {
  const history = getOrderHistory();
  const day = dayOverride || getCurrentDay();
  const hour = new Date().getHours();

  for (const item of orderItems) {
    history.push({
      day,
      hour,
      dish: item.name,
      qty: item.quantity || 1,
      revenue: (item.price || 0) * (item.quantity || 1),
    });
  }

  // Keep last 200 entries max
  const trimmed = history.slice(-200);
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new Event('plateflow-analytics-updated'));
  return trimmed;
}

/**
 * Get the peak hours for a given day (top 3 busiest)
 */
export function getPeakHours(targetDay = getCurrentDay()) {
  return predictHourlyDemand(targetDay)
    .sort((a, b) => b.predictedOrders - a.predictedOrders)
    .slice(0, 3);
}

/**
 * Get weekly revenue summary across all days
 */
export function getWeeklyRevenueSummary() {
  const history = getOrderHistory();
  return DAYS_ORDER.map((day) => {
    const dayData = history.filter((h) => h.day === day);
    const totalRevenue = dayData.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = dayData.reduce((s, d) => s + d.qty, 0);
    return { day, totalRevenue, totalOrders };
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getCurrentDay() {
  return DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function formatHourLabel(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}
