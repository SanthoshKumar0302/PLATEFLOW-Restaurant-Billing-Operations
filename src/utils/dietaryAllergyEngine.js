/**
 * PlateFlow Dietary & Allergy Guard Engine
 * Manages dietary profiles, allergen matrix, and cross-contamination conflict validation
 */

export const DIETARY_PROFILES = [
  { id: 'all',          label: 'All Diets',     icon: '🍽️', description: 'Show all culinary dishes' },
  { id: 'veg',          label: 'Pure Veg',      icon: '🥬', description: '100% vegetarian dishes (dairy allowed)' },
  { id: 'vegan',        label: 'Vegan',         icon: '🌱', description: '100% plant-based (zero dairy, egg, or meat)' },
  { id: 'jain',         label: 'Jain Satvik',   icon: '🕉️', description: 'No onion, garlic, or root vegetables' },
  { id: 'gluten_free',  label: 'Gluten-Free',   icon: '🌾', description: 'Zero wheat, maida, or gluten grains' },
  { id: 'nut_free',     label: 'Nut-Free',      icon: '🥜', description: 'Safe for tree nut and peanut allergies' },
];

export const ALLERGEN_TYPES = {
  DAIRY: 'Dairy (Milk/Ghee/Paneer)',
  GLUTEN: 'Gluten (Wheat/Maida)',
  NUTS: 'Nuts (Cashew/Peanut)',
  ONION_GARLIC: 'Onion & Garlic',
  MEAT: 'Meat / Poultry / Mutton',
};

/**
 * Standard dietary and allergen profile for every dish in the restaurant
 */
export const DISH_DIETARY_PROFILES = {
  'Idli': {
    isVeg: true,
    isVegan: true,
    isJain: true,
    isGlutenFree: true,
    isNutFree: true,
    allergens: [],
    tags: ['🌱 Vegan', '🕉️ Jain', '🌾 Gluten-Free'],
  },
  'Dosa': {
    isVeg: true,
    isVegan: false, // Cooked with Desi Ghee
    isJain: true,
    isGlutenFree: true,
    isNutFree: true,
    allergens: [ALLERGEN_TYPES.DAIRY],
    tags: ['🥬 Pure Veg', '🕉️ Jain', '🌾 Gluten-Free'],
  },
  'Chicken Biryani': {
    isVeg: false,
    isVegan: false,
    isJain: false,
    isGlutenFree: true,
    isNutFree: true,
    allergens: [ALLERGEN_TYPES.MEAT, ALLERGEN_TYPES.DAIRY, ALLERGEN_TYPES.ONION_GARLIC],
    tags: ['🍗 Halal Meat', '🌾 Gluten-Free'],
  },
  'Mutton Fry': {
    isVeg: false,
    isVegan: false,
    isJain: false,
    isGlutenFree: true,
    isNutFree: true,
    allergens: [ALLERGEN_TYPES.MEAT, ALLERGEN_TYPES.DAIRY, ALLERGEN_TYPES.ONION_GARLIC],
    tags: ['🥩 Prime Mutton', '🌾 Gluten-Free'],
  },
  'Pulao': {
    isVeg: true,
    isVegan: false, // Cooked with ghee
    isJain: false, // Contains onion/ginger
    isGlutenFree: true,
    isNutFree: false, // Garnished with fried cashews
    allergens: [ALLERGEN_TYPES.DAIRY, ALLERGEN_TYPES.ONION_GARLIC, ALLERGEN_TYPES.NUTS],
    tags: ['🥬 Pure Veg', '🌾 Gluten-Free'],
  },
  'Paneer Butter Masala': {
    isVeg: true,
    isVegan: false,
    isJain: false, // Rich onion-tomato gravy
    isGlutenFree: true,
    isNutFree: false, // Rich cashew paste base
    allergens: [ALLERGEN_TYPES.DAIRY, ALLERGEN_TYPES.NUTS, ALLERGEN_TYPES.ONION_GARLIC],
    tags: ['🥬 Pure Veg', '🧀 Rich Dairy'],
  },
  'Kumbakonam Filter Coffee': {
    isVeg: true,
    isVegan: false, // Fresh milk
    isJain: true,
    isGlutenFree: true,
    isNutFree: true,
    allergens: [ALLERGEN_TYPES.DAIRY],
    tags: ['☕ Fresh Brew', '🕉️ Jain'],
  },
  'Masala Chai': {
    isVeg: true,
    isVegan: false,
    isJain: false, // Fresh ginger/spices
    isGlutenFree: true,
    isNutFree: true,
    allergens: [ALLERGEN_TYPES.DAIRY],
    tags: ['🫖 Spiced Tea', '🥬 Pure Veg'],
  },
  'Gulab Jamun': {
    isVeg: true,
    isVegan: false,
    isJain: true,
    isGlutenFree: false, // Contains mawa & maida flour
    isNutFree: false, // Cardamom & pistachio garnish
    allergens: [ALLERGEN_TYPES.DAIRY, ALLERGEN_TYPES.GLUTEN, ALLERGEN_TYPES.NUTS],
    tags: ['🍨 Sweet Treat', '🥬 Pure Veg'],
  },
};

