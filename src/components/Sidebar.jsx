import {
  Zap, BookOpen, FileText, Eye, Clock, TrendingUp, Shield,
  ChefHat, Tablet, Package, Home,
} from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate }) {
  const navGroups = [
    {
      label: 'Portal & Overview',
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
      label: 'Analytics & Reports',
      items: [
        { id: 'history',     label: 'Order History',      icon: Clock },
        { id: 'insights',    label: 'System Insights',    icon: TrendingUp },
        { id: 'reliability', label: 'Reliability Center', icon: Shield },
      ],
    },
  ];

  return (
    <aside
      className="no-print hidden md:flex flex-col flex-shrink-0 bg-graphite-900 border-r border-graphite-700/80 select-none
                 w-56 lg:w-64"
      aria-label="Main sidebar navigation"
    >
      {/* Brand Header */}
      <div className="px-4 lg:px-6 py-5 border-b border-graphite-700/80">
        <div className="flex items-center gap-2">
          <span className="text-lg lg:text-xl font-black text-accent tracking-wider">◆ PLATEFLOW</span>
        </div>
        <div className="text-[11px] text-graphite-400 mt-0.5 font-medium">Java Restaurant Billing Engine</div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2 lg:px-3 py-3 space-y-4 overflow-y-auto" aria-label="Sidebar navigation">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1 text-[10px] font-bold text-graphite-600 uppercase tracking-widest font-mono">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-accent/15 text-accent border border-accent/30 font-semibold shadow-sm shadow-accent/5'
                        : 'text-graphite-300 hover:bg-graphite-800/80 hover:text-ivory-100'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-accent shrink-0' : 'text-graphite-400 shrink-0'} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 mx-2 lg:mx-3 mb-3 lg:mb-4 rounded-lg bg-graphite-800/60 border border-graphite-700/60 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-graphite-400 font-mono">Engine v1.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold text-green-400">ONLINE</span>
          </div>
        </div>
        <p className="text-[11px] text-graphite-500">Comparable&lt;Dish&gt; • 45/45 Tests</p>
      </div>
    </aside>
  );
}
