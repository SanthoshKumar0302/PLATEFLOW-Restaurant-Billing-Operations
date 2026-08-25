import { Plus, Minus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function BillItem({ item, onQuantityChange, onRemove, onGuardTrigger }) {
  const [shaking, setShaking] = useState(false);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  };

  const handleDecrease = () => {
    if (item.quantity <= 1) {
      // Trying to decrease below 1 via minus or removal
      if (onRemove) onRemove();
      return;
    }
    onQuantityChange(-1);
  };

  const handleIncrease = () => {
    if (item.quantity >= 99) {
      triggerShake();
      if (onGuardTrigger) {
        onGuardTrigger({
          available: 99,
          requested: 100,
          itemName: item.name,
          reason: `Maximum plate limit (99) reached for ${item.name}.`,
        });
      }
      return;
    }
    onQuantityChange(1);
  };

  return (
    <div
      className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-graphite-700/20 transition-all ${
        shaking ? 'animate-shake bg-red-500/10 border-l-4 border-red-500' : ''
      }`}
    >
      <div className="flex-1">
        <h4 className="font-bold text-base text-ivory-100">{item.name}</h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-graphite-400">
          <span className="font-mono font-semibold text-accent">₹{item.price}</span>
          <span>×</span>
          <span className="font-mono text-ivory-200">
            {item.quantity} plate{item.quantity !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t border-graphite-700/40 sm:border-t-0">
        {/* Line Total */}
        <div className="text-left sm:text-right mr-1 sm:mr-3">
          <div className="text-[10px] text-graphite-500 uppercase tracking-wider font-mono">Line Total</div>
          <div className="text-base sm:text-lg font-bold text-accent font-mono">
            ₹{(item.price * item.quantity).toFixed(0)}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1.5 bg-graphite-900 px-2 py-1 rounded-lg border border-graphite-700">
          <button
            type="button"
            onClick={handleDecrease}
            className="p-1.5 hover:bg-graphite-800 rounded-md text-graphite-400 hover:text-ivory-100 transition-colors"
            title="Decrease plate count"
            aria-label={`Decrease ${item.name} quantity`}
          >
            <Minus size={15} />
          </button>
          <span className="w-8 text-center font-bold text-sm text-ivory-100 font-mono">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={handleIncrease}
            className="p-1.5 hover:bg-graphite-800 rounded-md text-accent hover:text-accent/80 transition-colors"
            title="Increase plate count"
            aria-label={`Increase ${item.name} quantity`}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 hover:bg-red-500/20 text-graphite-400 hover:text-red-400 rounded-lg transition-colors"
          title="Remove dish from bill"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}
