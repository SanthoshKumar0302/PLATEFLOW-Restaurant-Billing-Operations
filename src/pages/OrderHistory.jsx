import { Search, ChevronRight, Clock, Receipt, ArrowRight, Eye, Calendar, DollarSign, Layers } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function OrderHistory({ orders = [], onSelectOrder, onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');

  const formattedOrders = useMemo(
    () =>
      orders.map((order) => {
        const items = Array.isArray(order?.items) ? order.items : [];
        const plates = Number(order.plateCount) || items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const amount = Number(order.grandTotal) || items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0) * 1.1, 0);

        return {
          ...order,
          plates,
          amount: Math.round(amount),
        };
      }),
    [orders]
  );

  const filteredOrders = formattedOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.id.toString().includes(q) ||
      (order.date && order.date.toLowerCase().includes(q)) ||
      (order.items && order.items.some((item) => item.name.toLowerCase().includes(q)))
    );
  });

  const totalOrdersCount = formattedOrders.length;
  const totalPlatesCount = formattedOrders.reduce((sum, o) => sum + o.plates, 0);
  const totalRevenueAmount = formattedOrders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full animate-fadeIn select-none">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-graphite-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold border border-accent/30">
              ORDER HISTORY
            </span>
            <span className="text-xs text-graphite-400 font-mono">
              {totalOrdersCount} Archived Transactions
            </span>
          </div>
          <h1 className="heading-md text-xl sm:text-2xl text-ivory-50">
            Completed Orders &amp; Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-graphite-400">
            All completed customer bills are archived here with itemized audit records.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('dishes')}
            className="btn-primary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-md shadow-accent/20 flex-shrink-0"
          >
            <span>Create New Order</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* ─── Search Bar ───────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-3.5 text-graphite-400" />
        <input
          type="text"
          placeholder="Search by order ID (e.g. 1042), date, or dish name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-16 py-2.5 bg-graphite-900 border border-graphite-700 rounded-xl text-ivory-100 placeholder-graphite-500 focus:outline-none focus:border-accent text-sm transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs text-graphite-400 hover:text-ivory-100 bg-graphite-800 px-2 py-1 rounded transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ─── Orders List Card (Clean Pixel-Perfect Alignment) ───────────────── */}
      <div className="card-base overflow-hidden border-graphite-700/80 shadow-xl shadow-graphite-950/40">
        {/* Table Header for Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-graphite-800/80 border-b border-graphite-700/80 text-xs font-mono font-bold text-graphite-400 uppercase tracking-wider">
          <div className="col-span-3">Order / Date</div>
          <div className="col-span-4">Dishes &amp; Plates</div>
          <div className="col-span-2 text-right">Grand Total</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-graphite-800 bg-graphite-900/60">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => onSelectOrder && onSelectOrder(order)}
                className="p-4 sm:px-6 sm:py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-graphite-800/50 transition-all cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSelectOrder) onSelectOrder(order);
                }}
              >
                {/* Col 1: Order ID & Timestamp */}
                <div className="md:col-span-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent text-base group-hover:underline">
                      #{order.id}
                    </span>
                    <span className="text-xs text-graphite-400 font-mono">
                      {order.date || 'Today'}
                    </span>
                  </div>
                  {order.time && (
                    <div className="text-[11px] text-graphite-500 font-mono flex items-center gap-1">
                      <Clock size={11} /> {order.time}
                    </div>
                  )}
                </div>

                {/* Col 2: Dishes & Plates Count */}
                <div className="md:col-span-4 py-1.5 md:py-0 space-y-0.5">
                  <div className="text-xs font-semibold text-ivory-100 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-graphite-800 text-graphite-300 font-mono text-[11px]">
                      {order.plates} {order.plates === 1 ? 'plate' : 'plates'}
                    </span>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="text-xs text-graphite-400 truncate max-w-xs font-medium">
                      {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </div>
                  )}
                </div>

                {/* Col 3: Grand Total Amount */}
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2 py-1 md:py-0">
                  <span className="md:hidden text-xs text-graphite-400 font-mono uppercase">Amount:</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-accent">
                    ₹{order.amount}
                  </span>
                </div>

                {/* Col 4: Status Badge */}
                <div className="md:col-span-1 flex items-center justify-start md:justify-center py-1 md:py-0">
                  <span className="px-2.5 py-0.5 bg-green-500/15 text-green-400 text-[11px] rounded-full font-mono font-bold border border-green-500/30">
                    {order.status || 'PAID'}
                  </span>
                </div>

                {/* Col 5: Action Link */}
                <div className="md:col-span-2 flex items-center justify-end gap-1.5 text-xs text-graphite-400 group-hover:text-accent font-semibold pt-2 md:pt-0 border-t border-graphite-800/80 md:border-0">
                  <Eye size={14} className="text-accent" />
                  <span>View Receipt</span>
                  <ChevronRight size={15} className="text-graphite-500 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-graphite-800/80 flex items-center justify-center mx-auto text-graphite-500">
                <Receipt size={22} />
              </div>
              <p className="text-graphite-300 font-medium text-sm">No transaction records found matching your filter</p>
              <p className="text-xs text-graphite-500 max-w-sm mx-auto">
                Completed orders will automatically archive and appear in this transaction ledger.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Summary Stats Grid (Perfect Symmetric Alignment) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="card-base p-5 flex flex-col items-center justify-center text-center border-graphite-700/80 bg-graphite-900/80">
          <div className="flex items-center gap-1.5 text-xs text-graphite-400 uppercase tracking-wider font-mono">
            <Receipt size={14} className="text-accent" />
            <span>Orders Completed</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ivory-100 font-mono mt-1.5">
            {totalOrdersCount}
          </div>
        </div>

        <div className="card-base p-5 flex flex-col items-center justify-center text-center border-graphite-700/80 bg-graphite-900/80">
          <div className="flex items-center gap-1.5 text-xs text-graphite-400 uppercase tracking-wider font-mono">
            <Layers size={14} className="text-accent" />
            <span>Total Plates Served</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-ivory-100 font-mono mt-1.5">
            {totalPlatesCount}
          </div>
        </div>

        <div className="card-base p-5 flex flex-col items-center justify-center text-center border-accent/40 bg-accent/5">
          <div className="flex items-center gap-1.5 text-xs text-accent uppercase tracking-wider font-mono font-bold">
            <DollarSign size={14} className="text-accent" />
            <span>Total Revenue (INR)</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-accent font-mono mt-1.5">
            ₹{totalRevenueAmount}
          </div>
        </div>
      </div>
    </div>
  );
}
