import { ChevronRight, CheckCircle2, CircleDot } from 'lucide-react';

export default function OrderPulse({ order, orderMetadata, onStageNavigate }) {
  const itemCount = Number(orderMetadata?.itemCount || order?.items?.length || 0);
  const plateCount = Number(orderMetadata?.plateCount || 0);
  const grandTotal = Number(orderMetadata?.grandTotal || 0);
  const sgst = Number(orderMetadata?.sgst || 0);
  const cgst = Number(orderMetadata?.cgst || 0);
  const hasOrder = Boolean(order?.id);
  const hasDishes = itemCount > 0;
  const hasQuantity = plateCount > 0;
  const hasTotal = grandTotal > 0;
  const isCompleted = order?.status === 'COMPLETED';

  const stages = [
    { id: 'operations', step: 1, label: 'ORDER CREATED', active: hasOrder, description: 'Order session initialized' },
    { id: 'dishes', step: 2, label: 'DISHES ADDED', active: hasDishes, description: `${itemCount} menu items selected` },
    { id: 'bill', step: 3, label: 'QUANTITY VERIFIED', active: hasQuantity, description: `${plateCount} plates validated` },
    { id: 'bill', step: 4, label: 'TOTAL CALCULATED', active: hasTotal, description: `₹${grandTotal.toFixed(0)} with 10% GST` },
    { id: 'preview', step: 5, label: 'BILL GENERATED', active: isCompleted, description: isCompleted ? 'Invoice ready & archived' : 'Pending final billing' },
  ];

  return (
    <div className="card-base p-5 sm:p-7 space-y-6 border-graphite-700/80 shadow-lg shadow-graphite-950/40">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold text-accent tracking-widest uppercase font-mono">
            ORDER PULSE
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-ivory-50 mt-0.5">
            5-Stage Transaction Timeline
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30">
          <span className="w-2 h-2 bg-accent rounded-full animate-ping"></span>
          <span className="text-xs font-bold font-mono text-accent">
            {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
        </div>
      </div>

      {/* Interactive Timeline Stages */}
      <div className="space-y-2.5">
        {stages.map((stage, index) => {
          return (
            <button
              key={`${stage.label}-${index}`}
              type="button"
              onClick={() => onStageNavigate && onStageNavigate(stage.id)}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl transition-all text-left border ${
                stage.active
                  ? 'bg-accent/10 border-accent/40 text-ivory-50 hover:bg-accent/15'
                  : 'bg-graphite-900/60 border-graphite-700/40 text-graphite-500 hover:bg-graphite-800'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-colors ${
                  stage.active
                    ? 'bg-accent text-graphite-950 shadow-md shadow-accent/20'
                    : 'bg-graphite-800 text-graphite-400 border border-graphite-700'
                }`}
              >
                {stage.active ? <CheckCircle2 size={16} /> : stage.step}
              </div>

              {/* Stage label and description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs sm:text-sm font-bold tracking-wide ${
                      stage.active ? 'text-accent' : 'text-graphite-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {stage.active && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/20 text-green-400 font-mono font-semibold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-graphite-400 truncate mt-0.5">
                  {stage.description}
                </p>
              </div>

              <ChevronRight
                size={16}
                className={`flex-shrink-0 ${stage.active ? 'text-accent' : 'text-graphite-700'}`}
              />
            </button>
          );
        })}
      </div>

      <div className="divider"></div>

      {/* Real-time Order Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-base p-3 bg-graphite-900/70 text-center border-graphite-700/60">
          <div className="text-[10px] text-graphite-500 uppercase tracking-wider font-mono">Dishes</div>
          <div className="text-xl sm:text-2xl font-bold text-ivory-100 font-mono mt-1">{itemCount}</div>
        </div>
        <div className="card-base p-3 bg-graphite-900/70 text-center border-graphite-700/60">
          <div className="text-[10px] text-graphite-500 uppercase tracking-wider font-mono">Plates</div>
          <div className="text-xl sm:text-2xl font-bold text-ivory-100 font-mono mt-1">{plateCount}</div>
        </div>
        <div className="card-base p-3 bg-graphite-900/70 text-center border-accent/40 bg-accent/5">
          <div className="text-[10px] text-accent uppercase tracking-wider font-mono">Bill Amount</div>
          <div className="text-xl sm:text-2xl font-bold text-accent font-mono mt-1">₹{grandTotal.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}
