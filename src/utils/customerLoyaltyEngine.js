/**
 * PlateFlow Customer Loyalty & Taste DNA Engine
 * Connects Bill DNA Hashes ➡️ Repeat Patron Profiler ➡️ Auto-Applied Perks in Thermal Bill
 */

export const LOYALTY_STORAGE_KEY = 'plateflow-loyalty-members';

export const LOYALTY_TIERS = {
  BRONZE: {
    id: 'BRONZE',
    name: 'Bronze Patron',
    icon: '🥉',
    minVisits: 1,
    discountPercent: 0,
    perk: 'Fresh Mints & Royal Mouth Freshener',
    badgeClass: 'bg-amber-700/20 text-amber-500 border-amber-600/30',
  },
  SILVER: {
    id: 'SILVER',
    name: 'Silver Patron',
    icon: '🥈',
    minVisits: 3,
    discountPercent: 5,
    perk: 'Complimentary Kumbakonam Filter Coffee',
    badgeClass: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
  },
  GOLD: {
    id: 'GOLD',
    name: 'Gold VIP Patron',
    icon: '🥇',
    minVisits: 6,
    discountPercent: 10,
    perk: 'Chef Special Gulab Jamun & Priority Prep',
    badgeClass: 'bg-accent/20 text-accent border-accent/40',
  },
  PLATINUM: {
    id: 'PLATINUM',
    name: 'Platinum Royale',
    icon: '👑',
    minVisits: 10,
    discountPercent: 15,
    perk: 'Free Appetizer + Dedicated Chef Table Perks',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
};

export const DEFAULT_MEMBERS = [
  {
    phone: '9876543210',
    name: 'Vikram Sundaram',
    tier: 'GOLD',
    visits: 7,
    totalSpent: 4850,
    favouriteDishes: ['Chicken Biryani', 'Kumbakonam Filter Coffee'],
    tasteDna: 'Spicy Non-Veg & Traditional Coffee Lover',
    lastVisitedDna: 'PLT-SEC-7A4B92C1',
  },
  {
    phone: '9123456780',
    name: 'Ananya Sharma',
    tier: 'SILVER',
    visits: 4,
    totalSpent: 2200,
    favouriteDishes: ['Dosa', 'Idli'],
    tasteDna: 'Pure South Indian Breakfast Enthusiast',
    lastVisitedDna: 'PLT-SEC-3F1E804D',
  },
  {
    phone: '9988776655',
    name: 'Rajesh Kumar',
    tier: 'PLATINUM',
    visits: 12,
    totalSpent: 9400,
    favouriteDishes: ['Mutton Fry', 'Chicken Biryani', 'Gulab Jamun'],
    tasteDna: 'Grand Royal Feasting & Sweet Connoisseur',
    lastVisitedDna: 'PLT-SEC-9B04E15F',
  },
];

/**
 * Get all registered loyalty members from localStorage
 */
export function getLoyaltyMembers() {
  try {
    const raw = localStorage.getItem(LOYALTY_STORAGE_KEY);
    if (!raw) return DEFAULT_MEMBERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MEMBERS;
  } catch {
    return DEFAULT_MEMBERS;
  }
}

/**
 * Save loyalty members to localStorage
 */
export function saveLoyaltyMembers(members) {
  try {
    localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(members));
    window.dispatchEvent(new Event('plateflow-loyalty-updated'));
  } catch (e) {
    console.warn('[PlateFlow] saveLoyaltyMembers error:', e);
  }
}

/**
 * Lookup patron by 10-digit mobile number
 */
export function findPatronByPhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean || clean.length < 5) return null;
  const members = getLoyaltyMembers();
  return members.find((m) => m.phone === clean) || null;
}

/**
 * Calculate loyalty tier based on visits count
 */
export function calculateTier(visitsCount) {
  if (visitsCount >= 10) return LOYALTY_TIERS.PLATINUM;
  if (visitsCount >= 6) return LOYALTY_TIERS.GOLD;
  if (visitsCount >= 3) return LOYALTY_TIERS.SILVER;
  return LOYALTY_TIERS.BRONZE;
}

/**
 * Derive Taste DNA profile string from ordered items history
 */
export function deriveTasteDna(items) {
  if (!items || items.length === 0) return 'Standard Dining Connoisseur';
  const names = items.map((i) => i.name.toLowerCase());

  const hasBiryani = names.some((n) => n.includes('biryani') || n.includes('mutton'));
  const hasDosa = names.some((n) => n.includes('dosa') || n.includes('idli'));
  const hasCoffee = names.some((n) => n.includes('coffee') || n.includes('chai'));
  const hasSweet = names.some((n) => n.includes('jamun') || n.includes('ice cream'));

  if (hasBiryani && hasSweet) return 'Royal Feast & Dessert Lover';
  if (hasBiryani) return 'Authentic Biryani & Spiced Meat Enthusiast';
  if (hasDosa && hasCoffee) return 'Traditional South Indian Morning Regular';
  if (hasDosa) return 'Crisp Dosa & Pure Vegetarian Regular';
  return 'Gourmet Dining Patron';
}

/**
 * Register or update patron after bill completion with Bill DNA
 */
export function recordPatronVisit({ phone, name, orderItems, grandTotal, billDnaHash }) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean || clean.length < 10) return null;

  const members = getLoyaltyMembers();
  const existingIdx = members.findIndex((m) => m.phone === clean);

  if (existingIdx >= 0) {
    const existing = members[existingIdx];
    const newVisits = existing.visits + 1;
    const newTier = calculateTier(newVisits);
    const newSpent = Number((existing.totalSpent + Number(grandTotal || 0)).toFixed(0));

    const itemNames = (orderItems || []).map((i) => i.name);
    const mergedFavs = [...new Set([...existing.favouriteDishes, ...itemNames])].slice(0, 5);

    const updated = {
      ...existing,
      name: name || existing.name,
      visits: newVisits,
      tier: newTier.id,
      totalSpent: newSpent,
      favouriteDishes: mergedFavs,
      tasteDna: deriveTasteDna(orderItems || []),
      lastVisitedDna: billDnaHash || existing.lastVisitedDna,
    };

    members[existingIdx] = updated;
    saveLoyaltyMembers(members);
    return updated;
  } else {
    // New Member
    const newMember = {
      phone: clean,
      name: name || 'Valued Patron',
      tier: 'BRONZE',
      visits: 1,
      totalSpent: Number(grandTotal || 0),
      favouriteDishes: (orderItems || []).map((i) => i.name).slice(0, 3),
      tasteDna: deriveTasteDna(orderItems || []),
      lastVisitedDna: billDnaHash || 'PLT-SEC-INIT',
    };

    members.unshift(newMember);
    saveLoyaltyMembers(members);
    return newMember;
  }
}
