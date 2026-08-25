import { describe, it, expect } from 'vitest';
import {
  defaultDishes,
  getOrderMetadata,
  validateQuantityGuard,
  formatOrderDate,
  formatOrderTime,
  generateFingerprint,
} from '../utils/billingEngine';

describe('PlateFlow End-to-End Billing Workflow Simulation', () => {
  it('simulates full path: Ops -> Dish Explorer -> Active Bill -> Guard Check -> Bill Generation -> History -> Insights', () => {
    // Step 1: Initialize Order
    const activeOrder = {
      id: 1050,
      date: formatOrderDate(new Date()),
      time: formatOrderTime(new Date()),
      items: [],
      status: 'ACTIVE',
    };

    let meta = getOrderMetadata(activeOrder);
    expect(meta.itemCount).toBe(0);
    expect(meta.grandTotal).toBe(0);

    // Step 2: Dish Explorer - Add Idli and Biryani
    const idli = defaultDishes.find((d) => d.name === 'Idli');
    const biryani = defaultDishes.find((d) => d.name === 'Chicken Biryani');

    activeOrder.items.push({ ...idli, quantity: 2 }); // 2 * 100 = 200
    activeOrder.items.push({ ...biryani, quantity: 1 }); // 1 * 400 = 400

    meta = getOrderMetadata(activeOrder);
    expect(meta.itemCount).toBe(2);
    expect(meta.plateCount).toBe(3);
    expect(meta.subtotal).toBe(600);
    expect(meta.sgst).toBe(30);
    expect(meta.cgst).toBe(30);
    expect(meta.grandTotal).toBe(660);

    // Step 3: Active Bill - Attempt invalid plate reduction
    const idliInOrder = activeOrder.items.find((i) => i.id === idli.id);
    const guardCheck = validateQuantityGuard(idliInOrder.quantity, 10);
    expect(guardCheck.blocked).toBe(true);
    expect(guardCheck.available).toBe(2);
    expect(guardCheck.requested).toBe(10);

    // Valid update
    idliInOrder.quantity = 3; // 3 * 100 = 300; Total subtotal = 700
    meta = getOrderMetadata(activeOrder);
    expect(meta.subtotal).toBe(700);
    expect(meta.sgst).toBe(35);
    expect(meta.cgst).toBe(35);
    expect(meta.grandTotal).toBe(770);

    // Step 4: Generate Bill & Create Fingerprint
    const fingerprint = generateFingerprint(activeOrder.id, meta.itemCount, meta.plateCount, meta.grandTotal);
    expect(fingerprint).toBeDefined();
    expect(fingerprint.length).toBe(14);

    const completedOrder = {
      ...activeOrder,
      status: 'COMPLETED',
      subtotal: meta.subtotal,
      sgst: meta.sgst,
      cgst: meta.cgst,
      grandTotal: meta.grandTotal,
      itemCount: meta.itemCount,
      plateCount: meta.plateCount,
    };

    // Step 5: Archive into Order History
    const history = [completedOrder];
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(1050);
    expect(history[0].grandTotal).toBe(770);

    // Step 6: Verify System Insights Aggregate Calculations
    const totalOrders = history.length;
    const totalPlates = history.reduce((sum, o) => sum + o.plateCount, 0);
    const totalRevenue = history.reduce((sum, o) => sum + o.grandTotal, 0);
    const avgOrderValue = totalRevenue / totalOrders;

    expect(totalOrders).toBe(1);
    expect(totalPlates).toBe(4); // 3 idlis + 1 biryani
    expect(totalRevenue).toBe(770);
    expect(avgOrderValue).toBe(770);
  });
});
