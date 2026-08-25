import { AlertOctagon, AlertTriangle, X, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { getDishDietaryInfo } from '../utils/dietaryAllergyEngine';

export default function DietaryConflictModal({
  isOpen,
  onClose,
  dishName,
  conflictReason,
  activeProfileLabel,
  onConfirmOverride,
}) {
  if (!isOpen) return null;

  const info = getDishDietaryInfo(dishName);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="card-base max-w-md w-full bg-graphite-900 border border-red-500/50 shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6 space-y-5 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-graphite-400 hover:text-ivory-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert size={26} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-red-400 tracking-wider">
              Dietary &amp; Allergen Conflict
            </div>
            <h3 className="heading-sm text-lg font-bold text-ivory-50">
              Active Restriction Warning
            </h3>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 space-y-2 text-xs">
          <div className="font-semibold text-red-300">
            Table Allergy Profile: <span className="font-bold underline text-ivory-100">{activeProfileLabel}</span>
          </div>
          <p className="text-graphite-300 leading-relaxed">
            {conflictReason || `"${dishName}" contains ingredients that conflict with your active dietary settings.`}
          </p>
        </div>

        {/* Allergen Breakdown */}
        {info.allergens.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono font-bold text-graphite-400 uppercase tracking-widest">
              Allergens Present in {dishName}:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {info.allergens.map((alg, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-graphite-800 text-amber-300 border border-amber-500/30"
                >
                  ⚠️ {alg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary py-2.5 text-xs font-semibold text-graphite-300"
          >
            Cancel &amp; Keep Safe
          </button>
          <button
            onClick={() => {
              onConfirmOverride();
              onClose();
            }}
            className="flex-1 btn-primary py-2.5 text-xs font-bold bg-red-500 hover:bg-red-400 text-graphite-950 border border-red-400 flex items-center justify-center gap-1.5"
          >
            <span>Add to Order Anyway</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>
    </div>
  );
}
