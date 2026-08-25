import { Percent, TrendingUp, Clock, Zap } from 'lucide-react';

export default function DynamicPricing({ currentMode = 'standard', onChangeMode }) {
  const modes = [
    {
      id: 'standard',
      name: 'Standard Rates',
      discount: 0,
      badge: 'NORMAL PRICE',
      description: 'Regular menu rates with standard 5%+5% GST',
      color: 'text-ivory-100 border-graphite-600',
    },
    {
      id: 'happy-hour',
      name: 'Happy Hour (20% OFF)',
      discount: -20,
      badge: '20% OFF HAPPY HOUR',
      description: 'Automated 20% discount on beverages & appetizers',
      color: 'text-green-400 border-green-500/40 bg-green-500/10',
    },
    {
      id: 'surge',
      name: 'Peak Hour Surge (+10%)',
      discount: 10,
      badge: 'PEAK SURGE +10%',
      description: 'Weekend peak rate adjustments for busy dining hours',
      color: 'text-accent border-accent/40 bg-accent/10',
    },
  ];

  return (
    <div className="card-base p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent">
          <Percent size={20} />
          <h3 className="heading-sm">Dynamic Pricing & Surge Engine</h3>
        </div>

        <div className="flex items-center gap-1 text-xs text-graphite-400 font-mono">
          <Clock size={14} className="text-accent" />
          <span>Real-time Rate Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeMode && onChangeMode(mode.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                isActive
                  ? 'bg-graphite-800 border-accent shadow-lg ring-1 ring-accent/40'
                  : 'bg-graphite-900/60 border-graphite-700/80 hover:border-graphite-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-ivory-100">{mode.name}</span>
                  {isActive && <Zap size={16} className="text-accent fill-accent" />}
                </div>
                <p className="text-xs text-graphite-400 mt-1">{mode.description}</p>
              </div>

              <div className="pt-2 border-t border-graphite-700/40 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${mode.color}`}>
                  {mode.badge}
                </span>
                <span className="text-xs font-mono font-bold text-accent">
                  {mode.discount === 0 ? '1.0x' : mode.discount > 0 ? `+${mode.discount}%` : `${mode.discount}%`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
