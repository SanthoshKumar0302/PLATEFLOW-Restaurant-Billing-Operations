import { useState, useEffect } from 'react';
import {
  Sparkles, ArrowRight, Zap, BookOpen, Tablet, ChefHat,
  ShieldCheck, Receipt, Cpu, Flame, Star, Award, MapPin,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import LocationPickerModal from '../components/LocationPickerModal';
import { getSavedHotelLocation } from '../utils/indiaLocations';

export default function LandingPage({ onNavigate, addToast }) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(getSavedHotelLocation);
  const [isModulesExpanded, setIsModulesExpanded] = useState(false);

  useEffect(() => {
    setCurrentLocation(getSavedHotelLocation());
  }, []);

  const handleSaveLocation = (newLoc) => {
    setCurrentLocation(newLoc);
    localStorage.setItem('plateflow-hotel-location', JSON.stringify(newLoc));
    if (addToast) {
      addToast(`Restaurant location set to ${newLoc.city}, ${newLoc.state} - ${newLoc.pincode}`, 'success');
    }
  };

  const features = [
    {
      icon: Cpu,
      title: 'Java Collections Engine',
      description: 'Powered by Comparable<Dish> natural price sorting with zero floating-point drifts and dual-seed Bill DNA hashing.',
      badge: '11/11 Java Tests',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-accent',
    },
    {
      icon: Tablet,
      title: 'Live Table Tablet View',
      description: 'KFC-style 4-stage order pipeline (Received → Preparing → Ready → Served) with real-time culinary quotes ticker.',
      badge: 'Real-time KDS Sync',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    },
    {
      icon: Receipt,
      title: 'Single-Page Thermal Receipt',
      description: 'Compact 80mm printable tax invoice with automated 5% SGST + 5% CGST tax calculation and complimentary dining perks.',
      badge: 'Instant PDF / Print',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      icon: ShieldCheck,
      title: 'Quantity Guard Protection',
      description: 'Engine-level defensive validation preventing negative counts and invalid plate requests via custom exception layers.',
      badge: 'Safe Operations',
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
    },
  ];

  const quickStats = [
    { label: 'Verified Engine Tests', value: '11 / 11', sub: 'Java TestAll.java Suite' },
    { label: 'Calculation Latency', value: '< 1 ms', sub: 'Deterministic Pure Math' },
    { label: 'Menu Categories', value: '6 Types', sub: 'Food, Starters, Drinks' },
    { label: 'Billing DNA Security', value: '14-Hex', sub: 'Collision Resistant Hash' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 space-y-10 max-w-6xl mx-auto w-full animate-fadeIn select-none">
      {/* ─── Top Bar: Location Selector Pill ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-graphite-800/80">
        <div className="flex items-center gap-2">
          <span className="text-accent text-sm font-black tracking-wider uppercase">◆ PLATEFLOW</span>
          <span className="text-xs text-graphite-500 font-mono">| RESTAURANT OS</span>
        </div>

        {/* Location Icon Feature */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-graphite-900 hover:bg-accent/15 border border-graphite-700/80 hover:border-accent/40 text-xs text-graphite-300 hover:text-accent transition-all shadow-sm"
          title="Click to change restaurant state & city (Auto-updates Bill Pincode)"
        >
          <MapPin size={14} className="text-accent group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-ivory-100">
            {currentLocation.city}, {currentLocation.state}
          </span>
          <span className="font-mono text-accent font-bold px-1.5 py-0.5 rounded bg-graphite-800 text-[11px]">
            PIN: {currentLocation.pincode}
          </span>
          <span className="text-[10px] text-graphite-400 uppercase font-mono pl-1 hidden sm:inline">
            (Change Location)
          </span>
        </button>
      </div>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-graphite-900 via-graphite-900/90 to-graphite-950 border border-graphite-700/80 p-8 sm:p-12 lg:p-14 text-center space-y-6 shadow-2xl">
        {/* Glow ambient backdrops */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-10 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Location Quick Badge in Hero */}
        <div className="relative flex justify-center">
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
          >
            <MapPin size={13} />
            <span>Branch: {currentLocation.address}, {currentLocation.city} — PIN {currentLocation.pincode}</span>
          </button>
        </div>

        {/* Title */}
        <div className="relative space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-ivory-50 tracking-tight leading-tight">
            Elevate Dining with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-accent to-orange-500">PlateFlow</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-graphite-300 font-normal leading-relaxed">
            Ultra-fast restaurant billing, interactive customer table tablets, automated kitchen display pipelines, and high-precision single-page thermal invoicing.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="relative flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => onNavigate('dishes')}
            className="btn-primary py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <BookOpen size={18} />
            <span>Browse Menu &amp; Order</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigate('table-view')}
            className="btn-secondary py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base flex items-center gap-2 hover:border-accent/40 transition-colors"
          >
            <Tablet size={18} className="text-accent" />
            <span>Customer Table View</span>
          </button>

          <button
            onClick={() => onNavigate('operations')}
            className="btn-secondary py-3.5 px-5 rounded-xl font-semibold text-sm sm:text-base flex items-center gap-2 hover:border-accent/40 transition-colors"
          >
            <Zap size={18} className="text-accent" />
            <span>Operations Console</span>
          </button>
        </div>

        {/* Floating Quick Chips */}
        <div className="relative flex flex-wrap justify-center gap-2 pt-4 border-t border-graphite-800/80">
          {[
            { id: 'dishes', label: 'Dish Explorer', icon: BookOpen },
            { id: 'bill', label: 'Active Bill', icon: Receipt },
            { id: 'preview', label: 'Single-Page Receipt', icon: Star },
            { id: 'kitchen', label: 'Kitchen KDS', icon: ChefHat },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="px-3 py-1.5 rounded-lg bg-graphite-800/60 hover:bg-graphite-800 border border-graphite-700/60 hover:border-accent/40 text-xs text-graphite-300 hover:text-ivory-100 flex items-center gap-1.5 transition-all font-medium"
            >
              <item.icon size={13} className="text-accent" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Quick Stats Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <div
            key={i}
            className="card-base p-5 text-center space-y-1 bg-graphite-900/60 border-graphite-800/80 hover:border-accent/30 transition-colors"
          >
            <div className="text-2xl sm:text-3xl font-black font-mono text-accent">
              {stat.value}
            </div>
            <div className="text-xs font-bold text-ivory-100 uppercase tracking-wide">
              {stat.label}
            </div>
            <div className="text-[11px] text-graphite-400 font-mono">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Expandable Production Grade Modules & Architecture Section ───── */}
      <div className="space-y-4">
        {/* Clickable Line/Header to toggle hidden data */}
        <button
          onClick={() => setIsModulesExpanded(!isModulesExpanded)}
          className="w-full card-base p-4 sm:p-5 flex items-center justify-between gap-4 border border-graphite-700/80 hover:border-accent/40 bg-graphite-900/90 transition-all text-left group cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/30 group-hover:scale-105 transition-transform">
              <Flame size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-ivory-50 group-hover:text-accent transition-colors">
                  Production Grade Modules
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-[10px] font-mono text-accent font-bold">
                  {isModulesExpanded ? 'ACTIVE' : 'CLICK TO VIEW'}
                </span>
              </div>
              <p className="text-xs text-graphite-400">
                {isModulesExpanded
                  ? 'Showing Next-Gen Restaurant OS, Core Java Collections Architecture & 4 Engine Modules'
                  : 'Click this line to expand architecture badges and production modules'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-accent">
            <span className="hidden sm:inline">
              {isModulesExpanded ? 'Hide Details' : 'Show Details'}
            </span>
            {isModulesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {/* ─── Hidden Content (Visible only when line is clicked) ─────────── */}
        {isModulesExpanded && (
          <div className="space-y-6 pt-2 animate-fadeIn">
            {/* Previously hidden architecture badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 p-4 rounded-2xl bg-graphite-900/60 border border-graphite-800">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-mono font-bold tracking-wide shadow-sm">
                <Sparkles size={13} />
                NEXT-GEN RESTAURANT OS
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-graphite-800 border border-graphite-700 text-graphite-200 text-xs font-mono font-semibold">
                <Award size={13} className="text-accent" />
                Core Java Collections Architecture
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck size={13} />
                11/11 Java TestAll.java Suite PASS
              </span>
            </div>

            {/* 4 Production Grade Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {features.map((feat, i) => (
                <div
                  key={i}
                  className={`p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${feat.color} border transition-all duration-300 hover:scale-[1.01] space-y-3 shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-graphite-950/80 border border-graphite-700/60 text-accent">
                      <feat.icon size={22} />
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-graphite-950/70 border border-graphite-700/80 text-graphite-200">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ivory-50">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-graphite-300 leading-relaxed font-normal">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom CTA Banner ────────────────────────────────────────────── */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-accent/15 via-graphite-900 to-accent/10 border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-black text-ivory-50">
            Ready to experience PlateFlow?
          </h3>
          <p className="text-xs sm:text-sm text-graphite-300">
            Branch: <strong className="text-accent">{currentLocation.city}, {currentLocation.state} (PIN {currentLocation.pincode})</strong>. Place orders and generate compact bills seamlessly.
          </p>
        </div>
        <button
          onClick={() => onNavigate('dishes')}
          className="btn-primary py-3 px-6 rounded-xl font-bold text-sm whitespace-nowrap flex items-center gap-2 shadow-lg shadow-accent/20 flex-shrink-0"
        >
          <BookOpen size={16} />
          <span>Launch Dish Explorer</span>
        </button>
      </div>

      {/* ─── Location Picker Modal ────────────────────────────────────────── */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSaveLocation={handleSaveLocation}
      />
    </div>
  );
}
