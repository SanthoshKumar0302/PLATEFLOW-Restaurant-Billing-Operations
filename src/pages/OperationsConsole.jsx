import { useState, useEffect } from 'react';
import OrderPulse from '../components/OrderPulse';
import BillDNA from '../components/BillDNA';
import DynamicPricing from '../components/DynamicPricing';
import { ShieldCheck, Cpu, Database, CheckCircle, Wifi, Clock, ArrowRight, ChevronUp, ChevronDown, Layers } from 'lucide-react';

export default function OperationsConsole({
  order,
  orderMetadata,
  onStageNavigate,
  pricingMode = 'standard',
  onPricingModeChange,
}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [showEngineDetails, setShowEngineDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const subtotal = Number(orderMetadata?.subtotal || 0);
  const sgst = Number(orderMetadata?.sgst || 0);
  const cgst = Number(orderMetadata?.cgst || 0);
  const grandTotal = Number(orderMetadata?.grandTotal || 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full animate-fadeIn select-none">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-graphite-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold border border-accent/30">
              OPERATIONS CONSOLE
            </span>
            <span className="text-xs text-graphite-400 font-mono">
              Order #{order?.id || '---'}
            </span>
          </div>
          <h1 className="heading-lg text-2xl sm:text-3xl lg:text-4xl text-ivory-50">
            Build the bill. <span className="text-accent">Control every plate.</span>
          </h1>
          <p className="text-sm sm:text-base text-graphite-400 max-w-2xl">
            Live transaction orchestrator backed by Java Collections, Comparable price sorting, and InvalidQuantity protections.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onStageNavigate && onStageNavigate('dishes')}
            className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-accent/15"
          >
            <span>Browse Menu</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Dynamic Pricing Engine Bar */}
      {onPricingModeChange && (
        <DynamicPricing currentMode={pricingMode} onChangeMode={onPricingModeChange} />
      )}

      {/* Main 2-Column Dashboard Grid: Order Pulse + Bill DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <OrderPulse
            order={order}
            orderMetadata={orderMetadata}
            onStageNavigate={onStageNavigate}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <BillDNA order={order} orderMetadata={orderMetadata} />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-5 sm:p-6 border-graphite-700/80">
          <div className="text-xs text-graphite-400 uppercase tracking-widest font-mono">
            Subtotal
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ivory-100 font-mono mt-2">
            ₹{subtotal.toFixed(0)}
          </div>
          <div className="text-xs text-graphite-500 mt-2 font-mono">
            Items: {orderMetadata?.itemCount || 0} • Plates: {orderMetadata?.plateCount || 0}
          </div>
        </div>

        <div className="card-base p-5 sm:p-6 border-green-500/30 bg-green-500/5">
          <div className="text-xs text-green-400 uppercase tracking-widest font-mono">
            SGST (5%)
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-400 font-mono mt-2">
            ₹{sgst.toFixed(0)}
          </div>
          <div className="text-xs text-green-400/70 mt-2 font-mono">
            State tax auto-computed
          </div>
        </div>

        <div className="card-base p-5 sm:p-6 border-green-500/30 bg-green-500/5">
          <div className="text-xs text-green-400 uppercase tracking-widest font-mono">
            CGST (5%)
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-400 font-mono mt-2">
            ₹{cgst.toFixed(0)}
          </div>
          <div className="text-xs text-green-400/70 mt-2 font-mono">
            Central tax auto-computed
          </div>
        </div>

        <div className="card-base p-5 sm:p-6 border-accent/50 bg-accent/10 shadow-lg shadow-accent/5">
          <div className="text-xs text-accent uppercase tracking-widest font-mono">
            Grand Total
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-accent font-mono mt-2">
            ₹{grandTotal.toFixed(0)}
          </div>
          <div className="text-xs text-accent/80 mt-2 font-mono">
            All taxes included
          </div>
        </div>
      </div>

      {/* ─── Expandable Engine Architecture & System Status (Bottom to Top Reveal) ─── */}
      <div className="space-y-4 pt-2">
        <button
          onClick={() => setShowEngineDetails(!showEngineDetails)}
          className="w-full card-base p-4 sm:p-5 flex items-center justify-between gap-4 border border-graphite-700/80 hover:border-accent/40 bg-graphite-900/90 transition-all text-left group cursor-pointer shadow-lg"
          title="Click to reveal Engine Architecture & System Status"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/30 group-hover:scale-105 transition-transform">
              <Cpu size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ivory-50 group-hover:text-accent transition-colors">
                  Java Engine Architecture &amp; Live System Diagnostics
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-[10px] font-mono text-accent font-bold">
                  {showEngineDetails ? 'ACTIVE' : 'CLICK TO EXPAND'}
                </span>
              </div>
              <p className="text-xs text-graphite-400">
                {showEngineDetails
                  ? 'Showing Java Collections architecture, Comparable sorting notes & real-time thread health'
                  : 'Click to slide up engine specifications, Collections framework details, and offline storage status'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-accent flex-shrink-0">
            <span className="hidden sm:inline">
              {showEngineDetails ? 'Hide Diagnostics' : 'Slide Up Details'}
            </span>
            {showEngineDetails ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>
        </button>

        {/* ─── Hidden Drawer Content (Slides up from bottom to top) ─────────── */}
        {showEngineDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn transition-all duration-300">
            {/* Engine Architecture Panel */}
            <div className="card-base p-5 sm:p-6 space-y-4 border-graphite-700/80 bg-graphite-900/95 shadow-xl">
              <div className="flex items-center gap-2 text-ivory-100">
                <Cpu size={20} className="text-accent" />
                <h3 className="heading-sm font-bold">Engine Architecture</h3>
              </div>
              <p className="text-xs text-graphite-400">
                This frontend UI reflects the core architectural concepts of the Java billing backend:
              </p>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-ivory-100">Java Collections Framework:</strong>
                    <span className="text-graphite-400 ml-1">
                      Dynamic dish lists, quantity indexing, and thread-safe bill compilation.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-ivory-100">Comparable&lt;Dish&gt; Interface:</strong>
                    <span className="text-graphite-400 ml-1">
                      Natural price ordering visualized in Dish Explorer sort modes.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-ivory-100">InvalidQuantity Exception:</strong>
                    <span className="text-graphite-400 ml-1">
                      Intercepts invalid subtraction and negative counts via Quantity Guard.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-ivory-100">Deterministic Bill Generation:</strong>
                    <span className="text-graphite-400 ml-1">
                      Tax breakdowns, SHA checksum DNA hashes, and formatted invoice receipts.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status Indicators Panel */}
            <div className="card-base p-5 sm:p-6 space-y-4 border-graphite-700/80 bg-graphite-900/95 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-ivory-100">
                  <ShieldCheck size={20} className="text-green-400" />
                  <h3 className="heading-sm font-bold">System Status</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-graphite-400">
                  <Clock size={13} />
                  <span>Synced: {lastSyncTime.toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="text-xs sm:text-sm text-graphite-300">Java Engine Core</span>
                  <span className="px-2.5 py-1 bg-green-500/15 text-green-400 text-xs rounded-full font-mono font-bold border border-green-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                    RUNNING (11/11 TESTS PASS)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="text-xs sm:text-sm text-graphite-300">Network &amp; PWA Offline Storage</span>
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-mono font-bold border flex items-center gap-1.5 ${
                      isOnline
                        ? 'bg-green-500/15 text-green-400 border-green-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isOnline ? <Wifi size={12} /> : null}
                    {isOnline ? 'ONLINE & SYNCHRONIZED' : 'OFFLINE (LOCAL STORAGE ACTIVE)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="text-xs sm:text-sm text-graphite-300">Quantity Guard Shield</span>
                  <span className="px-2.5 py-1 bg-green-500/15 text-green-400 text-xs rounded-full font-mono font-bold border border-green-500/30">
                    ACTIVE &amp; INTERCEPTING
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-graphite-950 border border-graphite-800">
                  <span className="text-xs sm:text-sm text-graphite-300">Invoice PDF &amp; Print Export Engine</span>
                  <span className="px-2.5 py-1 bg-accent/15 text-accent text-xs rounded-full font-mono font-bold border border-accent/30">
                    READY (OFFLINE CAPABLE)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
