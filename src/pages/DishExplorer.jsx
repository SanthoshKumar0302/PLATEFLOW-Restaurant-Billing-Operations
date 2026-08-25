import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, ShieldCheck, LogIn, LogOut, Plus, Trash2,
  ArrowUpDown, Sparkles, ChevronRight, Tag, Utensils, Lock, AlertTriangle, ShieldAlert, Heart, Zap, Flame, Clock
} from 'lucide-react';
import DishTile from '../components/DishTile';
import QuantityGuard from '../components/QuantityGuard';
import DietaryConflictModal from '../components/DietaryConflictModal';
import {
  searchDishes, sortDishesByPrice, DISH_CATEGORIES, UPSELL_PAIRINGS,
} from '../utils/billingEngine';
import { getCulinaryDescription } from '../utils/culinaryDescriptions';
import { getInventory, getAvailablePortions, isDishSoldOut } from '../utils/recipeInventoryEngine';
import { DIETARY_PROFILES, filterDishesByDietary, checkDietaryConflict } from '../utils/dietaryAllergyEngine';
import {
  applyDynamicPricingToDishes, getActivePricingMode, PRICING_MODES, savePricingConfig, getPricingConfig
} from '../utils/dynamicPricingEngine';

export default function DishExplorer({
  dishes = [],
  order,
  onAddDish,
  onRemoveDish,
  onUpdateDish,
  onAddMenuDish,
  onRemoveMenuDish,
  adminCredentials,
  isAdminLoggedIn,
  onAdminLogin,
  onAdminLogout,
  onGenerateAdminCredentials,
  addToast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDietaryFilter, setActiveDietaryFilter] = useState('all');
  const [activeAllergyGuard, setActiveAllergyGuard] = useState('all');
  const [conflictModalData, setConflictModalData] = useState(null);
  const [guardModalData, setGuardModalData] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newDish, setNewDish] = useState({ name: '', description: '', price: '', category: 'food' });
  const [liveInventory, setLiveInventory] = useState(() => getInventory());
  const [activePricingMode, setActivePricingMode] = useState(() => getActivePricingMode());

  // Listen for real-time inventory and pricing updates
  useEffect(() => {
    const handleInvUpdate = () => setLiveInventory(getInventory());
    const handlePriceUpdate = () => setActivePricingMode(getActivePricingMode());
    window.addEventListener('plateflow-inventory-updated', handleInvUpdate);
    window.addEventListener('plateflow-pricing-updated', handlePriceUpdate);
    const interval = setInterval(() => {
      handleInvUpdate();
      handlePriceUpdate();
    }, 2000);
    return () => {
      window.removeEventListener('plateflow-inventory-updated', handleInvUpdate);
      window.removeEventListener('plateflow-pricing-updated', handlePriceUpdate);
      clearInterval(interval);
    };
  }, []);

  const orderItems = order?.items ?? [];
  const cartCount = orderItems.reduce((s, i) => s + (i.quantity || 0), 0);

  // Automatically enrich dishes with authentic culinary descriptions
  const enrichedDishes = useMemo(() => {
    return dishes.map((d) => ({
      ...d,
      description: getCulinaryDescription(d.name, d.category, d.description),
    }));
  }, [dishes]);

  // Apply dynamic surge / happy-hour pricing (I ➡️ J ➡️ A)
  const dynamicallyPricedDishes = useMemo(() => {
    return applyDynamicPricingToDishes(enrichedDishes, activePricingMode?.id);
  }, [enrichedDishes, activePricingMode]);

  // 1. Filter by search query
  const searched = searchDishes(dynamicallyPricedDishes, searchQuery);

  // 2. Filter by dietary profile (Vegan, Veg, Jain, Gluten-Free, Nut-Free)
  const dietaryFiltered = filterDishesByDietary(searched, activeDietaryFilter);

  // 3. Filter by category tab (with food/main alias support)
  const categoryFiltered = activeCategory === 'all'
    ? dietaryFiltered
    : dietaryFiltered.filter((d) => d.category === activeCategory || (activeCategory === 'food' && d.category === 'main'));

  // 4. Sort via Comparable<Dish>
  const displayedDishes = sortDishesByPrice(categoryFiltered, sortOrder);

  // Safe Add Dish with Allergy Guard Conflict Validation
  const handleSafeAddDish = (dishId) => {
    const target = dishes.find((d) => d.id === dishId);
    if (!target) return;

    if (activeAllergyGuard !== 'all') {
      const conflict = checkDietaryConflict(target.name, activeAllergyGuard);
      if (conflict.hasConflict) {
        const profile = DIETARY_PROFILES.find((p) => p.id === activeAllergyGuard);
        setConflictModalData({
          dishId,
          dishName: target.name,
          reason: conflict.reason,
          profileLabel: profile?.label || 'Custom Diet',
        });
        return;
      }
    }
    onAddDish(dishId);
  };

  // 4. Smart upsell panel — derive suggestions from cart categories
  const upsellSuggestions = useMemo(() => {
    if (!orderItems.length) return [];
    const cartCategories = [...new Set(orderItems.map((i) => i.category).filter(Boolean))];
    const suggestCategories = [...new Set(cartCategories.flatMap((c) => UPSELL_PAIRINGS[c] || []))];
    const cartIds = new Set(orderItems.map((i) => i.id));

    return suggestCategories
      .flatMap((cat) => enrichedDishes.filter((d) => d.category === cat && !cartIds.has(d.id)))
      .slice(0, 6);
  }, [orderItems, enrichedDishes]);

  const handleAdminLogin = (event) => {
    event.preventDefault();
    const { username, password } = loginForm;
    if (username === adminCredentials.username && password === adminCredentials.password) {
      onAdminLogin();
      setLoginForm({ username: '', password: '' });
      addToast('Admin access granted', 'success');
      return;
    }
    addToast('Invalid admin username or password', 'error');
  };

  const handleAddMenuDish = (event) => {
    event.preventDefault();
    if (!newDish.name.trim()) { addToast('Dish name is required', 'error'); return; }
    const nextPrice = Number(newDish.price);
    if (Number.isNaN(nextPrice) || nextPrice <= 0) { addToast('Dish price must be greater than zero', 'error'); return; }
    onAddMenuDish({
      name: newDish.name.trim(),
      description: getCulinaryDescription(newDish.name.trim(), newDish.category || 'food', newDish.description.trim()),
      price: nextPrice,
      category: newDish.category || 'food',
    });
    setNewDish({ name: '', description: '', price: '', category: 'food' });
    addToast('New dish added to the hotel menu', 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold border border-accent/30">
            DISH EXPLORER
          </span>
          <span className="text-xs text-graphite-400 font-mono">
            {dishes.length} Menu Items · {DISH_CATEGORIES.length - 1} Categories
          </span>
        </div>
        <h1 className="heading-md text-xl sm:text-2xl lg:text-3xl text-ivory-50">
          Browse Menu & Build Your Order
        </h1>
        <p className="text-sm text-graphite-400">
          Explore dishes by category, search by name, and add to your bill. Natural price sorting via Comparable&lt;Dish&gt;.
        </p>
      </div>

      {/* Search Bar */}
      <div className="card-base p-4 sm:p-5 space-y-4 border-graphite-700/80 shadow-lg shadow-graphite-950/30">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3.5 text-graphite-400" />
          <input
            type="text"
            placeholder="Search dishes... (e.g. Biryani, Coffee, Gulab)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-graphite-900 border border-graphite-700 rounded-xl text-ivory-100 placeholder-graphite-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-graphite-400 hover:text-ivory-100 bg-graphite-800 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-graphite-400 font-mono">
            {searchQuery
              ? <><strong className="text-accent">{displayedDishes.length}</strong> results for &quot;{searchQuery}&quot;</>
              : <><strong className="text-ivory-100">{displayedDishes.length}</strong> dishes in <strong className="text-accent">{DISH_CATEGORIES.find(c => c.id === activeCategory)?.label || 'All'}</strong></>
            }
          </span>

          <div className="flex items-center gap-2">
            {sortOrder !== 'default' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 border border-accent/40 rounded-lg text-accent text-xs font-mono font-bold animate-fadeIn">
                <ArrowUpDown size={13} />
                <span>COMPARABLE MODE → {sortOrder === 'price-low' ? 'PRICE ASC' : 'PRICE DESC'}</span>
              </div>
            )}
            <span className="text-xs text-graphite-400 uppercase tracking-wider font-mono">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 bg-graphite-900 border border-graphite-700 rounded-lg text-xs text-ivory-100 focus:outline-none focus:border-accent font-medium transition-colors"
              aria-label="Sort dishes"
            >
              <option value="default">Default Order</option>
              <option value="price-low">Lowest Price (Comparable Asc)</option>
              <option value="price-high">Highest Price (Comparable Desc)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Category & Dietary Filter Toolbar ─────────────────────────────── */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-1 min-w-max sm:min-w-0 sm:flex-wrap">
            {DISH_CATEGORIES.map((cat) => {
              const count = cat.id === 'all'
                ? dishes.length
                : dishes.filter((d) => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-accent text-graphite-950 border-accent shadow-md shadow-accent/30'
                      : 'bg-graphite-900 text-graphite-300 border-graphite-700 hover:bg-graphite-800 hover:text-ivory-100'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className="text-xs font-mono font-bold opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Filter & Allergy Guard Bar */}
        <div className="p-3 rounded-2xl bg-graphite-900 border border-graphite-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Dietary Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-mono font-bold text-graphite-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mr-1">
              <Heart size={12} className="text-accent" /> Diet:
            </span>
            {DIETARY_PROFILES.map((dp) => (
              <button
                key={dp.id}
                onClick={() => setActiveDietaryFilter(dp.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 border ${
                  activeDietaryFilter === dp.id
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold shadow-sm'
                    : 'bg-graphite-800/80 text-graphite-400 border-graphite-700 hover:text-ivory-100'
                }`}
                title={dp.description}
              >
                <span>{dp.icon}</span>
                <span>{dp.label}</span>
              </button>
            ))}
          </div>

          {/* Active Allergy Guard Selector */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <ShieldAlert size={13} /> Table Allergy Guard:
            </span>
            <select
              value={activeAllergyGuard}
              onChange={(e) => {
                setActiveAllergyGuard(e.target.value);
                const prof = DIETARY_PROFILES.find((p) => p.id === e.target.value);
                if (e.target.value !== 'all' && addToast) {
                  addToast(`Table Allergy Guard set to "${prof?.label}". Non-compliant dishes will trigger warning defense.`, 'success');
                }
              }}
              className="px-3 py-1 bg-graphite-800 border border-red-500/40 rounded-lg text-xs text-ivory-100 font-semibold font-mono focus:outline-none focus:border-red-400"
            >
              <option value="all">None (Allow All)</option>
              <option value="jain">🕉️ Strict Jain (No Onion/Garlic)</option>
              <option value="vegan">🌱 Strict Vegan (Zero Dairy/Meat)</option>
              <option value="veg">🥬 Pure Veg (No Meat)</option>
              <option value="gluten_free">🌾 Gluten Allergy (Zero Wheat)</option>
              <option value="nut_free">🥜 Nut Allergy (Zero Cashews/Nuts)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Surge & Happy-Hour Pricing Bar (Subgraph 4: J -> A) */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-graphite-900 via-graphite-900 to-accent/5 border border-accent/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/20 text-accent">
              <Zap size={15} />
            </span>
            <div>
              <div className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <span>Dynamic Pricing Engine (J ➡️ A):</span>
                <span className="text-ivory-100 font-bold">{activePricingMode?.label}</span>
              </div>
              <div className="text-[10px] text-graphite-400">
                {activePricingMode?.description}
              </div>
            </div>
          </div>

          {/* Pricing Mode Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {Object.values(PRICING_MODES).map((pm) => (
              <button
                key={pm.id}
                onClick={() => {
                  savePricingConfig({ autoMode: false, manualOverride: pm.id });
                  setActivePricingMode(pm);
                  if (addToast) addToast(`Pricing set to "${pm.label}" (${pm.multiplier}x)`, 'success');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap border ${
                  activePricingMode?.id === pm.id
                    ? 'bg-accent text-graphite-950 border-accent shadow-sm'
                    : 'bg-graphite-800 text-graphite-400 border-graphite-700 hover:text-ivory-100'
                }`}
              >
                <span>{pm.icon} {pm.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dish Grid (Fluid Responsive Columns) ─────────────────────────── */}
      {displayedDishes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {displayedDishes.map((dish, index) => {
            const orderItem = orderItems.find((i) => i.id === dish.id);
            const currentQuantity = orderItem?.quantity || 0;
            const portionsAvailable = getAvailablePortions(dish.name, liveInventory);
            return (
              <DishTile
                key={dish.id}
                dish={dish}
                index={index + 1}
                quantity={currentQuantity}
                portions={portionsAvailable}
                onAdd={handleSafeAddDish}
                onRemove={onRemoveDish}
                onGuardTrigger={(data) => setGuardModalData(data)}
              />
            );
          })}
        </div>
      ) : (
        <div className="card-base p-12 text-center space-y-3 border-graphite-700/60">
          <div className="text-3xl">🔍</div>
          <h3 className="text-lg font-bold text-ivory-100">No dishes found</h3>
          <p className="text-sm text-graphite-400 max-w-md mx-auto">
            {searchQuery
              ? `No items matched "${searchQuery}" in the current category.`
              : 'No dishes in this category yet.'}
          </p>
          <div className="flex justify-center gap-2">
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-secondary text-xs mt-2">
                Reset Search
              </button>
            )}
            {activeCategory !== 'all' && (
              <button onClick={() => setActiveCategory('all')} className="btn-secondary text-xs mt-2">
                Show All Categories
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Smart Upsell Panel (optional, appears when cart has items) ─────── */}
      {upsellSuggestions.length > 0 && (
        <div className="card-base p-5 sm:p-6 border border-accent/25 bg-accent/5 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-accent/20 text-accent">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="font-bold text-ivory-100 text-sm">You might also like…</h3>
              <p className="text-xs text-graphite-400 mt-0.5">
                Optional add-ons based on what&apos;s in your order. Select freely — nothing is added automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {upsellSuggestions.map((dish) => {
              const catMeta = DISH_CATEGORIES.find((c) => c.id === dish.category);
              return (
                <button
                  key={dish.id}
                  onClick={() => onAddDish(dish.id)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-graphite-900 border border-graphite-700 hover:border-accent/50 hover:bg-accent/10 transition-all text-center"
                >
                  <span className="text-2xl">{catMeta?.emoji ?? '🍽️'}</span>
                  <span className="text-xs font-semibold text-ivory-100 line-clamp-2 leading-tight">{dish.name}</span>
                  <span className="text-xs font-mono font-bold text-accent">₹{dish.price}</span>
                  <span className="flex items-center gap-1 text-[10px] text-graphite-400 group-hover:text-accent transition-colors mt-0.5">
                    <Plus size={10} /> Add to Bill
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Admin Menu Management ─────────────────────────────────────────── */}
      <div className="card-base p-5 sm:p-6 border-graphite-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-graphite-800">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <h3 className="heading-sm text-sm sm:text-base font-bold">
              Menu Configuration & Hotel Admin Portal
            </h3>
          </div>
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-400 font-mono font-semibold">Admin Active</span>
              <button onClick={onAdminLogout} className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-red-300">
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <span className="text-xs text-graphite-400 font-mono">
              Default: <code className="text-accent">{adminCredentials.username}</code> / <code className="text-accent">{adminCredentials.password}</code>
            </span>
          )}
        </div>

        {isAdminLoggedIn ? (
          <form onSubmit={handleAddMenuDish} className="space-y-3 p-4 bg-graphite-900 rounded-xl border border-graphite-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent font-mono">Add New Dish to Engine</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Dish Name"
                value={newDish.name}
                onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                className="px-3 py-2 bg-graphite-800 border border-graphite-700 rounded-lg text-sm text-ivory-100 focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Description"
                value={newDish.description}
                onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                className="px-3 py-2 bg-graphite-800 border border-graphite-700 rounded-lg text-sm text-ivory-100 focus:outline-none focus:border-accent"
              />
              <select
                value={newDish.category}
                onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                className="px-3 py-2 bg-graphite-800 border border-graphite-700 rounded-lg text-sm text-ivory-100 focus:outline-none focus:border-accent"
              >
                {DISH_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newDish.price}
                  onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                  className="w-full px-3 py-2 bg-graphite-800 border border-graphite-700 rounded-lg text-sm text-ivory-100 focus:outline-none focus:border-accent"
                />
                <button type="submit" className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Existing dish list with delete */}
            {dishes.length > 0 && (
              <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
                <div className="text-[10px] text-graphite-500 uppercase tracking-widest font-mono mb-2">All Menu Items ({dishes.length})</div>
                {dishes.map((dish) => {
                  const catMeta = DISH_CATEGORIES.find((c) => c.id === dish.category);
                  return (
                    <div key={dish.id} className="flex items-center justify-between px-3 py-2 bg-graphite-800/60 rounded-lg text-xs group">
                      <div className="flex items-center gap-2">
                        <span>{catMeta?.emoji ?? '🍽️'}</span>
                        <span className="text-ivory-100 font-medium">{dish.name}</span>
                        <span className="text-graphite-500 font-mono">₹{dish.price}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { onRemoveMenuDish(dish.id); addToast(`${dish.name} removed from menu`, 'info'); }}
                        className="text-graphite-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title={`Remove ${dish.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="px-3 py-1.5 bg-graphite-900 border border-graphite-700 rounded-lg text-xs text-ivory-100 focus:outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="px-3 py-1.5 bg-graphite-900 border border-graphite-700 rounded-lg text-xs text-ivory-100 focus:outline-none focus:border-accent"
            />
            <button type="submit" className="btn-primary py-1.5 px-3 text-xs font-semibold flex items-center gap-1">
              <LogIn size={13} /> Admin Login
            </button>
          </form>
        )}
      </div>

      {/* Quantity Guard Modal */}
      <QuantityGuard
        data={guardModalData}
        onClose={() => setGuardModalData(null)}
        onConfirm={() => setGuardModalData(null)}
      />

      {/* Dietary & Allergen Conflict Warning Modal */}
      <DietaryConflictModal
        isOpen={Boolean(conflictModalData)}
        onClose={() => setConflictModalData(null)}
        dishName={conflictModalData?.dishName}
        conflictReason={conflictModalData?.reason}
        activeProfileLabel={conflictModalData?.profileLabel}
        onConfirmOverride={() => {
          if (conflictModalData?.dishId) {
            onAddDish(conflictModalData.dishId);
          }
        }}
      />
    </div>
  );
}
