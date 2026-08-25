import { Home, BookOpen, FileText, Tablet, ChefHat } from 'lucide-react';

export default function MobileNav({ currentPage, onNavigate }) {
  const navItems = [
    { id: 'landing',     label: 'Home',    icon: Home },
    { id: 'dishes',      label: 'Menu',    icon: BookOpen },
    { id: 'bill',        label: 'Bill',    icon: FileText },
    { id: 'table-view',  label: 'Table',   icon: Tablet },
    { id: 'kitchen',     label: 'Kitchen', icon: ChefHat },
  ];

  return (
    <nav
      className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-graphite-900/95 border-t border-graphite-700/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around safe-bottom"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-bottom-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-all ${
              isActive
                ? 'text-accent font-bold bg-accent/10'
                : 'text-graphite-400 hover:text-ivory-100'
            }`}
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
