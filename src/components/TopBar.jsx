import {
  Clock, Calendar, Activity, Menu, X, Zap, BookOpen, FileText,
  Eye, Shield, Clock as HistoryIcon, TrendingUp, Wifi, WifiOff,
  ChefHat, Tablet, Package, Home,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TopBar({ order, currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close drawer when page changes
  useEffect(() => { setMobileMenuOpen(false); }, [currentPage]);

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const dateStr = currentTime.toLocaleDateString('en-GB');

  // Full nav list used in the mobile drawer
  const navGroups = [
    {
      label: 'Portal',
      items: [
        { id: 'landing',    label: 'Home & Features',    icon: Home },
        { id: 'operations', label: 'Operations Console', icon: Zap },
        { id: 'dishes',     label: 'Dish Explorer',      icon: BookOpen },
        { id: 'bill',       label: 'Active Bill',         icon: FileText },
        { id: 'preview',    label: 'Tax Receipt',         icon: Eye },
      ],
    },
    {
      label: 'Table & Kitchen',
      items: [
        { id: 'table-view', label: 'Table View',          icon: Tablet },
        { id: 'kitchen',    label: 'Kitchen Display',     icon: ChefHat },
        { id: 'inventory',  label: 'Inventory Manager',   icon: Package },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { id: 'history',     label: 'Order History',      icon: HistoryIcon },
        { id: 'insights',    label: 'System Insights',    icon: TrendingUp },
        { id: 'reliability', label: 'Reliability Center', icon: Shield },
      ],
    },
  ];

  return (
    <header
      className="no-print bg-graphite-900/95 border-b border-graphite-700/80 backdrop-blur-md sticky top-0 z-30 w-full"
      role="banner"
    >
      {/* ── Top bar row ─────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-5 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">

        {/* Left — hamburger (mobile/tablet) + brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onNavigate && (
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden shrink-0 p-2 rounded-lg bg-graphite-800 border border-graphite-700
                         text-ivory-100 hover:bg-graphite-700 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-ivory-50 flex items-center gap-1.5 truncate">
              <span className="text-accent shrink-0">◆</span>
              <span>PLATEFLOW</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-graphite-400 font-medium hidden sm:block">
              Restaurant Billing Operations
            </p>
          </div>
        </div>

        {/* Right — status indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          {/* Online / Offline */}
          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isOnline
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
            }`}
            title={isOnline ? 'System online' : 'Offline — saved locally'}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Clock — hidden on tiny phones */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-graphite-800 border border-graphite-700">
            <Clock size={13} className="text-accent shrink-0" />
            <div className="text-xs leading-tight">
              <div className="text-graphite-500 text-[9px] uppercase font-mono">Time</div>
              <div className="font-semibold text-ivory-100 font-mono text-[11px] sm:text-xs">{timeStr}</div>
            </div>
          </div>

          {/* Date — only md+ */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-graphite-800 border border-graphite-700">
            <Calendar size={13} className="text-accent shrink-0" />
            <div className="text-xs leading-tight">
              <div className="text-graphite-500 text-[9px] uppercase font-mono">Date</div>
              <div className="font-semibold text-ivory-100 font-mono text-[11px]">{dateStr}</div>
            </div>
          </div>

          {/* Active Order ID */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-graphite-800 border border-graphite-700">
            <Activity size={13} className="text-accent shrink-0" />
            <div className="text-xs leading-tight">
              <div className="text-graphite-500 text-[9px] uppercase font-mono hidden sm:block">Order</div>
              <div className="font-semibold text-accent font-mono text-[11px] sm:text-xs">
                #{order?.id || '---'}
              </div>
            </div>
          </div>

          {/* Order state — only large screens */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse shrink-0" />
            <div className="text-xs leading-tight">
              <div className="text-graphite-400 text-[9px] uppercase font-mono">State</div>
              <div className="font-bold text-accent font-mono text-[11px]">{order?.status || 'ACTIVE'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile / Tablet Nav Drawer ──────────────────────────────────────── */}
      {mobileMenuOpen && onNavigate && (
        <nav
          id="mobile-nav-drawer"
          className="md:hidden border-t border-graphite-700 bg-graphite-900 animate-fadeIn
                     max-h-[75dvh] overflow-y-auto overscroll-contain"
          aria-label="Mobile navigation"
        >
          {navGroups.map((group) => (
            <div key={group.label} className="px-3 py-2">
              <div className="px-2 py-1 text-[10px] font-bold text-graphite-600 uppercase tracking-widest font-mono">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-${item.id}`}
                      onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent/20 text-accent border border-accent/30 font-semibold'
                          : 'text-graphite-300 hover:bg-graphite-800 hover:text-ivory-100 active:bg-graphite-700'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-accent' : 'text-graphite-400'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Mini status bar inside drawer */}
          <div className="mx-3 mb-3 mt-1 p-3 rounded-lg bg-graphite-800/60 border border-graphite-700 flex items-center justify-between text-xs font-mono">
            <span className="text-graphite-400">{dateStr} · {timeStr}</span>
            <span className={`flex items-center gap-1 font-semibold ${isOnline ? 'text-green-400' : 'text-amber-400'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </nav>
      )}
    </header>
  );
}
