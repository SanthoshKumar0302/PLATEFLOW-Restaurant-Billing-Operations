/**
 * PlateFlow Recipe Bill of Materials (BOM) & Inventory Auto-Lock Engine
 * Connects KDS Prep ➡️ Live Ingredient Depletion ➡️ Real-Time Menu Auto-Lock
 */

export const INVENTORY_STORAGE_KEY = 'plateflow-inventory-stock';
export const INVENTORY_LOGS_KEY = 'plateflow-inventory-logs';

export const DEFAULT_RAW_INGREDIENTS = [
  { id: 'ing-rice',    name: 'Basmati Rice',        category: 'Grains', stock: 12.0, minStock: 3.0, unit: 'kg', icon: '🌾' },
  { id: 'ing-chicken', name: 'Fresh Tender Chicken',category: 'Meat',   stock: 8.0,  minStock: 2.5, unit: 'kg', icon: '🍗' },
  { id: 'ing-mutton',  name: 'Prime Mutton',        category: 'Meat',   stock: 5.0,  minStock: 1.5, unit: 'kg', icon: '🥩' },
  { id: 'ing-batter',  name: 'Idli / Dosa Batter',  category: 'Grains', stock: 10.0, minStock: 2.0, unit: 'kg', icon: '🥣' },
  { id: 'ing-paneer',  name: 'Fresh Dairy Paneer',  category: 'Dairy',  stock: 4.5,  minStock: 1.0, unit: 'kg', icon: '🧀' },
  { id: 'ing-ghee',    name: 'Pure Desi Ghee',      category: 'Dairy',  stock: 3.0,  minStock: 0.8, unit: 'kg', icon: '🧈' },
  { id: 'ing-milk',    name: 'Fresh Dairy Milk',    category: 'Dairy',  stock: 12.0, minStock: 3.0, unit: 'L',  icon: '🥛' },
  { id: 'ing-coffee',  name: 'Filter Coffee Roast', category: 'Pantry', stock: 2.5,  minStock: 0.5, unit: 'kg', icon: '☕' },
  { id: 'ing-tea',     name: 'Assam Tea Leaves',    category: 'Pantry', stock: 2.0,  minStock: 0.5, unit: 'kg', icon: '🫖' },
  { id: 'ing-sugar',   name: 'Pure Cane Sugar',     category: 'Pantry', stock: 8.0,  minStock: 2.0, unit: 'kg', icon: '🧂' },
  { id: 'ing-spices',  name: 'Royal Garam Masala',  category: 'Pantry', stock: 3.0,  minStock: 0.5, unit: 'kg', icon: '🌶️' },
];

/**
 * Recipe Bill of Materials (BOM) per 1 plate of each dish
 */
export const DISH_RECIPES = {
  'Chicken Biryani': [
    { ingredientId: 'ing-rice',    qty: 0.20, unit: 'kg' }, // 200g
    { ingredientId: 'ing-chicken', qty: 0.25, unit: 'kg' }, // 250g
    { ingredientId: 'ing-spices',  qty: 0.02, unit: 'kg' }, // 20g
    { ingredientId: 'ing-ghee',    qty: 0.02, unit: 'kg' }, // 20g
  ],
  'Mutton Fry': [
    { ingredientId: 'ing-mutton',  qty: 0.25, unit: 'kg' }, // 250g
    { ingredientId: 'ing-spices',  qty: 0.03, unit: 'kg' }, // 30g
    { ingredientId: 'ing-ghee',    qty: 0.03, unit: 'kg' }, // 30g
  ],
  'Pulao': [
    { ingredientId: 'ing-rice',    qty: 0.18, unit: 'kg' }, // 180g
    { ingredientId: 'ing-ghee',    qty: 0.02, unit: 'kg' }, // 20g
    { ingredientId: 'ing-spices',  qty: 0.01, unit: 'kg' }, // 10g
  ],
  'Idli': [
    { ingredientId: 'ing-batter',  qty: 0.15, unit: 'kg' }, // 150g
    { ingredientId: 'ing-ghee',    qty: 0.01, unit: 'kg' }, // 10g
  ],
  'Dosa': [
    { ingredientId: 'ing-batter',  qty: 0.20, unit: 'kg' }, // 200g
    { ingredientId: 'ing-ghee',    qty: 0.02, unit: 'kg' }, // 20g
  ],
  'Kumbakonam Filter Coffee': [
    { ingredientId: 'ing-milk',    qty: 0.12, unit: 'L'  }, // 120ml
    { ingredientId: 'ing-coffee',  qty: 0.02, unit: 'kg' }, // 20g
    { ingredientId: 'ing-sugar',   qty: 0.01, unit: 'kg' }, // 10g
  ],
  'Masala Chai': [
    { ingredientId: 'ing-milk',    qty: 0.10, unit: 'L'  }, // 100ml
    { ingredientId: 'ing-tea',     qty: 0.01, unit: 'kg' }, // 10g
    { ingredientId: 'ing-spices',  qty: 0.005, unit: 'kg' }, // 5g
    { ingredientId: 'ing-sugar',   qty: 0.01, unit: 'kg' }, // 10g
  ],
  'Paneer Butter Masala': [
    { ingredientId: 'ing-paneer',  qty: 0.20, unit: 'kg' }, // 200g
    { ingredientId: 'ing-ghee',    qty: 0.04, unit: 'kg' }, // 40g
    { ingredientId: 'ing-spices',  qty: 0.03, unit: 'kg' }, // 30g
  ],
};

