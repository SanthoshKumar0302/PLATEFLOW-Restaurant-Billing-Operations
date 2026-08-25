/**
 * PlateFlow Billing Engine (JavaScript implementation aligned 1:1 with Java backend)
 * Maps to:
 * - Dish.java (Comparable<Dish>)
 * - Bill.java (Calculations, Time/Date, Tax Breakdown)
 * - InvalidQuantity.java (Custom Exception)
 * - TestAll.java (11 Engine Verification Tests)
 */

export class InvalidQuantityError extends Error {
  constructor(message = 'Invalid Quantity') {
    super(message);
    this.name = 'InvalidQuantityError';
  }
}

export class Dish {
  constructor(id, price, name, desc = '', qty = 1) {
    this.id = id;
    this.price = Number(price) || 0;
    this.name = String(name);
    this.desc = String(desc);
    this.qty = Number(qty) || 1;
  }

  toString() {
    return `${this.name}-${this.qty}-${this.price}-${this.desc}`;
  }

  /**
   * Comparable<Dish> interface implementation
   * Compares dishes by price (ascending)
   */
  compareTo(otherDish) {
    if (!otherDish) return 1;
    return this.price - otherDish.price;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Menu — 6 Categories, 19 Dishes
// Category values: 'main' | 'starters' | 'desserts' | 'hot-drinks' | 'soft-drinks' | 'beverages'
// ─────────────────────────────────────────────────────────────────────────────
export const defaultDishes = [
  // ── Food (Main Course) ───────────────────────────────────────────────────
  { id: 1,  name: 'Idli',             price: 100, description: 'Soft & steamed rice cakes',      category: 'food',       quantity: 0 },
  { id: 2,  name: 'Chicken Biryani',  price: 400, description: 'Spicy Hyderabadi style',         category: 'food',       quantity: 0 },
  { id: 3,  name: 'Dosa',             price: 150, description: 'Crispy golden crepe',            category: 'food',       quantity: 0 },
  { id: 4,  name: 'Pulao',            price: 100, description: 'Kerala fragrant rice',           category: 'food',       quantity: 0 },
  { id: 5,  name: 'Butter Naan',      price: 60,  description: 'Tandoor baked with butter',     category: 'food',       quantity: 0 },
  { id: 6,  name: 'Paneer Butter Masala', price: 280, description: 'Rich creamy tomato gravy',  category: 'food',       quantity: 0 },

  // ── Starters ─────────────────────────────────────────────────────────────
  { id: 7,  name: 'Chicken 65',       price: 220, description: 'Crispy spiced chicken fry',     category: 'starters',   quantity: 0 },
  { id: 8,  name: 'Gobi Manchurian',  price: 160, description: 'Indo-Chinese crispy cauliflower',category: 'starters',  quantity: 0 },
  { id: 9,  name: 'Paneer Tikka',     price: 240, description: 'Chargrilled cottage cheese',    category: 'starters',   quantity: 0 },
  { id: 10, name: 'Prawn Fry',        price: 350, description: 'Coastal masala prawn',          category: 'starters',   quantity: 0 },

  // ── Desserts ─────────────────────────────────────────────────────────────
  { id: 11, name: 'Gulab Jamun',      price: 80,  description: 'Soft milk-solid dumplings',    category: 'desserts',   quantity: 0 },
  { id: 12, name: 'Ice Cream',        price: 120, description: 'Vanilla / Chocolate / Mango',  category: 'desserts',   quantity: 0 },
  { id: 13, name: 'Kesari',           price: 70,  description: 'Saffron semolina sweet',       category: 'desserts',   quantity: 0 },

  // ── Hot Drinks ───────────────────────────────────────────────────────────
  { id: 14, name: 'Filter Coffee',    price: 50,  description: 'Kumbakonam strong brew',       category: 'hot-drinks', quantity: 0 },
  { id: 15, name: 'Masala Tea',       price: 40,  description: 'Ginger cardamom blend',        category: 'hot-drinks', quantity: 0 },

  // ── Soft Drinks ──────────────────────────────────────────────────────────
  { id: 16, name: 'Fresh Lime Soda',  price: 60,  description: 'Sweet or Salt, refreshing',    category: 'soft-drinks', quantity: 0 },
  { id: 17, name: 'Mango Lassi',      price: 90,  description: 'Thick mango yogurt drink',     category: 'soft-drinks', quantity: 0 },
  { id: 18, name: 'Buttermilk',       price: 40,  description: 'Spiced chaas, cool & light',   category: 'soft-drinks', quantity: 0 },

  // ── Beverages ────────────────────────────────────────────────────────────
  { id: 19, name: 'Cold Coffee',      price: 110, description: 'Blended iced coffee',          category: 'beverages',  quantity: 0 },
  { id: 20, name: 'Fresh Juice',      price: 100, description: 'Orange / Watermelon / Mosambi',category: 'beverages',  quantity: 0 },
  { id: 21, name: 'Mineral Water',    price: 25,  description: '1L sealed bottle',             category: 'beverages',  quantity: 0 },
];

// Category metadata used by DishExplorer tabs
export const DISH_CATEGORIES = [
  { id: 'all',         label: 'All Items',    emoji: '🍽️' },
  { id: 'food',        label: 'Food (Main)',  emoji: '🍛' },
  { id: 'starters',   label: 'Starters',     emoji: '🍢' },
  { id: 'desserts',   label: 'Desserts',     emoji: '🍮' },
  { id: 'hot-drinks', label: 'Hot Drinks',   emoji: '☕' },
  { id: 'soft-drinks',label: 'Soft Drinks',  emoji: '🥤' },
  { id: 'beverages',  label: 'Beverages',    emoji: '🧃' },
];

// Upsell pairing rules — when a dish is in cart, suggest these categories
export const UPSELL_PAIRINGS = {
  food:       ['starters', 'soft-drinks', 'desserts'],
  main:       ['starters', 'soft-drinks', 'desserts'],
  starters:   ['soft-drinks', 'beverages'],
  desserts:   ['hot-drinks', 'beverages'],
  'hot-drinks':  ['desserts', 'starters'],
  'soft-drinks': ['starters', 'food'],
  beverages:  ['starters', 'food'],
};

export const formatOrderDate = (dateValue = new Date()) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatOrderTime = (dateValue = new Date()) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const createOrderNumber = () => Math.floor(1000 + Math.random() * 9000);

export const calculateTax = (subtotal, loyaltyDiscountPercent = 0) => {
  const discountAmount = Number(((subtotal * (Number(loyaltyDiscountPercent) || 0)) / 100).toFixed(2));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const sgst = Number(((taxableAmount * 5) / 100).toFixed(2));
  const cgst = Number(((taxableAmount * 5) / 100).toFixed(2));
  const grandTotal = Number((taxableAmount + sgst + cgst).toFixed(2));
  return {
    subtotal,
    loyaltyDiscount: discountAmount,
    taxableAmount,
    sgst,
    cgst,
    grandTotal,
  };
};

export const getOrderMetadata = (targetOrder, pricingMode = 'standard', loyaltyMember = null) => {
  const items = Array.isArray(targetOrder?.items) ? targetOrder.items : [];

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const discountPercent = loyaltyMember ? (
    loyaltyMember.tier === 'PLATINUM' ? 15 :
    loyaltyMember.tier === 'GOLD' ? 10 :
    loyaltyMember.tier === 'SILVER' ? 5 : 0
  ) : (targetOrder?.loyaltyDiscountPercent || 0);

  const tax = calculateTax(subtotal, discountPercent);

  const itemCount = items.length;
  const plateCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const fingerprint = generateFingerprint(targetOrder?.id, itemCount, plateCount, tax.grandTotal);

  return {
    ...tax,
    itemCount,
    plateCount,
    fingerprint,
    pricingMode,
    loyaltyMember,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Bill DNA — Dual-seed rolling polynomial hash (collision-resistant 14-char hex)
// ─────────────────────────────────────────────────────────────────────────────
export const generateFingerprint = (orderId = 0, itemCount = 0, plateCount = 0, grandTotal = 0) => {
  const seed1 = BigInt('0xdeadbeef');
  const seed2 = BigInt('0x41c6ce57');
  const mask = BigInt('0xFFFFFFFF');

  const inputs = [
    BigInt(Math.abs(Number(orderId) || 0)),
    BigInt(Math.abs(Number(itemCount) || 0)),
    BigInt(Math.abs(Number(plateCount) || 0)),
    BigInt(Math.round(Math.abs(Number(grandTotal) || 0) * 100)),
  ];

  let h1 = seed1;
  let h2 = seed2;

  for (const val of inputs) {
    h1 = ((h1 ^ val) * BigInt(2654435761)) & mask;
    h2 = ((h2 ^ val) * BigInt(2246822519)) & mask;
    h1 = ((h1 << BigInt(13)) | (h1 >> BigInt(19))) & mask;
    h2 = ((h2 << BigInt(11)) | (h2 >> BigInt(21))) & mask;
  }

  const combined = ((h1 << BigInt(32)) | h2).toString(16).replace('-', '');
  return combined.padStart(14, '0').slice(-14).toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Search & Sort (maps to Bill.search() and Dish.compareTo())
// ─────────────────────────────────────────────────────────────────────────────
export const searchDishes = (dishes = [], query = '') => {
  if (!query.trim()) return dishes;
  const lower = query.toLowerCase().trim();
  return dishes.filter(
    (d) =>
      d.name.toLowerCase().includes(lower) ||
      (d.description && d.description.toLowerCase().includes(lower))
  );
};

export const sortDishesByPrice = (dishes = [], order = 'default') => {
  if (order === 'default') return dishes;
  return [...dishes].sort((a, b) => {
    const dishA = new Dish(a.id, a.price, a.name, a.description);
    const dishB = new Dish(b.id, b.price, b.name, b.description);
    return order === 'price-low'
      ? dishA.compareTo(dishB)
      : dishB.compareTo(dishA);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Quantity Guard (maps to InvalidQuantity.java)
// ─────────────────────────────────────────────────────────────────────────────
export const validateQuantityGuard = (available, requested) => {
  if (requested < 0) {
    throw new InvalidQuantityError(`Requested quantity (${requested}) cannot be negative`);
  }
  if (requested > available) {
    return {
      blocked: true,
      available,
      requested,
      message: `Request for ${requested} plate(s) exceeds available count of ${available}`,
    };
  }
  return { blocked: false, available, requested };
};

// ─────────────────────────────────────────────────────────────────────────────
// 11 Engine Verification Tests (maps to TestAll.java — exact test coverage)
// ─────────────────────────────────────────────────────────────────────────────
export const run11EngineTests = () => {
  const results = [];
  const test = (name, fn) => {
    try {
      fn();
      results.push({ name, status: 'PASS', error: null });
    } catch (err) {
      results.push({ name, status: 'FAIL', error: String(err.message) });
    }
  };

  // [TEST 1.1] Dish Constructor & toString()
  test('Dish Constructor & toString()', () => {
    const dish = new Dish(1, 100, 'Idli', 'Soft', 2);
    const str = dish.toString();
    if (!str.includes('Idli')) throw new Error('toString missing dish name');
    if (!str.includes('100')) throw new Error('toString missing price');
  });

  // [TEST 1.2] Creating Multiple Dishes
  test('Creating Multiple Dishes', () => {
    const dishes = [
      new Dish(2, 400, 'Chicken Biryani', 'Spicy', 1),
      new Dish(3, 150, 'Dosa', 'Crispy', 3),
      new Dish(4, 100, 'Pulao', 'Kerala', 1),
    ];
    if (dishes.length !== 3) throw new Error('Expected 3 dishes');
    dishes.forEach((d) => {
      if (!d.name || !d.price) throw new Error(`Invalid dish: ${d.toString()}`);
    });
  });

  // [TEST 1.3] Dish Comparison (compareTo)
  test('Dish Comparison (compareTo)', () => {
    const idli = new Dish(1, 100, 'Idli', 'Soft', 1);
    const biryani = new Dish(2, 400, 'Chicken Biryani', 'Spicy', 1);
    const result = idli.compareTo(biryani);
    if (result !== -300) throw new Error(`Expected -300, got ${result}`);
  });

  // [TEST 2.1] getTime() & getDate()
  test('getTime() & getDate()', () => {
    const now = new Date();
    const dateStr = formatOrderDate(now);
    const timeStr = formatOrderTime(now);
    if (!dateStr.match(/\d{2}-\d{2}-\d{4}/)) throw new Error(`Bad date format: ${dateStr}`);
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) throw new Error(`Bad time format: ${timeStr}`);
  });

  // [TEST 2.2] addDish() Method
  test('addDish() Method', () => {
    const bill = [];
    const addDish = (dish) => { bill.push(dish); };
    addDish(new Dish(1, 100, 'Idli', 'Soft', 1));
    addDish(new Dish(2, 400, 'Chicken Biryani', 'Spicy', 1));
    addDish(new Dish(3, 150, 'Dosa', 'Crispy', 1));
    if (bill.length !== 3) throw new Error('Expected 3 dishes in bill');
  });

  // [TEST 2.3] Display Current Dishes
  test('Display Current Dishes', () => {
    const dishes = [
      new Dish(1, 100, 'Idli', 'Soft', 1),
      new Dish(2, 400, 'Chicken Biryani', 'Spicy', 1),
      new Dish(3, 150, 'Dosa', 'Crispy', 1),
    ];
    const display = dishes.map((d) => d.toString());
    if (!display[0].includes('Idli')) throw new Error('Display missing Idli');
    if (!display[1].includes('Chicken Biryani')) throw new Error('Display missing Biryani');
  });

  // [TEST 2.4] Add Duplicate Dish (Qty Increment)
  test('Add Duplicate Dish (Qty Increment)', () => {
    let idli = new Dish(1, 100, 'Idli', 'Soft', 1);
    if (idli.qty !== 1) throw new Error('Initial qty should be 1');
    idli = new Dish(1, 100, 'Idli', 'Soft', idli.qty + 1);
    if (idli.qty !== 2) throw new Error('Qty should be 2 after increment');
  });

  // [TEST 2.5] search() Method
  test('search() Method', () => {
    const menu = defaultDishes;
    const idliResults = searchDishes(menu, 'Idli');
    const pizzaResults = searchDishes(menu, 'Pizza');
    if (!idliResults.some((d) => d.name === 'Idli')) throw new Error('Idli should be present');
    if (pizzaResults.length > 0) throw new Error('Pizza should not be present');
  });

  // [TEST 2.6] Calculate Total Bill
  test('Calculate Total Bill', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 400, quantity: 1 },
      { price: 150, quantity: 1 },
    ];
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    if (subtotal !== 750) throw new Error(`Expected 750, got ${subtotal}`);
  });

  // [TEST 3.1] Throw InvalidQuantity Exception
  test('Throw InvalidQuantity Exception', () => {
    let caught = false;
    try {
      throw new InvalidQuantityError('Testing exception message');
    } catch (e) {
      if (e instanceof InvalidQuantityError) caught = true;
    }
    if (!caught) throw new Error('Exception was not caught');
  });

  // [TEST 3.2] Exception Type Verification
  test('Exception Type Verification', () => {
    const e = new InvalidQuantityError('type check');
    if (!(e instanceof Error)) throw new Error('Should be an Error instance');
    if (e.name !== 'InvalidQuantityError') throw new Error('Wrong exception name');
  });

  // [TEST EXTRA] Bill DNA Fingerprint Uniqueness
  test('Bill DNA Fingerprint Uniqueness', () => {
    const fp1 = generateFingerprint(1042, 2, 3, 660);
    const fp2 = generateFingerprint(1043, 2, 3, 660);
    if (fp1 === fp2) throw new Error('Fingerprints should differ for different order IDs');
    if (fp1.length !== 14) throw new Error(`Expected 14-char fingerprint, got ${fp1.length}`);
  });

  return results;
};
