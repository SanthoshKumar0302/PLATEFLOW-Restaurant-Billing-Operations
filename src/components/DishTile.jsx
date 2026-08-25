import { useState, useMemo } from 'react';
import { Plus, Minus, Sparkles, Lock, Flame, ShieldAlert } from 'lucide-react';
import { DISH_CATEGORIES } from '../utils/billingEngine';
import { getAvailablePortions } from '../utils/recipeInventoryEngine';
import { getDishDietaryInfo } from '../utils/dietaryAllergyEngine';

export default function DishTile({
  dish,
  index,
  quantity = 0,
  onAdd,
  onRemove,
  onGuardTrigger,
  portions = null,
}) {
  const [shaking, setShaking] = useState(false);

  // Compute live available portions from recipe BOM if not provided as prop
  const availablePortions = useMemo(() => {
    if (typeof portions === 'number') return portions;
    return getAvailablePortions(dish.name);
  }, [dish.name, portions]);

  const isSoldOut = availablePortions <= 0;
  const dietaryInfo = useMemo(() => getDishDietaryInfo(dish.name), [dish.name]);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  };

  const handleDecrease = () => {
    if (quantity <= 0) {
      triggerShake();
      if (onGuardTrigger) {
        onGuardTrigger({
          available: 0,
          requested: -1,
          itemName: dish.name,
          reason: `Cannot decrease ${dish.name} below 0 plates.`,
        });
      }
      return;
    }
    if (onRemove) onRemove(dish.id);
  };

  const handleAdd = () => {
    if (isSoldOut) {
      triggerShake();
      if (onGuardTrigger) {
        onGuardTrigger({
          available: 0,
          requested: 1,
          itemName: dish.name,
          reason: `"${dish.name}" is currently SOLD OUT due to depleted raw recipe stock in kitchen inventory.`,
        });
      }
      return;
    }

    if (quantity >= availablePortions) {
      triggerShake();
      if (onGuardTrigger) {
        onGuardTrigger({
          available: availablePortions,
          requested: quantity + 1,
          itemName: dish.name,
          reason: `Cannot order more than ${availablePortions} plate(s) of "${dish.name}". Kitchen raw stock limit reached.`,
        });
      }
      return;
    }

    if (quantity >= 99) {
      triggerShake();
      if (onGuardTrigger) {
        onGuardTrigger({
          available: 99,
          requested: 100,
          itemName: dish.name,
          reason: `Maximum limit of 99 plates reached for ${dish.name}.`,
        });
      }
      return;
    }
    if (onAdd) onAdd(dish.id);
  };

  const categoryMeta = DISH_CATEGORIES.find((c) => c.id === dish.category) || { emoji: '🍽️', label: 'Special' };

  return (
    <div
      className={`card-base p-5 sm:p-6 flex flex-col justify-between transition-all group select-none relative overflow-hidden ${
        isSoldOut
          ? 'opacity-60 grayscale-[35%] border-red-900/60 bg-graphite-900/80'
          : 'hover:border-accent/60'
      } ${shaking ? 'animate-shake border-red-500/80 shadow-lg shadow-red-950/30' : ''}`}
    >
      {/* Sold Out Watermark / Banner */}
      {isSoldOut && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider font-mono">
          <Lock size={11} />
          <span>SOLD OUT</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Dish Number & Category Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">
            #{String(index).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5">
            {!isSoldOut && availablePortions <= 5 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 font-mono">
                <Flame size={10} className="animate-pulse" />
                <span>Only {availablePortions} left</span>
              </span>
            )}
            <span className="text-[11px] font-semibold text-graphite-300 px-2 py-0.5 rounded-full bg-graphite-800 border border-graphite-700/80 flex items-center gap-1">
              <span>{categoryMeta.emoji}</span>
              <span>{categoryMeta.label}</span>
            </span>
          </div>
        </div>

        {/* Dish Name & Rich Culinary Description */}
        <div className="space-y-1.5">
          <h3 className={`text-lg sm:text-xl font-bold transition-colors ${
            isSoldOut ? 'text-graphite-400 line-through' : 'text-ivory-50 group-hover:text-accent'
          }`}>
            {dish.name}
          </h3>
          <p className="text-xs text-graphite-300 leading-relaxed font-normal">
            {dish.description || 'Authentic culinary recipe prepared fresh to order with pure ingredients.'}
          </p>

          {/* Dietary & Allergy Tags */}
          {dietaryInfo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {dietaryInfo.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-graphite-800/80 text-graphite-300 border border-graphite-700/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-graphite-800">
        {/* Price Tag with Dynamic Surge/Discount */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-graphite-500 uppercase tracking-wider font-mono">Price</span>
              {dish.basePrice && dish.basePrice !== dish.price && (
                <span className="text-xs text-graphite-500 line-through font-mono">
                  ₹{dish.basePrice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-accent font-mono">₹{dish.price}</div>
              {dish.basePrice && dish.price < dish.basePrice && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono border border-emerald-500/40">
                  SAVE ₹{dish.basePrice - dish.price}
                </span>
              )}
              {dish.basePrice && dish.price > dish.basePrice && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold font-mono border border-amber-500/40">
                  +₹{dish.price - dish.basePrice} Surge
                </span>
              )}
            </div>
          </div>
          {quantity > 0 && (
            <span className="text-xs font-semibold px-2 py-1 bg-accent/20 text-accent rounded-full border border-accent/30 font-mono">
              {quantity} in bill
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          {quantity > 0 && !isSoldOut && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-graphite-900 rounded-lg border border-graphite-700">
              <button
                type="button"
                onClick={handleDecrease}
                className="p-1.5 hover:bg-graphite-800 rounded text-graphite-400 hover:text-ivory-100 transition-colors"
                title="Decrease plates"
                aria-label={`Decrease ${dish.name} plates`}
              >
                <Minus size={16} />
              </button>
              <span className="font-mono font-bold text-sm text-ivory-100">
                {quantity} {quantity === 1 ? 'plate' : 'plates'}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={quantity >= availablePortions}
                className="p-1.5 hover:bg-graphite-800 rounded text-accent hover:text-accent/80 transition-colors disabled:opacity-30"
                title="Increase plates"
                aria-label={`Increase ${dish.name} plates`}
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={isSoldOut}
            className={`w-full py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg transition-all ${
              isSoldOut
                ? 'bg-graphite-800 text-graphite-500 cursor-not-allowed border border-graphite-700'
                : 'btn-primary shadow-md shadow-accent/10'
            }`}
          >
            {isSoldOut ? (
              <>
                <Lock size={14} />
                <span>SOLD OUT (NO STOCK)</span>
              </>
            ) : (
              <>
                <Plus size={15} />
                <span>{quantity > 0 ? 'ADD MORE PLATES' : 'ADD TO ORDER'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
