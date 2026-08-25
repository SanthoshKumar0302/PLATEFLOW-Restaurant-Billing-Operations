import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  getLoyaltyMembers,
  saveLoyaltyMembers,
  findPatronByPhone,
  calculateTier,
  deriveTasteDna,
  recordPatronVisit,
  LOYALTY_TIERS,
  DEFAULT_MEMBERS,
} from '../utils/customerLoyaltyEngine';
import { calculateTax, getOrderMetadata } from '../utils/billingEngine';

describe('Subgraph 4: Customer Loyalty & Repeat Taste DNA Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Loyalty Member Registry', () => {
    it('returns default members when localStorage is empty', () => {
      const members = getLoyaltyMembers();
      expect(members.length).toBe(3);
      expect(members[0].name).toBe('Vikram Sundaram');
    });

    it('saves and retrieves members from localStorage', () => {
      const custom = [{ phone: '1111111111', name: 'Test', tier: 'BRONZE', visits: 1, totalSpent: 100, favouriteDishes: [], tasteDna: '', lastVisitedDna: '' }];
      saveLoyaltyMembers(custom);
      const loaded = getLoyaltyMembers();
      expect(loaded.length).toBe(1);
      expect(loaded[0].phone).toBe('1111111111');
    });
  });

  describe('Patron Lookup by Phone', () => {
    it('finds Gold VIP patron Vikram by phone number 9876543210', () => {
      const patron = findPatronByPhone('9876543210');
      expect(patron).not.toBeNull();
      expect(patron.name).toBe('Vikram Sundaram');
      expect(patron.tier).toBe('GOLD');
    });

    it('finds Platinum Royale patron Rajesh by phone 9988776655', () => {
      const patron = findPatronByPhone('9988776655');
      expect(patron).not.toBeNull();
      expect(patron.name).toBe('Rajesh Kumar');
      expect(patron.tier).toBe('PLATINUM');
    });

    it('returns null for unregistered phone number', () => {
      const patron = findPatronByPhone('0000000000');
      expect(patron).toBeNull();
    });

    it('returns null for empty or malformed phone input', () => {
      expect(findPatronByPhone('')).toBeNull();
      expect(findPatronByPhone(null)).toBeNull();
      expect(findPatronByPhone('abc')).toBeNull();
    });
  });

  describe('Tier Calculation Engine', () => {
    it('assigns BRONZE for 1-2 visits', () => {
      expect(calculateTier(1).id).toBe('BRONZE');
      expect(calculateTier(2).id).toBe('BRONZE');
    });

    it('assigns SILVER for 3-5 visits with 5% discount', () => {
      expect(calculateTier(3).id).toBe('SILVER');
      expect(calculateTier(5).id).toBe('SILVER');
      expect(calculateTier(3).discountPercent).toBe(5);
    });

    it('assigns GOLD for 6-9 visits with 10% discount', () => {
      expect(calculateTier(6).id).toBe('GOLD');
      expect(calculateTier(9).id).toBe('GOLD');
      expect(calculateTier(6).discountPercent).toBe(10);
    });

    it('assigns PLATINUM for 10+ visits with 15% discount', () => {
      expect(calculateTier(10).id).toBe('PLATINUM');
      expect(calculateTier(25).id).toBe('PLATINUM');
      expect(calculateTier(10).discountPercent).toBe(15);
    });
  });

  describe('Taste DNA Profiler', () => {
    it('derives Biryani & Spiced Meat profile from biryani orders', () => {
      const dna = deriveTasteDna([{ name: 'Chicken Biryani' }]);
      expect(dna).toContain('Biryani');
    });

    it('derives South Indian Morning Regular from dosa + coffee', () => {
      const dna = deriveTasteDna([{ name: 'Dosa' }, { name: 'Filter Coffee' }]);
      expect(dna).toContain('South Indian');
    });

    it('returns Standard Dining Connoisseur for empty orders', () => {
      expect(deriveTasteDna([])).toBe('Standard Dining Connoisseur');
    });
  });

  describe('Patron Visit Recording & Tier Upgrade', () => {
    it('upgrades existing Silver patron to Gold after recording 3+ more visits', () => {
      // Ananya starts at Silver (4 visits)
      const updated1 = recordPatronVisit({ phone: '9123456780', orderItems: [{ name: 'Idli' }], grandTotal: 200, billDnaHash: 'PLT-TEST-001' });
      expect(updated1.visits).toBe(5); // Still Silver

      const updated2 = recordPatronVisit({ phone: '9123456780', orderItems: [{ name: 'Dosa' }], grandTotal: 150, billDnaHash: 'PLT-TEST-002' });
      expect(updated2.visits).toBe(6);
      expect(updated2.tier).toBe('GOLD'); // Upgraded!
    });

    it('registers brand new patron as BRONZE with 1 visit', () => {
      const newMember = recordPatronVisit({
        phone: '7777777777',
        name: 'New Patron',
        orderItems: [{ name: 'Chicken Biryani' }],
        grandTotal: 440,
        billDnaHash: 'PLT-NEW-001',
      });
      expect(newMember.tier).toBe('BRONZE');
      expect(newMember.visits).toBe(1);
      expect(newMember.totalSpent).toBe(440);
    });
  });

  describe('Billing Engine Loyalty Discount Integration', () => {
    it('calculates 10% loyalty discount for Gold tier on ₹1000 subtotal', () => {
      const tax = calculateTax(1000, 10);
      expect(tax.loyaltyDiscount).toBe(100);
      expect(tax.taxableAmount).toBe(900);
      expect(tax.sgst).toBe(45);
      expect(tax.cgst).toBe(45);
      expect(tax.grandTotal).toBe(990);
    });

    it('applies 0% discount when no loyalty member is present', () => {
      const tax = calculateTax(1000, 0);
      expect(tax.loyaltyDiscount).toBe(0);
      expect(tax.grandTotal).toBe(1100); // 1000 + 50 + 50
    });

    it('getOrderMetadata integrates Gold patron discount end-to-end', () => {
      const goldPatron = { tier: 'GOLD', name: 'Vikram' };
      const order = { id: 1, items: [{ price: 400, quantity: 2, name: 'Chicken Biryani' }] };
      const meta = getOrderMetadata(order, 'standard', goldPatron);

      // Subtotal: 800, 10% discount: 80, taxable: 720
      expect(meta.subtotal).toBe(800);
      expect(meta.loyaltyDiscount).toBe(80);
      expect(meta.sgst).toBe(36);
      expect(meta.cgst).toBe(36);
      expect(meta.grandTotal).toBe(792);
      expect(meta.loyaltyMember).toBe(goldPatron);
    });
  });
});