/**
 * Get current inventory stock from localStorage
 */
export function getInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return DEFAULT_RAW_INGREDIENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RAW_INGREDIENTS;
  } catch {
    return DEFAULT_RAW_INGREDIENTS;
  }
}

/**
 * Save inventory stock to localStorage
 */
export function saveInventory(inventory) {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    // Trigger storage event for cross-tab or cross-component reactivity
    window.dispatchEvent(new Event('plateflow-inventory-updated'));
  } catch (e) {
    console.warn('[PlateFlow] saveInventory error:', e);
  }
}

/**
 * Calculate maximum available plates that can be cooked for a dish based on raw stock
 */
export function getAvailablePortions(dishName, inventory = null) {
  const stock = inventory || getInventory();
  const recipe = DISH_RECIPES[dishName];

  if (!recipe || recipe.length === 0) {
    return 99; // Non-BOM items default to unlimited/99
  }

  let minPortions = Infinity;

  for (const item of recipe) {
    const ing = stock.find((i) => i.id === item.ingredientId);
    if (!ing || ing.stock <= 0) {
      return 0;
    }
    const possible = Math.floor(ing.stock / item.qty);
    if (possible < minPortions) {
      minPortions = possible;
    }
  }

  return minPortions === Infinity ? 99 : Math.max(0, minPortions);
}

/**
 * Check if a dish is sold out (0 portions available)
 */
export function isDishSoldOut(dishName, inventory = null) {
  return getAvailablePortions(dishName, inventory) <= 0;
}

/**
 * Deduct raw ingredients when Chef starts preparing an order in KDS
 * Returns { success: boolean, depletedIngredients: array, soldOutDishes: array }
 */
export function deductStockForOrder(orderItems) {
  try {
    const currentStock = getInventory();
    const updatedStock = [...currentStock];
    const depletedLog = [];

    for (const item of orderItems) {
      const recipe = DISH_RECIPES[item.name];
      if (!recipe) continue;

      const qty = Number(item.quantity || item.qty || 1);

      for (const req of recipe) {
        const ingIndex = updatedStock.findIndex((i) => i.id === req.ingredientId);
        if (ingIndex >= 0) {
          const totalNeeded = Number((req.qty * qty).toFixed(3));
          const newStock = Math.max(0, Number((updatedStock[ingIndex].stock - totalNeeded).toFixed(3)));
          updatedStock[ingIndex] = {
            ...updatedStock[ingIndex],
            stock: newStock,
          };
          depletedLog.push({
            ingredient: updatedStock[ingIndex].name,
            deducted: totalNeeded,
            remaining: newStock,
            unit: updatedStock[ingIndex].unit,
            forDish: item.name,
          });
        }
      }
    }

    saveInventory(updatedStock);

    // Identify dishes that became sold out after this deduction
    const newlySoldOut = Object.keys(DISH_RECIPES).filter((d) =>
      isDishSoldOut(d, updatedStock)
    );

    return {
      success: true,
      depleted: depletedLog,
      soldOutDishes: newlySoldOut,
      inventory: updatedStock,
    };
  } catch (e) {
    console.warn('[PlateFlow] deductStockForOrder error:', e);
    return { success: false, depleted: [], soldOutDishes: [], inventory: getInventory() };
  }
}

/**
 * Restock an ingredient by ID with an added amount
 */
export function restockIngredient(ingredientId, amount = 5.0) {
  try {
    const current = getInventory();
    const updated = current.map((i) =>
      i.id === ingredientId
        ? { ...i, stock: Number((i.stock + Number(amount)).toFixed(2)) }
        : i
    );
    saveInventory(updated);
    return updated;
  } catch (e) {
    console.warn('[PlateFlow] restockIngredient error:', e);
    return getInventory();
  }
}

/**
 * Reset all inventory to factory defaults
 */
export function resetInventoryToDefault() {
  saveInventory(DEFAULT_RAW_INGREDIENTS);
  return DEFAULT_RAW_INGREDIENTS;
}
