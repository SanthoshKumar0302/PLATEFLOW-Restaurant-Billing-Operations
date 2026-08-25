import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, Award, DollarSign, Activity, Flame, ShieldAlert, Cpu,
  Calendar, Clock, Sparkles, Trash2, ShieldCheck, ArrowUpRight, BarChart3, AlertTriangle
} from 'lucide-react';
import {
  predictDailyBatch, predictHourlyDemand, getWasteMetrics, getPeakHours, getWeeklyRevenueSummary
} from '../utils/predictiveWasteEngine';
import {
  getActivePricingMode, PRICING_MODES, getNextPricingChange
} from '../utils/dynamicPricingEngine';

export default function SystemInsights({ orders = [] }) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [activeMode, setActiveMode] = useState(() => getActivePricingMode());
  const [nextPricing, setNextPricing] = useState(() => getNextPricingChange());

  useEffect(() => {
    const handlePricingUpdate = () => {
      setActiveMode(getActivePricingMode());
      setNextPricing(getNextPricingChange());
    };
    window.addEventListener('plateflow-pricing-updated', handlePricingUpdate);
    return () => window.removeEventListener('plateflow-pricing-updated', handlePricingUpdate);
  }, []);

  const analytics = useMemo(() => {
    const totalOrders = orders.length;
    let dishesProcessed = 0;
    let totalRevenue = 0;
    const itemFreq = {};
    const itemRevenue = {};

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const orderTotal = Number(order.grandTotal) || items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0) * 1.1, 0);
      totalRevenue += orderTotal;

      items.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        dishesProcessed += qty;
        itemFreq[item.name] = (itemFreq[item.name] || 0) + qty;
        itemRevenue[item.name] = (itemRevenue[item.name] || 0) + price * qty;
      });
    });

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const sortedFreq = Object.entries(itemFreq).sort((a, b) => b[1] - a[1]);
    const mostOrdered = sortedFreq.length > 0 ? { name: sortedFreq[0][0], count: sortedFreq[0][1] } : null;

    return {
      totalOrders,
      dishesProcessed,
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue,
      mostOrdered,
      highestValueDish: 'Chicken Biryani',
      highestValuePrice: 400,
    };
  }, [orders]);

  const dailyForecast = useMemo(() => predictDailyBatch(selectedDay), [selectedDay]);
  const hourlyDemand = useMemo(() => predictHourlyDemand(selectedDay), [selectedDay]);
  const wasteMetrics = useMemo(() => getWasteMetrics(), []);
  const peakHours = useMemo(() => getPeakHours(selectedDay), [selectedDay]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-graphite-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold border border-accent/30">
              SYSTEM INSIGHTS &amp; PREDICTIVE AI
            </span>
            <span className="text-xs text-graphite-400 font-mono">
              Real-Time Telemetry · Prep Forecasting · Waste Reduction
            </span>
          </div>
          <h1 className="heading-md text-xl sm:text-2xl lg:text-3xl text-ivory-50">
            Restaurant Operations &amp; Intelligence Core
          </h1>
        </div>

        {/* Active Dynamic Pricing Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-graphite-900 border border-accent/30">
          <span className="text-lg">{activeMode.icon}</span>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-accent">Active Pricing Mode</div>
            <div className="text-xs font-bold text-ivory-100">{activeMode.label}</div>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-graphite-400 text-xs font-mono">
            <span>TOTAL REVENUE</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ivory-50 font-mono mt-2">
            ₹{analytics.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> Live synchronized
          </div>
        </div>

        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-graphite-400 text-xs font-mono">
            <span>AVG ORDER VALUE</span>
            <Activity size={16} className="text-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-accent font-mono mt-2">
            ₹{analytics.avgOrderValue}
          </div>
          <div className="text-[11px] text-graphite-400 font-mono mt-1">
            Across {analytics.totalOrders} processed bills
          </div>
        </div>

        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-graphite-400 text-xs font-mono">
            <span>KITCHEN WASTE RATE</span>
            <Trash2 size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-2">
            {wasteMetrics.wastePercent}%
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            ₹{wasteMetrics.savingsFromPrediction} saved by AI prep
          </div>
        </div>

        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-graphite-400 text-xs font-mono">
            <span>TOP DEMAND DISH</span>
            <Flame size={16} className="text-accent" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-ivory-50 truncate mt-2">
            {analytics.mostOrdered ? analytics.mostOrdered.name : 'Chicken Biryani'}
          </div>
          <div className="text-[11px] text-accent font-mono mt-1">
            {analytics.mostOrdered ? `${analytics.mostOrdered.count} plates served` : 'High volume favorite'}
          </div>
        </div>
      </div>

      {/* ── Subgraph 4: Predictive Prep & Batch Forecaster (H -> I) ────────── */}
      <div className="card-base p-5 sm:p-6 bg-graphite-900 border border-graphite-700 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-graphite-800">
          <div>
            <h2 className="heading-sm text-base sm:text-lg font-bold flex items-center gap-2 text-ivory-50">
              <Sparkles size={18} className="text-accent" />
              <span>Predictive Prep Batch Forecaster (H ➡️ I)</span>
            </h2>
            <p className="text-xs text-graphite-400 mt-0.5">
              Forecasted batch quantities derived from 7-day rolling order history &amp; weekend weightings
            </p>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  selectedDay === day
                    ? 'bg-accent text-graphite-950 shadow-md shadow-accent/20'
                    : 'bg-graphite-800 text-graphite-400 hover:text-ivory-100'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {dailyForecast.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-graphite-800/80 border border-graphite-700/80 hover:border-accent/50 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-ivory-50">{item.dish}</div>
                  <div className="text-[11px] text-graphite-400 font-mono mt-0.5">
                    Avg Revenue: ₹{item.avgRevenue}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  item.confidence === 'High' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  item.confidence === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-graphite-700 text-graphite-400'
                }`}>
                  {item.confidence} Confidence
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-graphite-700/60 flex items-baseline justify-between">
                <span className="text-xs text-graphite-400">Target Kitchen Prep:</span>
                <span className="text-lg font-black font-mono text-accent">
                  {item.predictedQty} plates
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Subgraph 4: Hourly Demand Heatmap & Peak Rush Analytics ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Heatmap */}
        <div className="lg:col-span-2 card-base p-5 sm:p-6 bg-graphite-900 border border-graphite-700 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
            <div>
              <h3 className="heading-sm text-sm sm:text-base font-bold flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                <span>24-Hour Demand Heatmap ({selectedDay})</span>
              </h3>
              <p className="text-xs text-graphite-400">Hourly plate volume distribution &amp; rush windows</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {hourlyDemand.map((h, idx) => {
              const maxGauge = 30;
              const widthPct = Math.min(100, Math.round((h.predictedOrders / maxGauge) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-graphite-300 font-bold w-16">{h.label}</span>
                    <span className="text-graphite-400 text-[11px] truncate flex-1 px-2">
                      Top: {h.topDishes.join(', ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.intensity === 'peak' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      h.intensity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {h.predictedOrders} plates (₹{h.predictedRevenue})
                    </span>
                  </div>

                  <div className="w-full bg-graphite-800 h-2 rounded-full overflow-hidden border border-graphite-700/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        h.intensity === 'peak' ? 'bg-gradient-to-r from-amber-500 to-red-500' :
                        h.intensity === 'high' ? 'bg-accent' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.max(5, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Food Waste Reduction Metrics */}
        <div className="card-base p-5 sm:p-6 bg-graphite-900 border border-graphite-700 space-y-4">
          <div className="pb-2 border-b border-graphite-800">
            <h3 className="heading-sm text-sm sm:text-base font-bold flex items-center gap-2">
              <Trash2 size={16} className="text-amber-400" />
              <span>Food Waste Reduction</span>
            </h3>
            <p className="text-xs text-graphite-400">Targeting &lt;5% kitchen wastage</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-graphite-800 border border-graphite-700 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-graphite-400">Weekly Prepared:</span>
                <span className="font-bold text-ivory-100">{wasteMetrics.weeklyPrepared} plates</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-graphite-400">Weekly Served:</span>
                <span className="font-bold text-emerald-400">{wasteMetrics.weeklyServed} plates</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-graphite-400">Wastage / Leftover:</span>
                <span className="font-bold text-red-400">{wasteMetrics.weeklyWasted} plates ({wasteMetrics.wastePercent}%)</span>
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold text-graphite-400 uppercase tracking-wider">
              Top Items with Prep Excess:
            </div>
            <div className="space-y-1.5">
              {wasteMetrics.topWastedDishes.slice(0, 3).map((w, wIdx) => (
                <div key={wIdx} className="p-2 rounded-lg bg-graphite-800/60 border border-graphite-700/60 text-xs flex justify-between items-center">
                  <span className="font-bold text-ivory-100">{w.dish}</span>
                  <span className="text-[11px] font-mono text-amber-400">{w.wasted} excess plates</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
