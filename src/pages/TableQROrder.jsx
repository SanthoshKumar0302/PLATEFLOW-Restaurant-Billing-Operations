import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Utensils, Clock, CheckCircle2, ChefHat, Bell,
  Star, Receipt, Printer, RotateCcw, Quote, Sparkles, Eye, Users
} from 'lucide-react';
import { getSavedHotelLocation, formatHotelAddress } from '../utils/indiaLocations';
import {
  getKitchenTickets, getAllTableStatuses, getActiveOrders,
} from '../utils/orderBroadcast';
import BillSplitterModal from '../components/BillSplitterModal';

// ─── KFC-style 4-stage pipeline ───────────────────────────────────────────────
const STAGE_DURATION_SEC = 50;

const ORDER_STAGES = [
  { id: 'RECEIVED',  label: 'Order Received',  subLabel: 'Your order is confirmed and sent to kitchen', icon: Bell,         color: 'text-emerald-400', ring: 'ring-emerald-400', bg: 'bg-emerald-400/15', dotColor: 'bg-emerald-400' },
  { id: 'PREPARING', label: 'Preparing',        subLabel: 'Chef is crafting your meal with fresh ingredients', icon: ChefHat, color: 'text-amber-400',   ring: 'ring-amber-400',   bg: 'bg-amber-400/15',   dotColor: 'bg-amber-400' },
  { id: 'READY',     label: 'Ready to Serve',   subLabel: 'Your delicious food is plated & on its way!', icon: Star,          color: 'text-accent',      ring: 'ring-accent',      bg: 'bg-accent/15',      dotColor: 'bg-accent' },
  { id: 'SERVED',    label: 'Served',           subLabel: 'Enjoy your warm culinary meal!', icon: CheckCircle2,               color: 'text-emerald-400', ring: 'ring-emerald-400', bg: 'bg-emerald-400/15', dotColor: 'bg-emerald-400' },
];

const FOOD_QUOTES = [
  { quote: "Cooking is an art, but all art requires knowing something about the techniques and materials.", author: "Nathan Myhrvold", tag: "Culinary Art" },
  { quote: "Food brings people together on many different levels. It's nourishment of the soul and body.", author: "Giada De Laurentiis", tag: "Dining Joy" },
  { quote: "One cannot think well, love well, sleep well, if one has not dined well.", author: "Virginia Woolf", tag: "Philosophy" },
  { quote: "People who love to eat are always the best people.", author: "Julia Child", tag: "Foodie Spirit" },
  { quote: "Good food is the foundation of genuine happiness and heartfelt laughter.", author: "Auguste Escoffier", tag: "Tradition" },
  { quote: "To eat is a necessity, but to eat intelligently and delightfully is an art.", author: "François de La Rochefoucauld", tag: "Gastronomy" },
  { quote: "The secret of good cooking is simple: fresh spices, authentic fire, and honest love.", author: "Master Chef", tag: "Kitchen Secret" },
  { quote: "A meal without aroma is like a day without sunshine.", author: "Jean Anthelme Brillat-Savarin", tag: "Flavor" },
];

const STATUS_KEY = 'plateflow-ticket-status';
const TABLE_KEY = 'plateflow-current-table';
const TIMER_KEY = 'plateflow-stage-started-at';

function getStageIndex(statusId) {
  const idx = ORDER_STAGES.findIndex((s) => s.id === statusId);
  return idx === -1 ? 0 : idx;
}

function getStageForTable(tableNo) {
  try {
    const all = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
    return all[tableNo] || null;
  } catch { return null; }
}

function getTimerForTable(tableNo) {
  try {
    const ts = Number(localStorage.getItem(`${TIMER_KEY}-${tableNo}`)) || 0;
    if (!ts) return 0;
    return Math.max(0, Math.floor((Date.now() - ts) / 1000));
  } catch { return 0; }
}

