import { AlertCircle, X, ShieldAlert, Check } from 'lucide-react';

export default function QuantityGuard({ guardData, data, onClose, onConfirm }) {
  const activeData = guardData || data;
  if (!activeData) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guard-title"
    >
      <div className="card-base p-6 sm:p-8 max-w-md w-full mx-auto space-y-6 animate-slideIn border-red-500/40 shadow-2xl shadow-red-950/40">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 rounded-xl border border-red-500/30 text-red-400">
              <ShieldAlert size={26} className="animate-pulse" />
            </div>
            <div>
              <h3 id="guard-title" className="font-bold text-lg text-ivory-100 flex items-center gap-2">
                QUANTITY GUARD
              </h3>
              <p className="text-xs text-red-400 font-mono">InvalidQuantity Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-graphite-400 hover:text-ivory-100 rounded-lg hover:bg-graphite-700/50 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Reason / Exception Warning */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
            <AlertCircle size={15} />
            <span>Invalid State Intercepted</span>
          </div>
          <p className="text-sm text-red-200">
            {activeData.reason ||
              `Operation on "${activeData.itemName || 'Dish'}" violates billing integrity. Negative or excess counts are blocked.`}
          </p>
        </div>

        {/* Data Comparison Matrix */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-graphite-800 p-4 rounded-xl border border-graphite-700 text-center">
            <div className="text-[11px] text-graphite-400 uppercase tracking-wider font-mono">Available Plates</div>
            <div className="text-2xl sm:text-3xl font-bold text-ivory-100 font-mono mt-1">
              {activeData.available ?? 0}
            </div>
            <div className="text-[10px] text-graphite-500 mt-1">in active order</div>
          </div>

          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 text-center">
            <div className="text-[11px] text-red-400 uppercase tracking-wider font-mono">Requested</div>
            <div className="text-2xl sm:text-3xl font-bold text-red-400 font-mono mt-1">
              {activeData.requested ?? 0}
            </div>
            <div className="text-[10px] text-red-400/80 mt-1">exceeds limits</div>
          </div>
        </div>

        {/* Protection Status Banner */}
        <div className="flex items-center justify-between px-4 py-3 bg-graphite-800 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-graphite-300 font-mono">JAVA EXCEPTION SHIELD</span>
          </div>
          <span className="px-2.5 py-1 bg-red-500/20 text-red-300 font-mono font-bold text-xs rounded-md border border-red-500/30">
            BLOCKED
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary py-2.5 text-sm font-semibold hover:bg-graphite-700/50"
          >
            Adjust Quantity
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="flex-1 btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>Confirm Valid Count</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
