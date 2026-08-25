// ─── Automated Online Culinary Knowledge & Flavor Profile Engine ─────────────
export const CULINARY_DESCRIPTIONS = {
  // ── Food (Main Course) ───────────────────────────────────────────────────
  idli: 'Steamed fluffy fermented rice & urad dal cakes, served piping hot with fresh coconut chutney & aromatic drumstick sambar.',
  'chicken biryani': 'Fragrant long-grain aged basmati rice slow-cooked dum style with tender spiced chicken, saffron, mint, and caramelized birista.',
  biryani: 'Aromatic layered basmati rice infused with whole garam masala, saffron milk, fresh mint, and chef special spices.',
  dosa: 'Crispy golden fermented crepe roasted with pure desi ghee, paired with tomato-onion relish & spicy lentil curry.',
  pulao: 'Fragrant Kerala jeerakasala rice gently simmered with whole spices, tender vegetables, golden fried cashews, and pure ghee.',
  'butter naan': 'Hand-stretched leavened flatbread freshly baked in a scorching clay tandoor, brushed generously with pure salted butter.',
  'paneer butter masala': 'Tender malai cottage cheese cubes simmered in a velvety, buttery tomato-cashew gravy infused with kasuri methi.',

  // ── Starters ─────────────────────────────────────────────────────────────
  'chicken 65': 'Deep-fried spicy boneless chicken cubes tempered with fresh curry leaves, crushed garlic, and fiery green chillies.',
  'gobi manchurian': 'Crispy batter-fried cauliflower florets tossed in a sizzling ginger-garlic soya sauce glaze and fresh spring onions.',
  'paneer tikka': 'Fresh cottage cheese cubes marinated in spiced mustard oil yogurt and chargrilled to smoky perfection on tandoor skewers.',
  'prawn fry': 'Succulent coastal tiger prawns shallow-fried with crushed Malabar black pepper, curry leaves, and roasted shallots masala.',

  // ── Desserts ─────────────────────────────────────────────────────────────
  'gulab jamun': 'Golden-fried soft milk-solid khoya dumplings soaked in warm rosewater and green cardamom-infused sugar syrup.',
  'ice cream': 'Velvety smooth gourmet ice cream crafted from pure dairy cream, offered in rich vanilla bean, Belgian chocolate, or Alphonso mango.',
  kesari: 'Traditional South Indian saffron-infused semolina dessert roasted in pure desi ghee with crunchy cashews and golden raisins.',

  // ── Hot Drinks ───────────────────────────────────────────────────────────
  'filter coffee': 'Authentic Kumbakonam dark-roasted chicory-blended decoction frothed with boiling whole milk in a traditional brass dabarah.',
  coffee: 'Freshly brewed aromatic dark roast coffee prepared with whole milk and natural raw cane sugar.',
  'masala tea': 'Aromatic strong Assam CTC black tea brewed with crushed ginger root, green cardamom, cloves, and whole milk.',
  tea: 'Handcrafted spiced black tea boiled with fresh crushed ginger and mountain spices.',

  // ── Soft Drinks ──────────────────────────────────────────────────────────
  'fresh lime soda': 'Zesty hand-squeezed fresh green lime juice topped with chilled sparkling soda, available in sweet, salted, or mixed.',
  'mango lassi': 'Rich, creamy churned sweet curd blended with authentic Alphonso mango pulp and a touch of green cardamom.',
  buttermilk: 'Chilled spiced churned yogurt tempered with roasted cumin, green chillies, ginger, and fresh coriander leaves.',

  // ── Beverages ────────────────────────────────────────────────────────────
  'cold coffee': 'Thick blended espresso coffee shaken with chilled whole milk, vanilla ice cream, and dark chocolate drizzle.',
  'fresh juice': '100% natural, cold-pressed fruit juice extracted fresh from seasonal oranges, sweet limes, or crisp watermelon without preservatives.',
  'mineral water': 'Packaged natural purified mountain spring drinking water, UV-sterilized with added essential healthy minerals.',
};

/**
 * Automatically fetch or synthesize an authentic culinary description
 * for any dish based on dish name, category, and ingredient notes.
 */
export const getCulinaryDescription = (dishName = '', category = 'food', currentDesc = '') => {
  const cleanName = String(dishName).toLowerCase().trim();

  // 1. Direct dictionary match
  if (CULINARY_DESCRIPTIONS[cleanName]) {
    return CULINARY_DESCRIPTIONS[cleanName];
  }

  // 2. Keyword fuzzy match
  for (const [key, desc] of Object.entries(CULINARY_DESCRIPTIONS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return desc;
    }
  }

  // 3. If dish already has a detailed custom description (not just placeholder), use it
  if (currentDesc && currentDesc.length > 25 && !currentDesc.includes('Signature') && !currentDesc.includes('Freshly prepared')) {
    return currentDesc;
  }

  // 4. Synthesize online-style culinary description by category & name
  const cat = String(category).toLowerCase();
  if (cat.includes('drink') || cat.includes('hot')) {
    return `Freshly brewed handcrafted ${dishName}, prepared with premium tea leaves, roasted beans, and aromatic warming spices.`;
  }
  if (cat.includes('soft') || cat.includes('beverage')) {
    return `Chilled refreshing ${dishName}, freshly prepared with natural ingredients, sparkling fizz, and cooling herbal notes.`;
  }
  if (cat.includes('dessert') || cat.includes('sweet')) {
    return `Artisanal sweet delicacy, crafted with pure desi ghee, organic milk solids, saffron essence, and roasted dry fruits.`;
  }
  if (cat.includes('starter') || cat.includes('snack')) {
    return `Crispy golden appetizers tossed in chef secret spice rub, tempered with fresh curry leaves and garlic dip.`;
  }

  return `Authentic gourmet ${dishName}, prepared fresh to order with traditional culinary spices and fresh farm ingredients.`;
};