// ─── Compact Thermal Receipt ──────────────────────────────────────────────────
function ThermalReceipt({ order, onPrint }) {
  const items = order?.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity || 0), 0);
  const sgst = subtotal * 0.05;
  const cgst = subtotal * 0.05;
  const grandTotal = subtotal + sgst + cgst;
  const invoiceNo = `INV-2026-${String(order?.id || '06645').padStart(5, '0')}`;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="animate-fadeIn w-full max-w-[340px] mx-auto">
      <div className="no-print flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-ivory-100 flex items-center gap-1.5">
          <Receipt size={14} className="text-accent" /> Customer Receipt
        </h3>
        <button onClick={onPrint} className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1">
          <Printer size={12} /> Print
        </button>
      </div>
      <div id="thermal-receipt" className="bg-white text-zinc-900 rounded-2xl p-5 shadow-2xl border border-zinc-200 font-sans select-none">
        <div className="text-center pb-3 space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-amber-600 font-bold">◆</span>
            <span className="text-base font-black text-amber-600 tracking-widest uppercase">PLATEFLOW</span>
          </div>
          <div className="text-[9px] font-semibold text-zinc-500 uppercase">FINE DINING • RESTAURANT OPERATIONS</div>
          <div className="text-[9px] font-mono text-zinc-400">GSTIN: 33AAAAA0000A1Z5</div>
        </div>
        <div className="py-2 border-t border-dashed border-zinc-300 space-y-1 text-xs font-mono">
          <div className="flex justify-between"><span className="text-zinc-600">Invoice</span><span className="font-bold text-zinc-900">{invoiceNo}</span></div>
          <div className="flex justify-between"><span className="text-zinc-600">Order ID</span><span className="font-bold text-zinc-900">#{order?.id || 6645}</span></div>
          <div className="flex justify-between"><span className="text-zinc-600">Date</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span className="text-zinc-600">Time</span><span>{timeStr}</span></div>
        </div>
        <div className="py-2 border-t border-dashed border-zinc-300">
          <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase font-mono pb-1"><span>ITEM</span><span>QTY</span><span>AMOUNT</span></div>
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-mono py-0.5">
              <span className="truncate pr-1 font-medium">{item.name}</span>
              <span className="text-zinc-500 text-[11px]">{item.quantity}×₹{item.price}</span>
              <span className="font-bold">₹{(item.quantity * item.price).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="py-2 border-t border-dashed border-zinc-300 space-y-1 text-xs font-mono">
          <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>SGST (5%)</span><span>₹{sgst.toFixed(2)}</span></div>
          <div className="flex justify-between text-zinc-600"><span>CGST (5%)</span><span>₹{cgst.toFixed(2)}</span></div>
          <div className="border-t-2 border-zinc-900 pt-1.5 mt-1 flex justify-between font-black text-sm text-zinc-900"><span>GRAND TOTAL</span><span>₹{grandTotal.toFixed(0)}</span></div>
        </div>
        <div className="py-1 text-center text-[9px] font-mono text-zinc-400">Checksum: PLT-SEC-635B0895</div>
        <div className="pt-3 border-t border-dashed border-zinc-300 text-center space-y-2">
          <div style={{ color: '#d97706', fontSize: '12px', fontWeight: 'bold' }}>Thank you for dining with us! 🙏</div>
          <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '6px 8px', margin: '4px auto', textAlign: 'center' }}>
            <div style={{ color: '#78350f', fontSize: '10px', fontStyle: 'italic', fontWeight: '600', lineHeight: '1.4', marginBottom: '2px' }}>&ldquo;Good food is the foundation of genuine happiness.&rdquo;</div>
            <div style={{ color: '#92400e', fontSize: '9px', fontWeight: 'bold' }}>★ Complementary: Fresh Mints &amp; Royal Mouth Freshener</div>
          </div>
          <p className="text-zinc-500 text-[9px] font-mono pt-0.5">Powered by PlateFlow Billing Engine</p>
          <p className="text-zinc-700 text-[9px] font-mono font-medium">{formatHotelAddress(getSavedHotelLocation())}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Food Quotes Widget ───────────────────────────────────────────────────────
