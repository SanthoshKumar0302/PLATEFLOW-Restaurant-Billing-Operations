import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, Utensils, Plus, Filter, LayoutGrid, X, ArrowRight, Package, Bell, Zap, ShieldCheck } from 'lucide-react';
import {
  getKitchenTickets,
  updateKitchenTicketStatus,
  STATUS_KEY,
} from '../utils/orderBroadcast';
import { deductStockForOrder } from '../utils/recipeInventoryEngine';
import {
  KDS_STATIONS,
  routeOrderToStations,
  isOrderFullyReady,
  calculateStationReadinessPercent,
  updateStationTicketStatus,
  getAllStationSubTickets,
  getStationForCategory,
} from '../utils/kdsStationRouter';

const STAGE_MAP_TO_KDS = {
  RECEIVED: 'NEW',
  PREPARING: 'PREPARING',
  READY: 'READY TO SERVE',
  SERVED: 'SERVED',
};

export default function KitchenDisplay({ order, activeTableNo, onNavigate }) {
  const [activeStation, setActiveStation] = useState('all');
  const [selectedTableFilter, setSelectedTableFilter] = useState('all');
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [customTableName, setCustomTableName] = useState('Table 05');
  const [customDishName, setCustomDishName] = useState('Idli');
  const [customQty, setCustomQty] = useState(2);
  const [customNotes, setCustomNotes] = useState('');

  const defaultTables = [
    'Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05',
    'Table 06', 'Table 07', 'Table 08', 'Table 09', 'Table 10',
    'VIP Lounge', 'Patio Deck', 'Takeaway Counter',
  ];

  const [availableTables, setAvailableTables] = useState(defaultTables);

  const TARGET_DURATION_SEC = 300; // 05:00 minutes target prep window

  // Seed tickets (shown when no real orders are in localStorage)
  const now = Date.now();
  const seedTickets = [
    {
      id: 101,
      table: 'Table 04',
      createdAt: now - 120000, // 2 mins ago -> 03:00 remaining
      completedAt: null,
      station: 'hot-kitchen',
      status: 'PREPARING',
      items: [
        { name: 'Chicken Biryani', qty: 2, notes: 'Spicy, Extra Raita' },
        { name: 'Pulao', qty: 1, notes: 'Less oil' },
      ],
      updatedAt: now - 120000,
    },
    {
      id: 102,
      table: 'Table 02',
      createdAt: now - 30000, // 30s ago -> 04:30 remaining
      completedAt: null,
      station: 'hot-kitchen',
      status: 'NEW',
      items: [
        { name: 'Dosa', qty: 3, notes: 'Crispy' },
        { name: 'Idli', qty: 2, notes: 'Soft steam' },
      ],
      updatedAt: now - 30000,
    },
    {
      id: 103,
      table: 'Table 08',
      createdAt: now - 180000, // 3 mins ago -> 02:00 remaining
      completedAt: null,
      station: 'beverages',
      status: 'PREPARING',
      items: [
        { name: 'Kumbakonam Filter Coffee', qty: 4, notes: 'Strong brew' },
        { name: 'Fresh Lime Soda', qty: 2, notes: 'Sweet & Salt' },
      ],
      updatedAt: now - 180000,
    },
  ];

  const [tickets, setTickets] = useState(() => {
    const live = getKitchenTickets();
    return live.length > 0 ? live : seedTickets;
  });

  const [tick, setTick] = useState(0); // 1-second live ticker

  // ─── Poll localStorage for new/updated tickets every 2 seconds ─────────────
  const syncFromStorage = useCallback(() => {
    const live = getKitchenTickets();
    if (live.length === 0) return;

    setTickets((prev) => {
      const merged = [...prev];
      live.forEach((liveTicket) => {
        const existingIdx = merged.findIndex((t) => t.id === liveTicket.id);
        if (existingIdx >= 0) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            status: liveTicket.status,
            items: liveTicket.items,
            table: liveTicket.table,
            createdAt: liveTicket.createdAt || merged[existingIdx].createdAt || Date.now(),
            completedAt: liveTicket.completedAt || merged[existingIdx].completedAt || (liveTicket.status === 'SERVED' ? Date.now() : null),
            updatedAt: liveTicket.updatedAt,
          };
        } else {
          merged.unshift({
            ...liveTicket,
            createdAt: liveTicket.createdAt || Date.now(),
            completedAt: liveTicket.completedAt || (liveTicket.status === 'SERVED' ? Date.now() : null),
          });
        }
      });
      return merged;
    });

    setAvailableTables((prev) => {
      const liveTables = live.map((t) => t.table);
      return [...new Set([...prev, ...liveTables])];
    });

    try {
      const allStatuses = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
      live.forEach((liveTicket) => {
        if (!allStatuses[liveTicket.table]) {
          const stageMap = {
            NEW: 'RECEIVED',
            PREPARING: 'PREPARING',
            'READY TO SERVE': 'READY',
            SERVED: 'SERVED',
          };
          allStatuses[liveTicket.table] = stageMap[liveTicket.status] || 'RECEIVED';
        }
      });
      localStorage.setItem(STATUS_KEY, JSON.stringify(allStatuses));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const interval = setInterval(syncFromStorage, 2000);
    syncFromStorage();
    return () => clearInterval(interval);
  }, [syncFromStorage]);

  // ─── 1-Second Timer Tick for Live Active Countdown ───────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTicketRemainingSec = (ticket) => {
    const start = ticket.createdAt || Date.now();
    const end = ticket.status === 'SERVED' ? (ticket.completedAt || Date.now()) : Date.now();
    const elapsed = Math.max(0, Math.floor((end - start) / 1000));
    return Math.max(0, TARGET_DURATION_SEC - elapsed);
  };

  const getTicketElapsedSec = (ticket) => {
    const start = ticket.createdAt || Date.now();
    const end = ticket.status === 'SERVED' ? (ticket.completedAt || Date.now()) : Date.now();
    return Math.max(0, Math.floor((end - start) / 1000));
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimerDisplay = (ticket) => {
    if (ticket.status === 'SERVED') {
      const elapsed = getTicketElapsedSec(ticket);
      return `✓ ${formatTimer(elapsed)}`;
    }
    const remaining = getTicketRemainingSec(ticket);
    if (remaining > 0) {
      return formatTimer(remaining);
    }
    const elapsed = getTicketElapsedSec(ticket);
    return `+${formatTimer(elapsed - TARGET_DURATION_SEC)}`;
  };

  const getUrgencyColor = (ticket) => {
    if (ticket.status === 'SERVED') {
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    }
    const remaining = getTicketRemainingSec(ticket);
    if (remaining > 120) return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (remaining > 0) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10 animate-pulse';
  };

  const updateStatus = (ticketId, nextStatus) => {
    const now = Date.now();
    const targetTicket = tickets.find((t) => t.id === ticketId);

    // Subgraph 2: When Chef starts preparing, deduct raw recipe inventory
    if (nextStatus === 'PREPARING' && targetTicket?.items) {
      const deductionResult = deductStockForOrder(targetTicket.items);
      if (deductionResult.soldOutDishes.length > 0) {
        console.warn('[PlateFlow Stock Defense] Dishes sold out after deduction:', deductionResult.soldOutDishes);
      }
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'SERVED' ? (t.completedAt || now) : null,
              updatedAt: now,
            }
          : t
      )
    );
    updateKitchenTicketStatus(ticketId, nextStatus);
  };

  const handleCreateCustomTicket = (e) => {
    e.preventDefault();
    if (!customTableName.trim()) return;

    if (!availableTables.includes(customTableName.trim())) {
      setAvailableTables((prev) => [...prev, customTableName.trim()]);
    }

    const nowTime = Date.now();
    const newTicket = {
      id: Math.floor(100 + Math.random() * 900),
      table: customTableName.trim(),
      createdAt: nowTime,
      completedAt: null,
      station: 'hot-kitchen',
      status: 'NEW',
      items: [
        {
          name: customDishName,
          qty: Number(customQty) || 1,
          notes: customNotes || 'Custom Table Order',
        },
      ],
      updatedAt: nowTime,
    };

    setTickets((prev) => [newTicket, ...prev]);
    setShowAddTicketModal(false);
    setCustomNotes('');
  };

  // Station sub-tickets state synced with storage
  const [stationTicketsMap, setStationTicketsMap] = useState(() => getAllStationSubTickets());

  useEffect(() => {
    const handleStationUpdate = () => setStationTicketsMap(getAllStationSubTickets());
    window.addEventListener('plateflow-station-tickets-updated', handleStationUpdate);
    return () => window.removeEventListener('plateflow-station-tickets-updated', handleStationUpdate);
  }, []);

  const handleSubTicketStatusChange = (tableNo, stationId, newStatus) => {
    const updated = updateStationTicketStatus(tableNo, stationId, newStatus);
    setStationTicketsMap((prev) => ({ ...prev, [tableNo]: updated }));
  };

  const filteredTickets = tickets.filter((t) => {
    const stations = routeOrderToStations(t);
    const hasItemsForStation = activeStation === 'ALL' || Boolean(stations[activeStation]);
    const matchesTable =
      selectedTableFilter === 'all' ||
      t.table.toLowerCase().includes(selectedTableFilter.toLowerCase());
    return hasItemsForStation && matchesTable;
  });

  // Cross-Station Intelligent Resolver: Find if selected table has tickets in other stations
  const tableTicketsAcrossAllStations = useMemo(() => {
    if (selectedTableFilter === 'all') return [];
    return tickets.filter((t) => t.table.toLowerCase().includes(selectedTableFilter.toLowerCase()));
  }, [tickets, selectedTableFilter]);

  const otherStationsForTable = useMemo(() => {
    const found = [];
    tableTicketsAcrossAllStations.forEach((t) => {
      const stations = routeOrderToStations(t);
      Object.keys(stations).forEach((stId) => {
        if (stId !== activeStation && !found.includes(stId)) {
          found.push(stId);
        }
      });
    });
    return found;
  }, [tableTicketsAcrossAllStations, activeStation]);

  // Badge for status
  const getStatusBadge = (status) => {
    const map = {
      NEW: { label: 'Order Received', cls: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/40' },
      PREPARING: { label: 'Preparing', cls: 'bg-amber-400/20 text-amber-400 border-amber-400/40' },
      'READY TO SERVE': { label: 'Ready to Serve', cls: 'bg-accent/20 text-accent border-accent/40' },
      SERVED: { label: 'Served ✓', cls: 'bg-graphite-700 text-graphite-300 border-graphite-600' },
    };
    return map[status] || map.NEW;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <ChefHat size={24} />
            <h1 className="heading-md">Kitchen Display System (KDS)</h1>
          </div>
          <p className="text-sm text-graphite-400 mt-1">
            Real-time ticket router • Auto-syncs with Table View stage timer
            {activeTableNo && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-mono text-xs border border-emerald-500/30">
                Active Table: {activeTableNo}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Go to Table View */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('table-view')}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <ArrowRight size={14} /> Table View
            </button>
          )}
          <button
            onClick={() => setShowAddTicketModal(true)}
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
          >
            <Plus size={16} /> + New Custom Ticket
          </button>
        </div>
      </div>

      {/* Live sync indicator */}
      <div className="flex items-center gap-2 text-[11px] text-graphite-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live sync active — polling every 2s from Table View orders
      </div>

      {/* Control Bar: Station Router & Table Filter */}
      <div className="card-base p-4 space-y-4 bg-graphite-900 border border-graphite-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Station Filters (Feature 3: Station Router) */}
          <div className="space-y-1">
            <div className="text-[10px] text-graphite-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Flame size={12} className="text-accent" /> Kitchen Station Router
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {Object.values(KDS_STATIONS).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveStation(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeStation === st.id
                      ? 'bg-accent text-graphite-950 shadow-md shadow-accent/20'
                      : 'bg-graphite-800 text-graphite-300 border border-graphite-700 hover:bg-graphite-700'
                  }`}
                  title={st.description}
                >
                  <span>{st.icon}</span>
                  <span>{st.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Selector Filter */}
          <div className="space-y-1">
            <div className="text-[10px] text-graphite-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <Filter size={12} className="text-accent" /> Filter By Table
            </div>
            <select
              value={selectedTableFilter}
              onChange={(e) => setSelectedTableFilter(e.target.value)}
              className="bg-graphite-800 border border-graphite-600 text-ivory-100 text-xs font-mono font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent w-full md:w-auto"
            >
              <option value="all">All Tables ({tickets.length} tickets)</option>
              {availableTables.map((tbl) => {
                const count = tickets.filter((t) =>
                  t.table.toLowerCase().includes(tbl.toLowerCase())
                ).length;
                return (
                  <option key={tbl} value={tbl}>
                    {tbl} ({count} active)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick Table Filter Pills */}
        <div className="pt-2 border-t border-graphite-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-graphite-500 uppercase tracking-wider font-bold whitespace-nowrap">
            Tables:
          </span>
          <button
            onClick={() => setSelectedTableFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all ${
              selectedTableFilter === 'all'
                ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                : 'bg-graphite-800 text-graphite-400 hover:text-ivory-100'
            }`}
          >
            All Tables ({tickets.length})
          </button>
          {availableTables.slice(0, 10).map((tbl) => {
            const isActive = selectedTableFilter === tbl;
            const matchingStationCount = tickets.filter((t) => {
              const matchesTbl = t.table.toLowerCase().includes(tbl.toLowerCase());
              const stations = routeOrderToStations(t);
              const hasStation = activeStation === 'ALL' || Boolean(stations[activeStation]);
              return matchesTbl && hasStation;
            }).length;

            const totalCount = tickets.filter((t) =>
              t.table.toLowerCase().includes(tbl.toLowerCase())
            ).length;

            return (
              <button
                key={tbl}
                onClick={() => setSelectedTableFilter(tbl)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-accent text-graphite-950 font-bold shadow-md shadow-accent/20'
                    : 'bg-graphite-800 text-graphite-400 hover:text-ivory-100 border border-graphite-700'
                }`}
              >
                <span>{tbl}</span>
                {totalCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full font-bold text-[10px] ${
                    matchingStationCount > 0
                      ? isActive ? 'bg-graphite-950 text-accent' : 'bg-accent/20 text-accent'
                      : 'bg-graphite-700 text-graphite-400'
                  }`}>
                    {matchingStationCount > 0 ? matchingStationCount : `${totalCount} other`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket Grid */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const urgencyClass = getUrgencyColor(ticket);
            const statusBadge = getStatusBadge(ticket.status);
            const timerDisplay = getTimerDisplay(ticket);
            return (
              <div
                key={ticket.id}
                id={`kds-ticket-${ticket.id}`}
                className="card-base bg-graphite-900 border border-graphite-700 rounded-xl overflow-hidden flex flex-col justify-between shadow-xl"
              >
                {/* Ticket Header */}
                <div className="p-4 bg-graphite-800/80 border-b border-graphite-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-graphite-400 font-mono">ORDER #{ticket.id}</div>
                    <div className="text-base font-bold text-accent font-mono">{ticket.table}</div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${urgencyClass}`}>
                      <Clock size={14} className={ticket.status !== 'SERVED' ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                      <span>{timerDisplay}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.cls}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Expediter Station Matrix Checklist & Items List */}
                <div className="p-4 space-y-3 flex-1">
                  {/* Station Matrix Checklist (Feature 3) */}
                  {(() => {
                    const stations = routeOrderToStations(ticket);
                    const stationEntries = Object.entries(stations);
                    const readinessPct = calculateStationReadinessPercent(stations);

                    return (
                      <div className="p-2.5 rounded-xl bg-graphite-800/60 border border-graphite-700/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-graphite-300 uppercase tracking-wider flex items-center gap-1">
                            <Zap size={11} className="text-accent" /> Station Readiness:
                          </span>
                          <span className={`font-bold ${readinessPct === 100 ? 'text-emerald-400' : 'text-accent'}`}>
                            {readinessPct}% Complete
                          </span>
                        </div>

                        {/* Station Sub-Tickets Pills */}
                        <div className="grid grid-cols-1 gap-1.5">
                          {stationEntries.map(([stId, stData]) => {
                            const subStatus = stationTicketsMap[ticket.table]?.[stId]?.status || (ticket.status === 'READY TO SERVE' || ticket.status === 'SERVED' ? 'READY' : ticket.status === 'PREPARING' ? 'PREPARING' : 'PENDING');
                            const isReady = subStatus === 'READY';
                            const isPrep = subStatus === 'PREPARING';

                            return (
                              <div
                                key={stId}
                                className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-graphite-900 border border-graphite-700 text-xs font-mono"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>{stData.icon}</span>
                                  <span className="text-ivory-100 font-semibold">{stData.stationName}</span>
                                  <span className="text-graphite-400 text-[10px]">({stData.items.length} items)</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = isReady ? 'PENDING' : isPrep ? 'READY' : 'PREPARING';
                                    handleSubTicketStatusChange(ticket.table, stId, next);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                    isReady
                                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                      : isPrep
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                        : 'bg-graphite-800 text-graphite-400 border-graphite-700 hover:text-ivory-100'
                                  }`}
                                >
                                  {isReady ? '✓ READY' : isPrep ? '⏱️ PREPPING' : 'PENDING'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="text-[10px] font-bold text-graphite-500 uppercase tracking-widest pt-1">
                    Ordered Items ({ticket.items.length})
                  </div>

                  <div className="space-y-2.5">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between border-b border-graphite-800 pb-2 last:border-b-0">
                        <div>
                          <div className="font-semibold text-ivory-100 text-sm flex items-center gap-2">
                            <span className="w-5 h-5 bg-accent/20 text-accent font-bold rounded text-xs flex items-center justify-center">
                              {item.qty}
                            </span>
                            {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-graphite-400 mt-0.5 italic flex items-center gap-1">
                              <span>•</span> {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Actions */}
                <div className="p-4 bg-graphite-800/40 border-t border-graphite-700 space-y-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-graphite-400">Current Status:</span>
                    <span className="font-bold text-accent">{ticket.status}</span>
                  </div>

                  {ticket.status === 'NEW' && (
                    <button
                      id={`kds-start-${ticket.id}`}
                      onClick={() => updateStatus(ticket.id, 'PREPARING')}
                      className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2"
                    >
                      <Flame size={14} /> Start Preparing
                    </button>
                  )}

                  {ticket.status === 'PREPARING' && (
                    <button
                      id={`kds-ready-${ticket.id}`}
                      onClick={() => updateStatus(ticket.id, 'READY TO SERVE')}
                      className="w-full bg-green-500 text-graphite-950 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                    >
                      <CheckCircle2 size={14} /> Mark Ready to Serve
                    </button>
                  )}

                  {ticket.status === 'READY TO SERVE' && (
                    <button
                      id={`kds-serve-${ticket.id}`}
                      onClick={() => updateStatus(ticket.id, 'SERVED')}
                      className="w-full btn-secondary py-2 text-xs text-graphite-300 flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
                    >
                      <Utensils size={14} /> Completed & Served
                    </button>
                  )}

                  {ticket.status === 'SERVED' && (
                    <div className="text-center text-xs text-green-400 font-semibold py-1">
                      ✓ Order Delivered — Table View auto-updated
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State with Smart Cross-Station Quick Action Resolution */
        <div className="card-base p-8 sm:p-12 text-center space-y-5 bg-graphite-900 border border-graphite-700/80 rounded-2xl shadow-xl animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto text-2xl">
            {KDS_STATIONS[activeStation]?.icon || '🍽️'}
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-ivory-100">
              No active items in {KDS_STATIONS[activeStation]?.name || 'this station'} for {selectedTableFilter === 'all' ? 'any table' : selectedTableFilter}
            </h3>
            <p className="text-xs sm:text-sm text-graphite-400">
              {otherStationsForTable.length > 0
                ? `${selectedTableFilter} has active dishes routed to other kitchen stations.`
                : 'Select another station/table or create a new custom table ticket below.'}
            </p>
          </div>

          {/* If the table has items on other stations: provide 1-click quick-switch */}
          {otherStationsForTable.length > 0 && (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 max-w-lg mx-auto space-y-3">
              <div className="text-xs font-mono font-bold text-accent flex items-center justify-center gap-1.5">
                <Zap size={14} />
                <span>Found {tableTicketsAcrossAllStations.length} ticket(s) for {selectedTableFilter} in other stations:</span>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {otherStationsForTable.map((stId) => (
                  <button
                    key={stId}
                    onClick={() => setActiveStation(stId)}
                    className="btn-primary py-2 px-3.5 text-xs font-bold font-mono flex items-center gap-1.5 shadow-md shadow-accent/20"
                  >
                    <span>{KDS_STATIONS[stId]?.icon}</span>
                    <span>Switch to {KDS_STATIONS[stId]?.name}</span>
                    <ArrowRight size={12} />
                  </button>
                ))}
                <button
                  onClick={() => setActiveStation('ALL')}
                  className="btn-secondary py-2 px-3.5 text-xs font-bold font-mono flex items-center gap-1.5 text-ivory-100"
                >
                  <span>🛎️</span>
                  <span>View in Expediter Master (All Stations)</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {selectedTableFilter !== 'all' && (
              <button
                onClick={() => setSelectedTableFilter('all')}
                className="btn-secondary py-2.5 px-4 text-xs font-semibold"
              >
                Show All Tables
              </button>
            )}

            {activeStation !== 'ALL' && (
              <button
                onClick={() => setActiveStation('ALL')}
                className="btn-secondary py-2.5 px-4 text-xs font-semibold"
              >
                Show All Stations (Expediter View)
              </button>
            )}

            <button
              onClick={() => {
                if (selectedTableFilter !== 'all') {
                  setCustomTableName(selectedTableFilter);
                }
                setShowAddTicketModal(true);
              }}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-accent/20"
            >
              <Plus size={14} />
              <span>+ Create Ticket for {selectedTableFilter !== 'all' ? selectedTableFilter : 'New Table'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create Custom Table Ticket */}
      {showAddTicketModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-base max-w-md w-full p-6 space-y-4 bg-graphite-900 border border-graphite-700 shadow-2xl relative">
            <button
              onClick={() => setShowAddTicketModal(false)}
              className="absolute top-4 right-4 text-graphite-400 hover:text-ivory-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-accent">
              <LayoutGrid size={20} />
              <h3 className="heading-sm">Add Custom Table Ticket</h3>
            </div>

            <form onSubmit={handleCreateCustomTicket} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-graphite-400 uppercase font-semibold">Table / Section Name</label>
                <div className="space-y-2">
                  <select
                    value={customTableName}
                    onChange={(e) => setCustomTableName(e.target.value)}
                    className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-2.5 text-ivory-100 font-mono"
                  >
                    {availableTables.map((tbl) => (
                      <option key={tbl} value={tbl}>{tbl}</option>
                    ))}
                    <option value="Custom Input">Custom Table Name...</option>
                  </select>

                  {customTableName === 'Custom Input' && (
                    <input
                      type="text"
                      placeholder="Type custom table (e.g., Table 15 - Birthday)"
                      onChange={(e) => setCustomTableName(e.target.value)}
                      className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-2.5 text-ivory-100"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-graphite-400 uppercase font-semibold">Dish Name</label>
                <select
                  value={customDishName}
                  onChange={(e) => setCustomDishName(e.target.value)}
                  className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-2.5 text-ivory-100"
                >
                  <option value="Idli">Idli</option>
                  <option value="Chicken Biryani">Chicken Biryani</option>
                  <option value="Dosa">Dosa</option>
                  <option value="Pulao">Pulao</option>
                  <option value="Kumbakonam Filter Coffee">Filter Coffee</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-graphite-400 uppercase font-semibold">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-2.5 text-ivory-100 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-graphite-400 uppercase font-semibold">Chef Notes</label>
                  <input
                    type="text"
                    placeholder="Extra spicy, etc."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="w-full bg-graphite-800 border border-graphite-600 rounded-lg p-2.5 text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTicketModal(false)}
                  className="flex-1 btn-secondary py-2.5"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-2.5 font-bold">
                  Send to Kitchen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
