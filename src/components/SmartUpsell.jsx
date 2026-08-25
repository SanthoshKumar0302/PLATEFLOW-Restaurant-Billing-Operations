import { Sparkles, Plus, X, Check } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function SmartUpsell({ activeDish, onAddCombo, onClose }) {
  const [added, setAdded] = useState(false);

  const suggestion = useMemo(() => {
    if (!activeDish) return null;
    const name = activeDish.name.toLowerCase();

    if (name.includes('biryani')) {
      return {
        id: 'combo-biryani',
        title: 'Royal Biryani Companion Set',
        description: 'Pair your Biryani with Raita, Mirchi Ka Salan & Beverage',
        price: 60,
        items: ['Special Raita', 'Mirchi Ka Salan', 'Chilled Beverage'],
        originalPrice: 90,
      };
    }
    if (name.includes('idli') || name.includes('dosa')) {
      return {
        id: 'combo-tiffin',
        title: 'Authentic South Combo Bundle',
        description: 'Pair with Hot Filter Coffee & Extra Ghee Sambar',
        price: 40,
        items: ['Kumbakonam Filter Coffee', 'Extra Ghee Sambar'],
        originalPrice: 60,
      };
    }
    return {
      id: 'combo-chef',
      title: 'Chef Special Dessert Pair',
      description: 'Add Gulab Jamun & Ice Cream to complete your meal',
      price: 50,
      items: ['Gulab Jamun (2 pcs)', 'Vanilla Scoop'],
      originalPrice: 80,
    };
  }, [activeDish]);

  if (!suggestion) return null;

  const handleAdd = () => {
    setAdded(true);
    if (onAddCombo) {
      onAddCombo({
        id: Date.now(),
        name: suggestion.title,
        price: suggestion.price,
        description: suggestion.description,
        quantity: 1,
      });
    }
    setTimeout(() => {
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="card-base max-w-md w-full p-6 space-y-5 bg-graphite-900 border border-accent/40 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-graphite-400 hover:text-ivory-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* AI Header Badge */}
        <div className="flex items-center gap-2 text-accent">
          <div className="p-2 bg-accent/10 rounded-lg border border-accent/30">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-accent">AI SMART UPSELL ENGINE</div>
            <h3 className="heading-sm text-ivory-100">Recommended Dish Pairing</h3>
          </div>
        </div>

        {/* Selected Dish Reference */}
        <div className="bg-graphite-800/60 p-3 rounded-lg border border-graphite-700/80 text-xs text-graphite-300">
          Selected Dish: <strong className="text-ivory-100">{activeDish.name}</strong> (₹{activeDish.price})
        </div>

        {/* Combo Offer Card */}
        <div className="bg-gradient-to-r from-accent/10 via-graphite-800 to-graphite-800 p-4 rounded-xl border border-accent/30 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-ivory-100 text-base">{suggestion.title}</h4>
              <p className="text-xs text-graphite-400 mt-0.5">{suggestion.description}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-graphite-500 line-through">₹{suggestion.originalPrice}</div>
              <div className="text-lg font-bold text-accent">₹{suggestion.price}</div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-[10px] uppercase font-bold text-graphite-400 tracking-wider">Includes:</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestion.items.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-graphite-700/60 text-ivory-100 text-xs rounded border border-graphite-600"
                >
                  + {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAdd}
          disabled={added}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            added
              ? 'bg-green-500 text-graphite-950'
              : 'btn-primary hover:bg-accent/90 shadow-lg shadow-accent/20'
          }`}
        >
          {added ? (
            <>
              <Check size={18} />
              Combo Added to Order!
            </>
          ) : (
            <>
              <Plus size={18} />
              Add Combo to Order (+₹{suggestion.price})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
