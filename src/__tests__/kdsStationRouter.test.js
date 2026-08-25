import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStationForCategory,
  routeOrderToStations,
  isOrderFullyReady,
  calculateStationReadinessPercent,
  updateStationTicketStatus,
  getAllStationSubTickets,
  KDS_STATIONS,
} from '../utils/kdsStationRouter';

describe('Feature 3: Smart Kitchen Station Router & Expediter Matrix Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Dish Category to Station Routing', () => {
    it('routes mains and starters to HOT_LINE station', () => {
      expect(getStationForCategory('food')).toBe('HOT_LINE');
      expect(getStationForCategory('main')).toBe('HOT_LINE');
      expect(getStationForCategory('starters')).toBe('HOT_LINE');
    });

    it('routes hot-drinks, soft-drinks, and beverages to BEVERAGE_BAR station', () => {
      expect(getStationForCategory('hot-drinks')).toBe('BEVERAGE_BAR');
      expect(getStationForCategory('soft-drinks')).toBe('BEVERAGE_BAR');
      expect(getStationForCategory('beverages')).toBe('BEVERAGE_BAR');
    });

    it('routes desserts to COLD_DESSERT station', () => {
      expect(getStationForCategory('desserts')).toBe('COLD_DESSERT');
    });
  });

  describe('Multi-Item Order Splitting into Sub-Tickets', () => {
    it('splits combined order into Hot Line, Bar, and Cold sub-tickets', () => {
      const order = {
        table: 'Table 04',
        items: [
          { name: 'Chicken Biryani', category: 'food', qty: 2 },
          { name: 'Paneer Tikka', category: 'starters', qty: 1 },
          { name: 'Kumbakonam Filter Coffee', category: 'hot-drinks', qty: 2 },
          { name: 'Gulab Jamun', category: 'desserts', qty: 2 },
        ],
      };

      const stations = routeOrderToStations(order);

      // Should create 3 station sub-tickets
      expect(Object.keys(stations).length).toBe(3);
      expect(stations.HOT_LINE.items.length).toBe(2); // Biryani + Paneer Tikka
      expect(stations.BEVERAGE_BAR.items.length).toBe(1); // Coffee
      expect(stations.COLD_DESSERT.items.length).toBe(1); // Gulab Jamun
    });
  });

  describe('Expediter Readiness Sync & Calculator', () => {
    it('calculates 100% readiness when all sub-tickets are READY', () => {
      const subTickets = {
        HOT_LINE: { status: 'READY' },
        BEVERAGE_BAR: { status: 'READY' },
        COLD_DESSERT: { status: 'READY' },
      };

      expect(isOrderFullyReady(subTickets)).toBe(true);
      expect(calculateStationReadinessPercent(subTickets)).toBe(100);
    });

    it('returns false for fully ready when any sub-ticket is PREPARING', () => {
      const subTickets = {
        HOT_LINE: { status: 'READY' },
        BEVERAGE_BAR: { status: 'PREPARING' }, // Bar still brewing coffee
        COLD_DESSERT: { status: 'READY' },
      };

      expect(isOrderFullyReady(subTickets)).toBe(false);
      expect(calculateStationReadinessPercent(subTickets)).toBe(83); // (100 + 50 + 100) / 3 = 83
    });
  });

  describe('Sub-Ticket State Transitions & Persistence', () => {
    it('updates station sub-ticket status and persists timestamps', () => {
      updateStationTicketStatus('Table 05', 'HOT_LINE', 'PREPARING');
      let tickets = getAllStationSubTickets();
      expect(tickets['Table 05'].HOT_LINE.status).toBe('PREPARING');
      expect(tickets['Table 05'].HOT_LINE.startedAt).toBeDefined();

      updateStationTicketStatus('Table 05', 'HOT_LINE', 'READY');
      tickets = getAllStationSubTickets();
      expect(tickets['Table 05'].HOT_LINE.status).toBe('READY');
      expect(tickets['Table 05'].HOT_LINE.readyAt).toBeDefined();
    });
  });
});
