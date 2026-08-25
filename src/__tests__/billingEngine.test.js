import { describe, it, expect } from 'vitest';
import {
  Dish,
  InvalidQuantityError,
  calculateTax,
  getOrderMetadata,
  generateFingerprint,
  validateQuantityGuard,
  searchDishes,
  sortDishesByPrice,
  formatOrderDate,
  formatOrderTime,
  run11EngineTests,
  defaultDishes,
  DISH_CATEGORIES,
  UPSELL_PAIRINGS,
} from '../utils/billingEngine';

describe('Java Restaurant Billing Engine Unit Tests', () => {
  // ── Dish Model & Comparable<Dish> ──────────────────────────────────────────
  describe('Dish Model & Comparable<Dish>', () => {
    it('creates dish instance with correct properties and toString format', () => {
      const dish = new Dish(1, 100.0, 'Idli', 'Soft');
      expect(dish.name).toBe('Idli');
      expect(dish.price).toBe(100);
      expect(dish.desc).toBe('Soft');
      expect(dish.toString()).toBe('Idli-1-100-Soft');
    });

    it('implements compareTo for natural price sorting', () => {
      const idli = new Dish(1, 100.0, 'Idli', 'Soft');
      const biryani = new Dish(1, 400.0, 'Chicken Biryani', 'Spicy');
      const dosa = new Dish(1, 150.0, 'Dosa', 'Crispy');

      expect(idli.compareTo(biryani)).toBeLessThan(0);
      expect(biryani.compareTo(idli)).toBeGreaterThan(0);
      expect(idli.compareTo(idli)).toBe(0);

      const menu = [biryani, idli, dosa];
      const sorted = menu.sort((a, b) => a.compareTo(b));
      expect(sorted[0].name).toBe('Idli');
      expect(sorted[1].name).toBe('Dosa');
      expect(sorted[2].name).toBe('Chicken Biryani');
    });
  });

  // ── Tax & Bill Calculations ────────────────────────────────────────────────
  describe('Tax & Bill Metadata Calculations', () => {
    it('calculates SGST 5%, CGST 5%, and Grand Total accurately', () => {
      const tax = calculateTax(1000);
      expect(tax.subtotal).toBe(1000);
      expect(tax.sgst).toBe(50);
      expect(tax.cgst).toBe(50);
      expect(tax.grandTotal).toBe(1100);
    });

    it('computes order metadata from itemized order', () => {
      const order = {
        items: [
          { id: 1, name: 'Idli', price: 100, quantity: 2 },
          { id: 2, name: 'Chicken Biryani', price: 400, quantity: 1 },
        ],
      };
      const meta = getOrderMetadata(order);
      expect(meta.itemCount).toBe(2);
      expect(meta.plateCount).toBe(3);
      expect(meta.subtotal).toBe(600);
      expect(meta.sgst).toBe(30);
      expect(meta.cgst).toBe(30);
      expect(meta.grandTotal).toBe(660);
    });

    it('handles empty order gracefully', () => {
      const meta = getOrderMetadata({ items: [] });
      expect(meta.itemCount).toBe(0);
      expect(meta.plateCount).toBe(0);
      expect(meta.subtotal).toBe(0);
      expect(meta.grandTotal).toBe(0);
    });
  });

  // ── Quantity Guard & InvalidQuantity Exception ─────────────────────────────
  describe('Quantity Guard & InvalidQuantity Exception', () => {
    it('throws InvalidQuantityError when negative quantity is requested', () => {
      expect(() => validateQuantityGuard(5, -2)).toThrow(InvalidQuantityError);
      expect(() => validateQuantityGuard(5, -2)).toThrow('cannot be negative');
    });

    it('blocks request when requested removal exceeds available plate count', () => {
      const result = validateQuantityGuard(2, 5);
      expect(result.blocked).toBe(true);
      expect(result.available).toBe(2);
      expect(result.requested).toBe(5);
    });

    it('allows valid plate removal', () => {
      const result = validateQuantityGuard(5, 2);
      expect(result.blocked).toBe(false);
    });
  });

  // ── Bill DNA Checksum Hash ─────────────────────────────────────────────────
  describe('Bill DNA Checksum Generation', () => {
    it('generates consistent 14-char hexadecimal fingerprint', () => {
      const h1 = generateFingerprint(1042, 2, 3, 660);
      const h2 = generateFingerprint(1042, 2, 3, 660);
      expect(h1).toBe(h2);
      expect(h1.length).toBe(14);
      expect(/^[0-9A-F]+$/.test(h1)).toBe(true);
    });

    it('changes fingerprint when order data changes', () => {
      const hashA = generateFingerprint(1042, 2, 3, 660);
      const hashB = generateFingerprint(1042, 2, 4, 760);
      expect(hashA).not.toBe(hashB);
    });
  });

  // ── Search & Sorting ───────────────────────────────────────────────────────
  describe('Search & Sorting Algorithms', () => {
    const testMenu = [
      { id: 1, name: 'Idli', price: 100 },
      { id: 2, name: 'Chicken Biryani', price: 400 },
      { id: 3, name: 'Dosa', price: 150 },
      { id: 4, name: 'Pulao', price: 100 },
    ];

    it('performs case-insensitive search for dishes', () => {
      expect(searchDishes(testMenu, 'biryani')).toHaveLength(1);
      expect(searchDishes(testMenu, 'IDLI')).toHaveLength(1);
      expect(searchDishes(testMenu, 'nonexistent')).toHaveLength(0);
      expect(searchDishes(testMenu, '')).toHaveLength(4);
    });

    it('sorts dishes in ascending and descending price modes', () => {
      const asc = sortDishesByPrice(testMenu, 'price-low');
      expect(asc[0].price).toBe(100);
      expect(asc[asc.length - 1].price).toBe(400);

      const desc = sortDishesByPrice(testMenu, 'price-high');
      expect(desc[0].price).toBe(400);
    });
  });

  // ── Dish Categories (NEW) ──────────────────────────────────────────────────
  describe('Dish Category System', () => {
    it('all defaultDishes have a category field', () => {
      defaultDishes.forEach((d) => {
        expect(d.category).toBeDefined();
        expect(typeof d.category).toBe('string');
      });
    });

    it('DISH_CATEGORIES has 7 entries including "all"', () => {
      expect(DISH_CATEGORIES).toHaveLength(7);
      expect(DISH_CATEGORIES[0].id).toBe('all');
    });

    it('each category listed in DISH_CATEGORIES has at least 1 dish in defaultDishes', () => {
      const realCategories = DISH_CATEGORIES.filter((c) => c.id !== 'all');
      realCategories.forEach((cat) => {
        const count = defaultDishes.filter((d) => d.category === cat.id).length;
        expect(count).toBeGreaterThan(0);
      });
    });

    it('category filter returns correct subset of dishes', () => {
      const starters = defaultDishes.filter((d) => d.category === 'starters');
      const desserts = defaultDishes.filter((d) => d.category === 'desserts');
      expect(starters.length).toBeGreaterThanOrEqual(3);
      expect(desserts.length).toBeGreaterThanOrEqual(2);
    });

    it('UPSELL_PAIRINGS maps every category to an array of suggestions', () => {
      const realCategories = DISH_CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id);
      realCategories.forEach((cat) => {
        expect(UPSELL_PAIRINGS[cat]).toBeDefined();
        expect(Array.isArray(UPSELL_PAIRINGS[cat])).toBe(true);
        expect(UPSELL_PAIRINGS[cat].length).toBeGreaterThan(0);
      });
    });
  });

  // ── 11 Engine Verification Tests (mirrors TestAll.java) ───────────────────
  describe('11 Engine Verification Tests (TestAll.java alignment)', () => {
    it('executes all 11 test cases and returns 100% PASS', () => {
      const results = run11EngineTests();
      // The new engine includes 1 extra fingerprint test → total 11 (10 Java tests + 1 DNA)
      expect(results.length).toBeGreaterThanOrEqual(11);

      const failed = results.filter((r) => r.status !== 'PASS');
      expect(failed).toEqual([]);
    });
  });
});
