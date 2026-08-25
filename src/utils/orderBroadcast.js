/**
 * PlateFlow Order Broadcast System
 * Central localStorage-based event bus for syncing:
 *   - Active table selection
 *   - Kitchen tickets
 *   - Stage status across Table View ↔ Kitchen Display
 */

export const KITCHEN_TICKETS_KEY = 'plateflow-kitchen-tickets';
export const TABLE_KEY = 'plateflow-current-table';
export const STATUS_KEY = 'plateflow-ticket-status';
export const TIMER_KEY = 'plateflow-stage-started-at';
export const ORDER_TABLE_MAP_KEY = 'plateflow-order-table-map'; // orderId → tableNo

// ─── Write a new or updated order ticket to Kitchen ─────────────────────────
export function broadcastOrderToKitchen({ orderId, tableNo, items, status = 'NEW' }) {
  try {
    const tickets = getKitchenTickets();
    const existingIdx = tickets.findIndex((t) => t.id === orderId);
    const now = Date.now();

    const createdAt = existingIdx >= 0 && tickets[existingIdx].createdAt ? tickets[existingIdx].createdAt : now;
    const completedAt = status === 'SERVED' ? (existingIdx >= 0 && tickets[existingIdx].completedAt ? tickets[existingIdx].completedAt : now) : null;

    const ticket = {
      id: orderId,
      table: tableNo,
      timeAgo: 0,
      targetDurationSec: 300, // 5:00 minutes target prep window
      createdAt,
      completedAt,
      station: 'hot-kitchen',
      status,
      items: items.map((i) => ({
        name: i.name,
        qty: i.quantity,
        notes: i.category ? `Category: ${i.category}` : 'Live Order',
      })),
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      tickets[existingIdx] = { ...tickets[existingIdx], ...ticket };
    } else {
      tickets.unshift(ticket);
    }

    localStorage.setItem(KITCHEN_TICKETS_KEY, JSON.stringify(tickets));

    // Also update table-stage status
    const allStatuses = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
    // Map kitchen status → TableView stage
    const stageMap = {
      NEW: 'RECEIVED',
      PREPARING: 'PREPARING',
      'READY TO SERVE': 'READY',
      SERVED: 'SERVED',
    };
    allStatuses[tableNo] = stageMap[status] || 'RECEIVED';
    localStorage.setItem(STATUS_KEY, JSON.stringify(allStatuses));

    // Set active table
    localStorage.setItem(TABLE_KEY, tableNo);

    // Track orderId → tableNo mapping for multi-order support
    const map = JSON.parse(localStorage.getItem(ORDER_TABLE_MAP_KEY) || '{}');
    map[orderId] = tableNo;
    localStorage.setItem(ORDER_TABLE_MAP_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[PlateFlow] broadcastOrderToKitchen error:', e);
  }
}

// ─── Get all kitchen tickets ─────────────────────────────────────────────────
export function getKitchenTickets() {
  try {
    const raw = localStorage.getItem(KITCHEN_TICKETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Update the status of a kitchen ticket ───────────────────────────────────
export function updateKitchenTicketStatus(ticketId, nextStatus) {
  try {
    const tickets = getKitchenTickets();
    const now = Date.now();
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'SERVED' ? (t.completedAt || now) : null,
            updatedAt: now,
          }
        : t
    );
    localStorage.setItem(KITCHEN_TICKETS_KEY, JSON.stringify(updated));

    // Sync back to TableView stage status
    const ticket = updated.find((t) => t.id === ticketId);
    if (ticket) {
      const stageMap = {
        NEW: 'RECEIVED',
        PREPARING: 'PREPARING',
        'READY TO SERVE': 'READY',
        SERVED: 'SERVED',
      };
      const allStatuses = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
      allStatuses[ticket.table] = stageMap[nextStatus] || 'RECEIVED';
      localStorage.setItem(STATUS_KEY, JSON.stringify(allStatuses));

      // Reset stage timer when advancing
      localStorage.setItem(`${TIMER_KEY}-${ticket.table}`, String(Date.now()));
    }
  } catch (e) {
    console.warn('[PlateFlow] updateKitchenTicketStatus error:', e);
  }
}

// ─── Get table number for a specific order ───────────────────────────────────
export function getTableForOrder(orderId) {
  try {
    const map = JSON.parse(localStorage.getItem(ORDER_TABLE_MAP_KEY) || '{}');
    return map[orderId] || null;
  } catch {
    return null;
  }
}

// ─── Assign a table to an order ──────────────────────────────────────────────
export function assignTableToOrder(orderId, tableNo) {
  try {
    const map = JSON.parse(localStorage.getItem(ORDER_TABLE_MAP_KEY) || '{}');
    map[orderId] = tableNo;
    localStorage.setItem(ORDER_TABLE_MAP_KEY, JSON.stringify(map));
    localStorage.setItem(TABLE_KEY, tableNo);
  } catch (e) {
    console.warn('[PlateFlow] assignTableToOrder error:', e);
  }
}

// ─── Get stage for a table (from TableQROrder perspective) ───────────────────
export function getTableStage(tableNo) {
  try {
    const all = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
    return all[tableNo] || 'RECEIVED';
  } catch {
    return 'RECEIVED';
  }
}

// ─── Generate a unique sequential table number for each new order ─────────────
export function generateNextTableNo() {
  try {
    const map = JSON.parse(localStorage.getItem(ORDER_TABLE_MAP_KEY) || '{}');
    const usedNums = Object.values(map)
      .filter((t) => /^Table \d+$/.test(t))
      .map((t) => parseInt(t.replace('Table ', ''), 10));
    const next = usedNums.length > 0 ? Math.max(...usedNums) + 1 : 1;
    return `Table ${String(next).padStart(2, '0')}`;
  } catch {
    return 'Table 01';
  }
}

// ─── Get all active (non-SERVED) kitchen tickets ─────────────────────────────
export function getActiveOrders() {
  try {
    const tickets = getKitchenTickets();
    return tickets.filter((t) => t.status !== 'SERVED');
  } catch {
    return [];
  }
}

// ─── Get ALL table → stage statuses ──────────────────────────────────────────
export function getAllTableStatuses() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
  } catch {
    return {};
  }
}