function FoodQuotesTicker() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [countdown, setCountdown] = useState(15);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsFading(true);
          setTimeout(() => { setQuoteIndex((idx) => (idx + 1) % FOOD_QUOTES.length); setIsFading(false); }, 300);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = FOOD_QUOTES[quoteIndex];

  return (
    <div className="card-base p-4 sm:p-5 border border-accent/20 bg-gradient-to-br from-graphite-900 via-graphite-900 to-accent/5 space-y-2.5 relative overflow-hidden shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/15 text-accent"><Quote size={14} /></div>
          <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">Culinary Inspiration</span>
          <span className="px-2 py-0.5 rounded-full bg-graphite-800 text-[10px] text-graphite-300 font-medium">{currentQuote.tag}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-graphite-800 border border-graphite-700 font-mono text-xs">
          <Clock size={11} className="text-accent animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-graphite-400 text-[10px]">Next</span>
          <span className="font-bold text-accent">{countdown}s</span>
        </div>
      </div>
      <div className={`transition-opacity duration-300 min-h-[56px] flex flex-col justify-center ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-sm font-serif italic text-ivory-100 leading-snug">&ldquo;{currentQuote.quote}&rdquo;</p>
        <p className="text-xs font-mono font-medium text-accent mt-1.5">— {currentQuote.author}</p>
      </div>
      <div className="w-full bg-graphite-800 h-1 rounded-full overflow-hidden">
        <div className="bg-accent h-full transition-all duration-1000 ease-linear rounded-full" style={{ width: `${((15 - countdown) / 15) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Mini Table Card (for the multi-order dashboard) ──────────────────────────
function TableCard({ ticket, stageId, elapsed, isSelected, onSelect }) {
  const stageIndex = getStageIndex(stageId);
  const stage = ORDER_STAGES[stageIndex];
  const remaining = Math.max(0, STAGE_DURATION_SEC - elapsed);
  const Icon = stage.icon;
  const itemCount = ticket.items?.length || 0;

  return (
    <button
      id={`table-card-${ticket.table.replace(/\s+/g, '-')}`}
      onClick={onSelect}
      className={`card-base p-3 sm:p-4 text-left w-full transition-all hover:scale-[1.02] active:scale-[0.98] ${
        isSelected
          ? 'ring-2 ring-accent border-accent/50 shadow-lg shadow-accent/10'
          : 'border-graphite-700 hover:border-graphite-600'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-sm text-ivory-50 font-mono">{ticket.table}</div>
        <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor} ${stageId !== 'SERVED' ? 'animate-pulse' : ''}`} />
      </div>

      {/* Stage label + icon */}
      <div className={`flex items-center gap-1.5 ${stage.color} mb-1.5`}>
        <Icon size={14} className={stageId === 'PREPARING' ? 'animate-pulse' : ''} />
        <span className="text-xs font-bold">{stage.label}</span>
      </div>

      {/* Timer + item count */}
      <div className="flex items-center justify-between text-[10px] text-graphite-400 font-mono">
        <span>#{ticket.id} • {itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        {stageId !== 'SERVED' && (
          <span className="text-accent font-semibold">{remaining}s</span>
        )}
      </div>

      {/* Mini progress bar */}
      <div className="mt-2 h-1 bg-graphite-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            stageId === 'SERVED' ? 'bg-emerald-400' : 'bg-accent'
          }`}
          style={{ width: `${(stageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
        />
      </div>
    </button>
  );
}

// ─── Main Table Tablet View ───────────────────────────────────────────────────
export default function TableQROrder({
  dishes, order, onAddDish, onRemoveDish, addToast,
  activeTableNo, onTableChange, onNavigate,
}) {
  const [selectedTable, setSelectedTable] = useState(
    () => activeTableNo || localStorage.getItem(TABLE_KEY) || 'Table 01'
  );

  // Keep selectedTable in sync when activeTableNo prop changes
  useEffect(() => {
    if (activeTableNo && activeTableNo !== selectedTable) {
      setSelectedTable(activeTableNo);
    }
  }, [activeTableNo]);
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);

  // ─── All active orders (polled every second) ───────────────────────────────
  const [activeTickets, setActiveTickets] = useState(() => getKitchenTickets());
  const [allStatuses, setAllStatuses] = useState(() => getAllTableStatuses());
  const [tick, setTick] = useState(0); // Force re-render ticker

  // Poll localStorage every 1s for tickets + statuses
  useEffect(() => {
    const poll = setInterval(() => {
      setActiveTickets(getKitchenTickets());
      setAllStatuses(getAllTableStatuses());
      setTick((t) => t + 1); // increment to force timer recalculation
    }, 1000);
    return () => clearInterval(poll);
  }, []);

  // ─── Selected table's current status ───────────────────────────────────────
  const currentStatusId = allStatuses[selectedTable] || 'RECEIVED';
  const stageIndex = getStageIndex(currentStatusId);
  const currentStage = ORDER_STAGES[stageIndex];
  const elapsedSec = getTimerForTable(selectedTable);
  const remainingSec = Math.max(0, STAGE_DURATION_SEC - elapsedSec);
  const showReceipt = currentStatusId === 'SERVED';

  // ─── Auto-advance stage timer for ALL active tables ────────────────────────
  useEffect(() => {
    const advancer = setInterval(() => {
      try {
        const statuses = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
        let changed = false;

        Object.keys(statuses).forEach((table) => {
          const status = statuses[table];
          if (status === 'SERVED') return;

          const startTs = Number(localStorage.getItem(`${TIMER_KEY}-${table}`)) || Date.now();
          const elapsed = Math.floor((Date.now() - startTs) / 1000);

          if (elapsed >= STAGE_DURATION_SEC) {
            const idx = getStageIndex(status);
            if (idx < ORDER_STAGES.length - 1) {
              statuses[table] = ORDER_STAGES[idx + 1].id;
              localStorage.setItem(`${TIMER_KEY}-${table}`, String(Date.now()));
              changed = true;
            }
          }
        });

        if (changed) {
          localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
        }
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(advancer);
  }, []);

  const handleSelectTable = (tableNo) => {
    setSelectedTable(tableNo);
    localStorage.setItem(TABLE_KEY, tableNo);
    if (onTableChange) onTableChange(tableNo);
  };

  const handleReset = () => {
    try {
      const all = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
      all[selectedTable] = 'RECEIVED';
      localStorage.setItem(STATUS_KEY, JSON.stringify(all));
      localStorage.setItem(`${TIMER_KEY}-${selectedTable}`, String(Date.now()));
    } catch { /* ignore */ }
  };

  const handlePrint = () => window.print();

  // Split tickets into active (non-served) and served
  const liveTickets = activeTickets.filter((t) => t.status !== 'SERVED');
  const servedTickets = activeTickets.filter((t) => t.status === 'SERVED');

  return (
    <div className="p-3 sm:p-5 lg:p-8 space-y-5 max-w-5xl mx-auto w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <Utensils size={22} />
            <h1 className="heading-md text-lg sm:text-xl lg:text-2xl text-ivory-50">Customer Table View</h1>
          </div>
          <p className="text-xs text-graphite-400 mt-0.5">
            All active orders • Live stage tracking • Auto-synced with Kitchen Display
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="table-split-bill-btn"
            onClick={() => setIsSplitterOpen(true)}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 font-bold text-accent border-accent/40 whitespace-nowrap"
            title="Split bill with friends via UPI QR"
          >
            <Users size={13} /> Split Bill (UPI)
          </button>
          {onNavigate && (
            <button
              id="go-to-kitchen-btn"
              onClick={() => onNavigate('kitchen')}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 font-bold whitespace-nowrap"
            >
              <ChefHat size={13} /> Kitchen Display
            </button>
          )}
          <button onClick={handleReset} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-graphite-400" title="Reset selected table">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* ── Multi-Order Active Tables Dashboard ────────────────────────────── */}
      {liveTickets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-graphite-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Tables ({liveTickets.length})
            </h2>
            <span className="text-[10px] text-graphite-500 font-mono">Click a table to view details</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {liveTickets.map((ticket) => {
              const tableStatus = allStatuses[ticket.table] || 'RECEIVED';
              const elapsed = getTimerForTable(ticket.table);
              return (
                <TableCard
                  key={ticket.id}
                  ticket={ticket}
                  stageId={tableStatus}
                  elapsed={elapsed}
                  isSelected={selectedTable === ticket.table}
                  onSelect={() => handleSelectTable(ticket.table)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recently served tables (collapsed) */}
      {servedTickets.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-graphite-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Recently Served ({servedTickets.length})
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {servedTickets.slice(0, 6).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => handleSelectTable(ticket.table)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  selectedTable === ticket.table
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                    : 'bg-graphite-800 text-graphite-400 border-graphite-700 hover:text-ivory-100'
                }`}
              >
                {ticket.table} ✓
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No active orders message */}
      {activeTickets.length === 0 && (
        <div className="card-base p-8 text-center space-y-2">
          <div className="text-graphite-500 text-lg">No active orders</div>
          <p className="text-graphite-400 text-sm">Go to Dish Explorer to place an order — the table will be assigned automatically!</p>
        </div>
      )}

      {/* ── Selected Table Detail Panel (KFC-style) ───────────────────────── */}
      <div className="card-base p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-graphite-400 uppercase font-bold">
            Viewing: <span className="text-accent">{selectedTable}</span>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${currentStage.bg} ${currentStage.color} border ${currentStage.ring}/30`}>
            {currentStage.label}
          </div>
        </div>

        {/* Stage hero card */}
        <div className={`flex flex-col items-center gap-3 p-5 rounded-2xl ${currentStage.bg} border ring-2 ${currentStage.ring}/40 text-center`}>
          <div className={`p-3 rounded-full ${currentStage.bg} ring-2 ${currentStage.ring}/60`}>
            <currentStage.icon
              size={32}
              className={`${currentStage.color} ${currentStatusId === 'PREPARING' ? 'animate-pulse' : ''}`}
            />
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black ${currentStage.color}`}>{currentStage.label}</div>
            <div className="text-sm text-graphite-300 mt-0.5">{currentStage.subLabel}</div>
          </div>
          {currentStatusId !== 'SERVED' && (
            <div className="flex items-center gap-2 text-xs text-graphite-400 font-mono">
              <Clock size={13} className="text-accent" />
              <span>Next stage in: <strong className="text-accent">{remainingSec}s</strong></span>
              <span className="text-graphite-500">({elapsedSec}s / 50s)</span>
            </div>
          )}
        </div>

        {/* 4-stage stepper */}
        <div className="relative flex items-center justify-between">
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-graphite-700 -z-0" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-emerald-400 transition-all duration-700 -z-0"
            style={{ width: `${(stageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
          />
          {ORDER_STAGES.map((stage, idx) => {
            const done = idx < stageIndex;
            const active = idx === stageIndex;
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    done
                      ? 'bg-emerald-400 border-emerald-400 text-graphite-950 font-bold'
                      : active
                        ? `${stage.bg} border-current ${stage.color} ring-2 ring-offset-2 ring-offset-graphite-900 ${stage.ring}/60`
                        : 'bg-graphite-800 border-graphite-600 text-graphite-600'
                  }`}
                >
                  {done ? <CheckCircle2 size={16} /> : <Icon size={16} className={active ? stage.color : ''} />}
                </div>
                <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-tight max-w-[55px] ${
                  active ? stage.color : done ? 'text-emerald-400' : 'text-graphite-500'
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Food Quotes */}
      <FoodQuotesTicker />

      {/* Receipt when Served */}
      {showReceipt && (
        <div className="card-base p-5 space-y-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-emerald-400 font-bold text-sm">Your order has been served!</div>
            <div className="text-graphite-400 text-xs mt-0.5">Here is your receipt. Enjoy your meal!</div>
          </div>
          <ThermalReceipt order={order} onPrint={handlePrint} />
        </div>
      )}

      {/* Demo Controls */}
      <div className="card-base p-3 sm:p-4 border-graphite-700/50 bg-graphite-900/50">
        <div className="text-[10px] text-graphite-400 uppercase font-mono font-bold mb-2">
          Demo: Advance "{selectedTable}" Status (Auto-advances every 50s)
        </div>
        <div className="flex flex-wrap gap-2">
          {ORDER_STAGES.map((stage, idx) => (
            <button
              key={stage.id}
              onClick={() => {
                try {
                  const all = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
                  all[selectedTable] = stage.id;
                  localStorage.setItem(STATUS_KEY, JSON.stringify(all));
                  localStorage.setItem(`${TIMER_KEY}-${selectedTable}`, String(Date.now()));
                } catch { /* ignore */ }
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                currentStatusId === stage.id
                  ? 'bg-accent text-graphite-950 border-accent font-bold'
                  : 'bg-graphite-800 text-graphite-300 border-graphite-700 hover:bg-graphite-700'
              }`}
            >
              {idx + 1}. {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Payer Bill Splitter Modal */}
      <BillSplitterModal
        isOpen={isSplitterOpen}
        onClose={() => setIsSplitterOpen(false)}
        order={order}
        tableNo={selectedTable}
        addToast={addToast}
      />
    </div>
  );
}
