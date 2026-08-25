import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, AlertTriangle, Plus, Check, RefreshCw, Lock,
  Flame, Utensils, Sparkles, ShieldCheck, ArrowRight, RotateCcw
} from 'lucide-react';
import {
  getInventory, restockIngredient, resetInventoryToDefault,
  DISH_RECIPES, getAvailablePortions, isDishSoldOut
} from '../utils/recipeInventoryEngine';

export default function InventoryManager({ order, onNavigate, addToast }) {
  const [inventory, setInventory] = useState(() => getInventory());
  const [selectedDishRecipe, setSelectedDishRecipe] = useState('Chicken Biryani');
  const [customRestockQty, setCustomRestockQty] = useState(5.0);

  const refreshStock = useCallback(() => {
    setInventory(getInventory());
  }, []);

  useEffect(() => {
    window.addEventListener('plateflow-inventory-updated', refreshStock);
    const interval = setInterval(refreshStock, 2000);
    return () => {
      window.removeEventListener('plateflow-inventory-updated', refreshStock);
      clearInterval(interval);
    };
  }, [refreshStock]);

  const handleRestock = (ingredientId, amount) => {
    const updated = restockIngredient(ingredientId, amount);
    setInventory(updated);
    const ing = updated.find((i) => i.id === ingredientId);
    if (addToast) {
      addToast(`Restocked ${ing?.name} (+${amount} ${ing?.unit}). Stock: ${ing?.stock} ${ing?.unit}`, 'success');
    }
  };

  const handleResetAll = () => {
    const def = resetInventoryToDefault();
    setInventory(def);
    if (addToast) addToast('All raw ingredients reset to factory full stock levels', 'success');
  };

  // Compute sold out and low stock dishes
  const dishStatusList = useMemo(() => {
    return Object.keys(DISH_RECIPES).map((dishName) => {
      const portions = getAvailablePortions(dishName, inventory);
      const isSold = portions <= 0;
      return {
        name: dishName,
        portions,
        isSoldOut: isSold,
        recipe: DISH_RECIPES[dishName],
      };
    });
  }, [inventory]);

  const soldOutDishes = dishStatusList.filter((d) => d.isSoldOut);
  const lowStockIngredients = inventory.filter((i) => i.stock <= i.minStock);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <Package size={24} />
            <h1 className="heading-md text-xl sm:text-2xl text-ivory-50">
              Recipe Bill of Materials (BOM) &amp; Stock Defense
            </h1>
          </div>
          <p className="text-sm text-graphite-400 mt-1">
            Real-time raw ingredient depletion ➡️ Menu auto-lock when ingredients deplete
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('dishes')}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <Utensils size={14} /> Menu Explorer
            </button>
          )}
          <button
            onClick={handleResetAll}
            className="btn-secondary py-2.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 text-graphite-300 hover:text-ivory-100"
            title="Reset all stock to factory defaults"
          >
            <RotateCcw size={13} /> Reset All Stock
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {soldOutDishes.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-400 animate-pulse">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <span>AUTO-LOCK ACTIVE: {soldOutDishes.length} menu dishes are currently SOLD OUT: </span>
              <span className="text-ivory-100 font-mono underline">
                {soldOutDishes.map((d) => d.name).join(', ')}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-red-300 shrink-0">
            Grayed out in Dish Explorer
          </span>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-base p-4">
          <div className="text-[10px] text-graphite-500 uppercase tracking-widest font-mono font-bold">Total Ingredients</div>
          <div className="text-2xl font-black text-ivory-100 font-mono mt-1">{inventory.length}</div>
          <div className="text-xs text-graphite-400 mt-0.5">Tracked in kitchen</div>
        </div>

        <div className="card-base p-4">
          <div className="text-[10px] text-graphite-500 uppercase tracking-widest font-mono font-bold">Low Stock Alert</div>
          <div className={`text-2xl font-black font-mono mt-1 ${lowStockIngredients.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStockIngredients.length}
          </div>
          <div className="text-xs text-graphite-400 mt-0.5">Below safe minimum</div>
        </div>

        <div className="card-base p-4">
          <div className="text-[10px] text-graphite-500 uppercase tracking-widest font-mono font-bold">Sold Out Dishes</div>
          <div className={`text-2xl font-black font-mono mt-1 ${soldOutDishes.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {soldOutDishes.length}
          </div>
          <div className="text-xs text-graphite-400 mt-0.5">Locked from cart</div>
        </div>

        <div className="card-base p-4">
          <div className="text-[10px] text-graphite-500 uppercase tracking-widest font-mono font-bold">Auto-Depletion</div>
          <div className="text-2xl font-black text-accent font-mono mt-1">REAL-TIME</div>
          <div className="text-xs text-graphite-400 mt-0.5">Syncs with KDS Prep</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Raw Ingredients Stock List */}
        <div className="lg:col-span-2 card-base p-4 sm:p-6 bg-graphite-900 border border-graphite-700 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
            <h2 className="heading-sm text-sm sm:text-base font-bold flex items-center gap-2">
              <span>Raw Ingredients Stock Levels</span>
              <span className="text-xs font-mono text-graphite-400">({inventory.length} items)</span>
            </h2>
            <span className="text-[11px] text-graphite-500 font-mono">1-Click Restock</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventory.map((ing) => {
              const isLow = ing.stock <= ing.minStock;
              const isCritical = ing.stock <= 0.1;
              const maxGauge = ing.minStock * 4;
              const percent = Math.min(100, Math.round((ing.stock / maxGauge) * 100));

              return (
                <div
                  key={ing.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-red-500/10 border-red-500/40 text-red-300'
                      : isLow
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-graphite-800/80 border-graphite-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ing.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-ivory-100">{ing.name}</div>
                        <div className="text-[10px] text-graphite-400 font-mono">Min: {ing.minStock} {ing.unit}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-base font-black font-mono ${
                        isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-accent'
                      }`}>
                        {ing.stock.toFixed(2)} <span className="text-xs font-normal text-graphite-400">{ing.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Meter */}
                  <div className="mt-2.5 space-y-1">
                    <div className="w-full bg-graphite-900 h-1.5 rounded-full overflow-hidden border border-graphite-700/50">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCritical ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Restock Buttons */}
                  <div className="mt-3 pt-2 border-t border-graphite-700/50 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleRestock(ing.id, ing.unit === 'L' ? 5.0 : 5.0)}
                      className="flex-1 py-1 px-2 rounded bg-graphite-700/60 hover:bg-accent text-graphite-200 hover:text-graphite-950 text-[11px] font-bold font-mono transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={11} /> +5 {ing.unit}
                    </button>
                    <button
                      onClick={() => handleRestock(ing.id, ing.unit === 'L' ? 10.0 : 10.0)}
                      className="flex-1 py-1 px-2 rounded bg-graphite-700/60 hover:bg-accent text-graphite-200 hover:text-graphite-950 text-[11px] font-bold font-mono transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={11} /> +10 {ing.unit}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recipe BOM & Menu Availability Matrix */}
        <div className="card-base p-4 sm:p-6 bg-graphite-900 border border-graphite-700 space-y-4">
          <div className="pb-2 border-b border-graphite-800">
            <h2 className="heading-sm text-sm sm:text-base font-bold flex items-center gap-2">
              <span>Dish Availability &amp; BOM</span>
            </h2>
            <p className="text-xs text-graphite-400 mt-0.5">Portions cookable from current stock</p>
          </div>

          {/* Dish Portions List */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {dishStatusList.map((dish) => {
              const isSelected = selectedDishRecipe === dish.name;
              return (
                <div
                  key={dish.name}
                  onClick={() => setSelectedDishRecipe(dish.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    dish.isSoldOut
                      ? 'bg-red-500/10 border-red-500/40 text-red-300'
                      : isSelected
                        ? 'bg-accent/15 border-accent ring-1 ring-accent text-ivory-100'
                        : 'bg-graphite-800/80 border-graphite-700 text-graphite-300 hover:border-graphite-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs sm:text-sm text-ivory-50 flex items-center gap-2">
                      {dish.isSoldOut ? <Lock size={13} className="text-red-400 shrink-0" /> : <Utensils size={13} className="text-accent shrink-0" />}
                      <span>{dish.name}</span>
                    </div>

                    <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      dish.isSoldOut
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : dish.portions <= 5
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {dish.isSoldOut ? 'SOLD OUT' : `${dish.portions} plates left`}
                    </div>
                  </div>

                  {/* Recipe Ingredients Preview */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-graphite-700/60 space-y-1 animate-fadeIn">
                      <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                        Recipe BOM Requirements (per 1 plate):
                      </div>
                      <div className="space-y-1">
                        {dish.recipe.map((req, rIdx) => {
                          const rawIng = inventory.find((i) => i.id === req.ingredientId);
                          return (
                            <div key={rIdx} className="flex justify-between text-[11px] font-mono text-graphite-300">
                              <span>• {rawIng?.name || req.ingredientId}</span>
                              <span className="text-accent">{req.qty} {req.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
