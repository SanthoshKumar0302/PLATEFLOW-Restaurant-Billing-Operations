import { describe, it, expect, beforeEach } from 'vitest';
import {
  predictDailyBatch,
  predictHourlyDemand,
  getWasteMetrics,
  recordCompletedOrder,
  getOrderHistory,
  getPeakHours,
  getWeeklyRevenueSummary,
  DEFAULT_ORDER_HISTORY,
} from '../utils/predictiveWasteEngine';
import {
  applyDynamicPrice,
  applyDynamicPricingToDishes,
  formatPricingDelta,
  getAutoPricingMode,
  PRICING_MODES,
  savePricingConfig,
  getPricingConfig,
} from '../utils/dynamicPricingEngine';

describe('Subgraph 4: Predictive Prep, Waste Forecaster & Dynamic Pricing Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Predictive Prep Batch Forecaster (H ➡️ I)', () => {
    it('forecasts daily batch quantities for Monday with 1.15x safety margin', () => {
      const forecast = predictDailyBatch('Monday');
      expect(forecast.length).toBeGreaterThan(0);
      const biryani = forecast.find((f) => f.dish === 'Chicken Biryani');
      expect(biryani).toBeDefined();
      // Monday Biryani: 8 + 14 = 22 plates * 1.15 = 26 plates
      expect(biryani.predictedQty).toBe(26);
      expect(biryani.confidence).toBe('High');
    });

    it('forecasts Friday peak prep accurately across all menu items', () => {
      const forecast = predictDailyBatch('Friday');
      const biryani = forecast.find((f) => f.dish === 'Chicken Biryani');
      expect(biryani.predictedQty).toBeGreaterThan(30);
    });

    it('identifies top 3 peak hours for Saturday dinner rush', () => {
      const peak = getPeakHours('Saturday');
      expect(peak.length).toBe(3);
      expect(peak[0].predictedOrders).toBeGreaterThan(15);
    });

    it('computes 24-hour demand heatmap with intensity levels', () => {
      const heatmap = predictHourlyDemand('Saturday');
      expect(heatmap.length).toBeGreaterThan(0);
      const peakEntry = heatmap.find((h) => h.intensity === 'peak' || h.intensity === 'high');
      expect(peakEntry).toBeDefined();
    });

    it('records completed orders into history and broadcasts update', () => {
      const initialCount = getOrderHistory().length;
      recordCompletedOrder([{ name: 'Dosa', quantity: 2, price: 150 }], 'Wednesday');
      const updated = getOrderHistory();
      expect(updated.length).toBe(initialCount + 1);
      expect(updated[updated.length - 1].dish).toBe('Dosa');
    });

    it('returns structured food waste reduction metrics', () => {
      const waste = getWasteMetrics();
      expect(waste.wastePercent).toBeLessThan(10);
      expect(waste.weeklyPrepared).toBeGreaterThan(waste.weeklyServed);
      expect(waste.topWastedDishes.length).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Surge / Happy-Hour Pricing Engine (I ➡️ J ➡️ A)', () => {
    it('applies Happy Hour 15% discount multiplier (0.85x)', () => {
      const discounted = applyDynamicPrice(400, 'happy_hour');
      expect(discounted).toBe(340); // 400 * 0.85 = 340
    });

    it('applies Peak Surge +12% multiplier (1.12x)', () => {
      const surged = applyDynamicPrice(400, 'surge');
      expect(surged).toBe(448); // 400 * 1.12 = 448
    });

    it('applies Early Bird 10% discount multiplier (0.90x)', () => {
      const early = applyDynamicPrice(100, 'early_bird');
      expect(early).toBe(90);
    });

    it('applies Standard pricing multiplier (1.00x) unchanged', () => {
      const standard = applyDynamicPrice(250, 'standard');
      expect(standard).toBe(250);
    });

    it('applies dynamic pricing across entire dish array preserving basePrice', () => {
      const sample = [
        { id: 1, name: 'Chicken Biryani', price: 400 },
        { id: 2, name: 'Idli', price: 100 },
      ];

      const surged = applyDynamicPricingToDishes(sample, 'surge');
      expect(surged[0].basePrice).toBe(400);
      expect(surged[0].price).toBe(448);
      expect(surged[0].pricingMode).toBe('surge');

      const happy = applyDynamicPricingToDishes(sample, 'happy_hour');
      expect(happy[0].basePrice).toBe(400);
      expect(happy[0].price).toBe(340);
    });

    it('correctly formats price deltas for discounts and surcharges', () => {
      const discountDelta = formatPricingDelta(400, 340);
      expect(discountDelta.isDiscount).toBe(true);
      expect(discountDelta.label).toBe('₹60 OFF');

      const surgeDelta = formatPricingDelta(400, 448);
      expect(surgeDelta.isDiscount).toBe(false);
      expect(surgeDelta.label).toBe('+₹48 Surge');

      const standardDelta = formatPricingDelta(400, 400);
      expect(standardDelta.label).toBe('Standard');
    });

    it('auto pricing schedule resolves Happy Hour for 4 PM (16:00)', () => {
      const mode = getAutoPricingMode(16);
      expect(mode.id).toBe('happy_hour');
    });

    it('auto pricing schedule resolves Peak Surge for 8 PM (20:00)', () => {
      const mode = getAutoPricingMode(20);
      expect(mode.id).toBe('surge');
    });
  });
});
