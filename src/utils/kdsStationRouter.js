/**
 * PlateFlow Smart Kitchen Station Router & Expediter Matrix
 * Connection: Dish Explorer ➡️ KDS Stations (Hot, Bar, Dessert) ➡️ Expediter Ready Sync
 */

export const KDS_STATIONS = {
  ALL: {
    id: 'ALL',
    name: 'Expediter View (Master)',
    icon: '🛎️',
    description: 'Unified kitchen master console tracking all station sub-tickets',
  },
  HOT_LINE: {
    id: 'HOT_LINE',
    name: 'Hot Line Kitchen',
    icon: '🔥',
    categories: ['food', 'main', 'starters'],
    description: 'Tandoor, Biryani, Curries, Gravies, and Hot Starters',
  },
  BEVERAGE_BAR: {
    id: 'BEVERAGE_BAR',
    name: 'Beverage & Bar',
    icon: '🍹',
    categories: ['hot-drinks', 'soft-drinks', 'beverages'],
    description: 'Filter Coffee, Teas, Lassis, Fresh Juices, and Coolers',
  },
  COLD_DESSERT: {
    id: 'COLD_DESSERT',
    name: 'Cold & Dessert Station',
    icon: '🍨',
    categories: ['desserts'],
    description: 'Ice Creams, Gulab Jamun, Kesari, and Chilled Sweets',
  },
};

export const STATION_SUBTICKET_STORAGE_KEY = 'plateflow-station-subtickets';

/**
 * Determine which kitchen station a dish category belongs to
 */
export function getStationForCategory(category) {
  const cat = String(category || 'food').toLowerCase();

  if (KDS_STATIONS.BEVERAGE_BAR.categories.includes(cat)) {
    return KDS_STATIONS.BEVERAGE_BAR.id;
  }
  if (KDS_STATIONS.COLD_DESSERT.categories.includes(cat)) {
    return KDS_STATIONS.COLD_DESSERT.id;
  }
  return KDS_STATIONS.HOT_LINE.id;
}

/**
 * Split a full table order into station sub-tickets
 * Returns a map of stationId -> { stationId, stationName, items, status: 'PENDING' | 'PREPARING' | 'READY' }
 */
export function routeOrderToStations(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const stationsMap = {};

  for (const item of items) {
    const stationId = getStationForCategory(item.category);
    if (!stationsMap[stationId]) {
      stationsMap[stationId] = {
        stationId,
        stationName: KDS_STATIONS[stationId]?.name || stationId,
        icon: KDS_STATIONS[stationId]?.icon || '🍽️',
        items: [],
        status: 'PENDING',
        startedAt: null,
        readyAt: null,
      };
    }
    stationsMap[stationId].items.push(item);
  }

  return stationsMap;
}

/**
 * Check if all station sub-tickets for an order are READY
 */
export function isOrderFullyReady(stationSubTickets) {
  if (!stationSubTickets || Object.keys(stationSubTickets).length === 0) return false;
  const stations = Object.values(stationSubTickets);
  return stations.length > 0 && stations.every((s) => s.status === 'READY');
}

/**
 * Calculate overall readiness percentage across all stations
 */
export function calculateStationReadinessPercent(stationSubTickets) {
  if (!stationSubTickets) return 0;
  const stations = Object.values(stationSubTickets);
  if (stations.length === 0) return 0;

  let score = 0;
  stations.forEach((s) => {
    if (s.status === 'READY') score += 100;
    else if (s.status === 'PREPARING') score += 50;
    else score += 10;
  });

  return Math.round(score / stations.length);
}

/**
 * Get all station sub-tickets from storage
 */
export function getAllStationSubTickets() {
  try {
    const raw = localStorage.getItem(STATION_SUBTICKET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save sub-ticket status for a specific table & station
 */
export function updateStationTicketStatus(tableNo, stationId, newStatus) {
  try {
    const all = getAllStationSubTickets();
    if (!all[tableNo]) all[tableNo] = {};
    if (!all[tableNo][stationId]) {
      all[tableNo][stationId] = { stationId, status: newStatus };
    } else {
      all[tableNo][stationId].status = newStatus;
    }

    if (newStatus === 'PREPARING' && !all[tableNo][stationId].startedAt) {
      all[tableNo][stationId].startedAt = new Date().toISOString();
    } else if (newStatus === 'READY') {
      all[tableNo][stationId].readyAt = new Date().toISOString();
    }

    localStorage.setItem(STATION_SUBTICKET_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('plateflow-station-tickets-updated'));
    return all[tableNo];
  } catch (e) {
    console.warn('[PlateFlow] updateStationTicketStatus error:', e);
    return null;
  }
}
