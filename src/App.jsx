import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MobileNav from './components/MobileNav';
import Toast from './components/Toast';
import {
  defaultDishes,
  formatOrderDate,
  formatOrderTime,
  createOrderNumber,
  getOrderMetadata,
} from './utils/billingEngine';
import {
  broadcastOrderToKitchen,
  assignTableToOrder,
  generateNextTableNo,
  TABLE_KEY,
} from './utils/orderBroadcast';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const OperationsConsole = lazy(() => import('./pages/OperationsConsole'));
const DishExplorer = lazy(() => import('./pages/DishExplorer'));
const ActiveBill = lazy(() => import('./pages/ActiveBill'));
const BillPreview = lazy(() => import('./pages/BillPreview'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const SystemInsights = lazy(() => import('./pages/SystemInsights'));
const ReliabilityCenter = lazy(() => import('./pages/ReliabilityCenter'));
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'));
const TableQROrder = lazy(() => import('./pages/TableQROrder'));
const InventoryManager = lazy(() => import('./pages/InventoryManager'));

// ─── Seed order history ───────────────────────────────────────────────────────
const initialSeedOrders = [
  {
    id: 1042, date: '24-08-2026', time: '01:15 PM',
    items: [
      { id: 1, name: 'Idli', price: 100, quantity: 2, category: 'main' },
      { id: 2, name: 'Chicken Biryani', price: 400, quantity: 1, category: 'main' },
    ],
    status: 'COMPLETED', subtotal: 600, sgst: 30, cgst: 30, grandTotal: 660, itemCount: 2, plateCount: 3,
  },
  {
    id: 1041, date: '24-08-2026', time: '12:45 PM',
    items: [
      { id: 3, name: 'Dosa', price: 150, quantity: 2, category: 'main' },
      { id: 4, name: 'Pulao', price: 100, quantity: 1, category: 'main' },
    ],
    status: 'COMPLETED', subtotal: 400, sgst: 20, cgst: 20, grandTotal: 440, itemCount: 2, plateCount: 3,
  },
  {
    id: 1040, date: '24-08-2026', time: '11:30 AM',
    items: [{ id: 2, name: 'Chicken Biryani', price: 400, quantity: 2, category: 'main' }],
    status: 'COMPLETED', subtotal: 800, sgst: 40, cgst: 40, grandTotal: 880, itemCount: 1, plateCount: 2,
  },
  {
    id: 1039, date: '23-08-2026', time: '08:20 PM',
    items: [
      { id: 1, name: 'Idli', price: 100, quantity: 4, category: 'main' },
      { id: 3, name: 'Dosa', price: 150, quantity: 1, category: 'main' },
    ],
    status: 'COMPLETED', subtotal: 550, sgst: 27.5, cgst: 27.5, grandTotal: 605, itemCount: 2, plateCount: 5,
  },
  {
    id: 1038, date: '23-08-2026', time: '07:10 PM',
    items: [
      { id: 4, name: 'Pulao', price: 100, quantity: 3, category: 'main' },
      { id: 2, name: 'Chicken Biryani', price: 400, quantity: 1, category: 'main' },
    ],
    status: 'COMPLETED', subtotal: 700, sgst: 35, cgst: 35, grandTotal: 770, itemCount: 2, plateCount: 4,
  },
];

const defaultAdminCredentials = { username: 'plateflow_admin', password: 'admin@123' };

const createNewOrder = () => {
  const now = new Date();
  return {
    id: createOrderNumber(),
    date: formatOrderDate(now),
    time: formatOrderTime(now),
    items: [],
    status: 'ACTIVE',
    createdAt: now.toISOString(),
    closedAt: null,
  };
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [pricingMode, setPricingMode] = useState('standard');
  const [selectedPreviewOrder, setSelectedPreviewOrder] = useState(null);

  // Active table number — auto-assigned per order, persisted
  const [activeTableNo, setActiveTableNo] = useState(() => {
    try { return localStorage.getItem(TABLE_KEY) || 'Table 01'; } catch { return 'Table 01'; }
  });

  const handleSetTable = (tableNo) => {
    setActiveTableNo(tableNo);
    try { localStorage.setItem(TABLE_KEY, tableNo); } catch { /* ignore */ }
  };

  const [order, setOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('plateflow-active-order');
      return saved ? JSON.parse(saved) : createNewOrder();
    } catch { return createNewOrder(); }
  });

  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('plateflow-order-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialSeedOrders;
    } catch { return initialSeedOrders; }
  });

  const [dishes, setDishes] = useState(() => {
    try {
      const saved = localStorage.getItem('plateflow-dishes');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate: ensure old dishes without category get 'food'
        return parsed.map((d) => ({ ...d, category: d.category === 'main' ? 'food' : (d.category || 'food') }));
      }
      return defaultDishes;
    } catch { return defaultDishes; }
  });

  const [adminCredentials, setAdminCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('plateflow-admin-credentials');
      return saved ? JSON.parse(saved) : defaultAdminCredentials;
    } catch { return defaultAdminCredentials; }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Persistence
  useEffect(() => { localStorage.setItem('plateflow-active-order', JSON.stringify(order)); }, [order]);
  useEffect(() => { localStorage.setItem('plateflow-order-history', JSON.stringify(orderHistory)); }, [orderHistory]);
  useEffect(() => { localStorage.setItem('plateflow-dishes', JSON.stringify(dishes)); }, [dishes]);
  useEffect(() => { localStorage.setItem('plateflow-admin-credentials', JSON.stringify(adminCredentials)); }, [adminCredentials]);

  // Desktop key-bindings (1–7 page switch, Esc = close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const keyMap = { '0': 'landing', '1': 'operations', '2': 'dishes', '3': 'bill', '4': 'preview', '5': 'history', '6': 'insights', '7': 'reliability' };
      if (keyMap[e.key]) setCurrentPage(keyMap[e.key]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const updateDish = (dishId, changes) =>
    setDishes((prev) => prev.map((d) => (d.id === dishId ? { ...d, ...changes } : d)));

  const addMenuDish = (newDish) =>
    setDishes((prev) => [...prev, { id: Date.now(), quantity: 0, ...newDish }]);

  const removeMenuDish = (dishId) =>
    setDishes((prev) => prev.filter((d) => d.id !== dishId));

  const addDishToOrder = (dishId) => {
    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) return;

    let updatedItems = [];
    setOrder((prev) => {
      const existing = prev.items.find((i) => i.id === dishId);
      let newItems;
      if (existing) {
        newItems = prev.items.map((i) => i.id === dishId ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newItems = [...prev.items, { ...dish, quantity: 1 }];
      }
      updatedItems = newItems;

      // Auto-assign a unique table if this order doesn't have one yet
      const currentTable = localStorage.getItem(TABLE_KEY) || generateNextTableNo();
      assignTableToOrder(prev.id, currentTable);

      // Broadcast to Kitchen Display immediately
      broadcastOrderToKitchen({
        orderId: prev.id,
        tableNo: currentTable,
        items: newItems,
        status: 'NEW',
      });

      return { ...prev, items: newItems };
    });

    addToast(`${dish.name} added — opening Active Bill`, 'success');
    setCurrentPage('bill');
  };

  const removeDishFromOrder = (dishId) => {
    const dish = dishes.find((d) => d.id === dishId);
    setOrder((prev) => {
      const existing = prev.items.find((i) => i.id === dishId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return { ...prev, items: prev.items.map((i) => i.id === dishId ? { ...i, quantity: i.quantity - 1 } : i) };
      }
      return { ...prev, items: prev.items.filter((i) => i.id !== dishId) };
    });
    if (dish) addToast(`Decreased ${dish.name} quantity`, 'info');
  };

  const updateQuantity = (dishId, newQuantity) => {
    if (newQuantity < 0) { addToast('Quantity cannot be negative', 'error'); return; }
    if (newQuantity === 0) { removeFromOrder(dishId); return; }
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((i) => i.id === dishId ? { ...i, quantity: newQuantity } : i),
    }));
  };

  const removeFromOrder = (dishId) => {
    const item = order.items.find((e) => e.id === dishId);
    setOrder((prev) => ({ ...prev, items: prev.items.filter((e) => e.id !== dishId) }));
    if (item) addToast(`${item.name} removed from bill`, 'info');
  };

  const completeCurrentOrder = () => {
    if (!order.items.length) { addToast('Add dishes before generating the bill', 'error'); return null; }
    const now = new Date();
    const completedOrder = {
      ...order,
      status: 'COMPLETED',
      date: formatOrderDate(now),
      time: formatOrderTime(now),
      closedAt: now.toISOString(),
    };
    const orderWithMeta = { ...completedOrder, ...getOrderMetadata(completedOrder, pricingMode) };

    // Broadcast COMPLETED to Kitchen Display & Table View
    const tableNo = localStorage.getItem(TABLE_KEY) || activeTableNo;
    broadcastOrderToKitchen({
      orderId: completedOrder.id,
      tableNo,
      items: completedOrder.items,
      status: 'SERVED',
    });

    setOrderHistory((prev) => [orderWithMeta, ...prev]);
    setSelectedPreviewOrder(orderWithMeta);

    // New order gets a fresh unique table
    const newOrder = createNewOrder();
    const nextTable = generateNextTableNo();
    handleSetTable(nextTable);
    setOrder(newOrder);
    setCurrentPage('preview');
    addToast(`Bill #${completedOrder.id} generated — Table ${tableNo} marked Served!`, 'success');
    return orderWithMeta;
  };

  const generateAdminCredentials = () => {
    const username = `admin_${Math.random().toString(36).slice(2, 8)}`;
    const password = `PLT${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const generated = { username, password };
    setAdminCredentials(generated);
    setIsAdminLoggedIn(false);
    addToast(`New credentials: ${username} / ${password}`, 'success');
  };

  const activeOrderMetadata = useMemo(() => getOrderMetadata(order, pricingMode), [order, pricingMode]);
  const activePreviewOrder = selectedPreviewOrder || (orderHistory.length > 0 ? orderHistory[0] : order);
  const activePreviewMetadata = useMemo(() => getOrderMetadata(activePreviewOrder, pricingMode), [activePreviewOrder, pricingMode]);

  const handleSelectHistoryOrder = (historicalOrder) => {
    setSelectedPreviewOrder(historicalOrder);
    setCurrentPage('preview');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} addToast={addToast} />;
      case 'operations':
        return (
          <OperationsConsole
            order={order}
            orderMetadata={activeOrderMetadata}
            onStageNavigate={setCurrentPage}
            pricingMode={pricingMode}
            onPricingModeChange={(mode) => { setPricingMode(mode); addToast(`Pricing switched to ${mode.toUpperCase()}`, 'info'); }}
          />
        );
      case 'dishes':
        return (
          <DishExplorer
            dishes={dishes}
            order={order}
            onAddDish={addDishToOrder}
            onRemoveDish={removeDishFromOrder}
            onUpdateDish={updateDish}
            onAddMenuDish={addMenuDish}
            onRemoveMenuDish={removeMenuDish}
            adminCredentials={adminCredentials}
            isAdminLoggedIn={isAdminLoggedIn}
            onAdminLogin={() => setIsAdminLoggedIn(true)}
            onAdminLogout={() => setIsAdminLoggedIn(false)}
            onGenerateAdminCredentials={generateAdminCredentials}
            addToast={addToast}
          />
        );
      case 'kitchen':
        return <KitchenDisplay order={order} activeTableNo={activeTableNo} onNavigate={setCurrentPage} />;
      case 'table-view':
        return (
          <TableQROrder
            dishes={dishes}
            order={order}
            onAddDish={addDishToOrder}
            onRemoveDish={removeDishFromOrder}
            activeTableNo={activeTableNo}
            onTableChange={handleSetTable}
            onNavigate={setCurrentPage}
            addToast={addToast}
          />
        );
      case 'inventory':
        return <InventoryManager order={order} />;
      case 'bill':
        return (
          <ActiveBill
            order={order}
            orderMetadata={activeOrderMetadata}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromOrder}
            onGenerateBill={completeCurrentOrder}
            onNavigate={setCurrentPage}
            addToast={addToast}
          />
        );
      case 'preview':
        return (
          <BillPreview
            order={activePreviewOrder}
            orderMetadata={activePreviewMetadata}
            onNavigate={setCurrentPage}
          />
        );
      case 'history':
        return (
          <OrderHistory
            orders={orderHistory}
            onSelectOrder={handleSelectHistoryOrder}
            onNavigate={setCurrentPage}
          />
        );
      case 'insights':
        return <SystemInsights orders={orderHistory} />;
      case 'reliability':
        return <ReliabilityCenter />;
      default:
        return (
          <OperationsConsole
            order={order}
            orderMetadata={activeOrderMetadata}
            onStageNavigate={setCurrentPage}
          />
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen min-h-dvh bg-graphite-950 text-graphite-100 overflow-x-hidden">
      {/* Sidebar — hidden on mobile/small tablet, visible md+ */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar order={order} currentPage={currentPage} onNavigate={setCurrentPage} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden focus:outline-none
                     pb-20 md:pb-0"   /* space for mobile bottom nav */
          tabIndex={-1}
        >
          <Suspense fallback={
            <div className="p-6 sm:p-8 text-graphite-400 font-mono text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Loading module...
            </div>
          }>
            {renderPage()}
          </Suspense>
        </main>
      </div>

      {/* Mobile / Tablet Bottom Navigation — hidden md+ (sidebar takes over) */}
      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Toast Notifications — adapts position for device */}
      <div
        className="no-print fixed bottom-20 sm:bottom-20 md:bottom-4 right-3 sm:right-4 space-y-2 z-50 w-[calc(100vw-1.5rem)] sm:w-auto sm:max-w-sm"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  );
}