/**
 * Get dietary metadata for a dish
 */
export function getDishDietaryInfo(dishName) {
  return DISH_DIETARY_PROFILES[dishName] || {
    isVeg: true,
    isVegan: false,
    isJain: false,
    isGlutenFree: true,
    isNutFree: true,
    allergens: [],
    tags: ['🍽️ Standard'],
  };
}

/**
 * Filter a dish array by selected dietary profile
 */
export function filterDishesByDietary(dishes, dietaryId) {
  if (!dietaryId || dietaryId === 'all') return dishes;

  return dishes.filter((dish) => {
    const meta = getDishDietaryInfo(dish.name);
    switch (dietaryId) {
      case 'veg':
        return meta.isVeg;
      case 'vegan':
        return meta.isVegan;
      case 'jain':
        return meta.isJain;
      case 'gluten_free':
        return meta.isGlutenFree;
      case 'nut_free':
        return meta.isNutFree;
      default:
        return true;
    }
  });
}

/**
 * Defensive Allergy Guard: checks if a dish conflicts with the diner's active restriction profile
 * Returns { hasConflict: boolean, reason: string, severity: 'warning' | 'danger' }
 */
export function checkDietaryConflict(dishName, activeRestrictionId) {
  if (!activeRestrictionId || activeRestrictionId === 'all') {
    return { hasConflict: false, reason: null };
  }

  const meta = getDishDietaryInfo(dishName);

  switch (activeRestrictionId) {
    case 'vegan':
      if (!meta.isVegan) {
        return {
          hasConflict: true,
          severity: 'danger',
          reason: `"${dishName}" is NOT Vegan. It contains ${meta.allergens.join(', ') || 'dairy or animal byproducts'}.`,
        };
      }
      break;

    case 'veg':
      if (!meta.isVeg) {
        return {
          hasConflict: true,
          severity: 'danger',
          reason: `"${dishName}" contains Meat/Non-Veg ingredients, violating your Pure Vegetarian preference.`,
        };
      }
      break;

    case 'jain':
      if (!meta.isJain) {
        return {
          hasConflict: true,
          severity: 'warning',
          reason: `"${dishName}" is NOT Jain compliant. It contains Onion, Garlic, or non-Jain ingredients.`,
        };
      }
      break;

    case 'gluten_free':
      if (!meta.isGlutenFree) {
        return {
          hasConflict: true,
          severity: 'danger',
          reason: `"${dishName}" contains Gluten/Wheat ingredients, posing an allergen risk.`,
        };
      }
      break;

    case 'nut_free':
      if (!meta.isNutFree) {
        return {
          hasConflict: true,
          severity: 'danger',
          reason: `"${dishName}" contains Tree Nuts or Cashew Paste, posing a severe allergy risk.`,
        };
      }
      break;

    default:
      break;
  }

  return { hasConflict: false, reason: null };
}
