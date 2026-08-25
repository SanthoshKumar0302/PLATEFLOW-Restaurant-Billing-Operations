import { describe, it, expect, beforeEach } from 'vitest';
import {
  getInventory,
  saveInventory,
  getAvailablePortions,
  isDishSoldOut,
  deductStockForOrder,
  restockIngredient,
  resetInventoryToDefault,
  DEFAULT_RAW_INGREDIENTS,
  DISH_RECIPES,
} from '../utils/recipeInventoryEngine';

describe('Subgraph 2: Recipe BOM & Real-Time Inventory Auto-Lock Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    resetInventoryToDefault();
  });

  it('initial inventory contains all 11 core raw ingredients with valid thresholds', () => {
    const inv = getInventory();
    expect(inv.length).toBe(11);
    expect(inv.find((i) => i.id === 'ing-rice')).toBeDefined();
    expect(inv.find((i) => i.id === 'ing-chicken')).toBeDefined();
    expect(inv.find((i) => i.id === 'ing-batter')).toBeDefined();
  });

  it('calculates available portions for Chicken Biryani based on raw chicken and rice', () => {
    // 12kg rice (200g/plate = 60 plates), 8kg chicken (250g/plate = 32 plates) -> min 32
    const portions = getAvailablePortions('Chicken Biryani');
    expect(portions).toBe(32);
    expect(isDishSoldOut('Chicken Biryani')).toBe(false);
  });

  it('deductStockForOrder depletes exact recipe BOM quantities when prep starts', () => {
    const orderItems = [
      { name: 'Chicken Biryani', qty: 2 }, // 2x Biryani -> 400g rice, 500g chicken
    ];

    const result = deductStockForOrder(orderItems);
    expect(result.success).toBe(true);

    const updatedInv = getInventory();
    const rice = updatedInv.find((i) => i.id === 'ing-rice');
    const chicken = updatedInv.find((i) => i.id === 'ing-chicken');

    expect(rice.stock).toBeCloseTo(11.6, 2);   // 12.0 - 0.40 = 11.60
    expect(chicken.stock).toBeCloseTo(7.5, 2); // 8.0 - 0.50 = 7.50
  });

  it('auto-locks dish as Sold Out when key ingredient reaches 0', () => {
    // Manually deplete chicken to 0kg
    const current = getInventory();
    const depleted = current.map((i) =>
      i.id === 'ing-chicken' ? { ...i, stock: 0 } : i
    );
    saveInventory(depleted);

    // Chicken Biryani should now be SOLD OUT
    expect(getAvailablePortions('Chicken Biryani', depleted)).toBe(0);
    expect(isDishSoldOut('Chicken Biryani', depleted)).toBe(true);

    // Other dishes that don't need chicken (like Dosa, Idli) should remain AVAILABLE
    expect(isDishSoldOut('Dosa', depleted)).toBe(false);
    expect(getAvailablePortions('Dosa', depleted)).toBeGreaterThan(0);
  });

  it('restockIngredient restores raw stock and automatically unlocks the dish', () => {
    // Deplete chicken to 0
    const current = getInventory();
    const depleted = current.map((i) =>
      i.id === 'ing-chicken' ? { ...i, stock: 0 } : i
    );
    saveInventory(depleted);
    expect(isDishSoldOut('Chicken Biryani')).toBe(true);

    // Restock chicken +5kg
    const restocked = restockIngredient('ing-chicken', 5.0);
    const chicken = restocked.find((i) => i.id === 'ing-chicken');
    expect(chicken.stock).toBe(5.0);

    // Biryani is immediately UNLOCKED (5.0kg / 0.25kg = 20 portions)
    expect(isDishSoldOut('Chicken Biryani')).toBe(false);
    expect(getAvailablePortions('Chicken Biryani')).toBe(20);
  });

  it('handles multi-dish order batch depletion accurately across shared ingredients', () => {
    const multiOrder = [
      { name: 'Idli', qty: 4 }, // 4x 150g = 600g batter
      { name: 'Dosa', qty: 2 }, // 2x 200g = 400g batter
    ];

    deductStockForOrder(multiOrder);

    const inv = getInventory();
    const batter = inv.find((i) => i.id === 'ing-batter');
    // Initial 10kg - (0.6kg + 0.4kg) = 9.0kg
    expect(batter.stock).toBeCloseTo(9.0, 2);
  });

  it('resetInventoryToDefault restores all 11 ingredients to full capacity', () => {
    // Deplete everything
    saveInventory([]);
    expect(getInventory().length).toBe(11);

    const reset = resetInventoryToDefault();
    expect(reset.length).toBe(11);
    expect(reset.find((i) => i.id === 'ing-chicken').stock).toBe(8.0);
  });
});
