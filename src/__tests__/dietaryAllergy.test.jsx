import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  filterDishesByDietary,
  checkDietaryConflict,
  getDishDietaryInfo,
  DIETARY_PROFILES,
  ALLERGEN_TYPES,
} from '../utils/dietaryAllergyEngine';
import DietaryConflictModal from '../components/DietaryConflictModal';

describe('Subgraph 1: Dynamic Allergy Guard & Dietary Filters Suite', () => {
  const sampleDishes = [
    { id: 1, name: 'Idli', category: 'food', price: 100 },
    { id: 2, name: 'Chicken Biryani', category: 'food', price: 400 },
    { id: 3, name: 'Paneer Butter Masala', category: 'food', price: 320 },
    { id: 4, name: 'Dosa', category: 'food', price: 120 },
    { id: 5, name: 'Kumbakonam Filter Coffee', category: 'hot-drinks', price: 60 },
  ];

  describe('Dietary Filter Engine', () => {
    it('filters Vegan dishes correctly (100% plant-based)', () => {
      const vegan = filterDishesByDietary(sampleDishes, 'vegan');
      expect(vegan.map((d) => d.name)).toContain('Idli');
      expect(vegan.map((d) => d.name)).not.toContain('Chicken Biryani');
      expect(vegan.map((d) => d.name)).not.toContain('Paneer Butter Masala');
    });

    it('filters Pure Veg dishes (no meat/poultry)', () => {
      const veg = filterDishesByDietary(sampleDishes, 'veg');
      expect(veg.map((d) => d.name)).toContain('Idli');
      expect(veg.map((d) => d.name)).toContain('Dosa');
      expect(veg.map((d) => d.name)).toContain('Paneer Butter Masala');
      expect(veg.map((d) => d.name)).not.toContain('Chicken Biryani');
    });

    it('filters Jain Satvik dishes (no onion/garlic)', () => {
      const jain = filterDishesByDietary(sampleDishes, 'jain');
      expect(jain.map((d) => d.name)).toContain('Idli');
      expect(jain.map((d) => d.name)).toContain('Dosa');
      expect(jain.map((d) => d.name)).not.toContain('Chicken Biryani');
      expect(jain.map((d) => d.name)).not.toContain('Paneer Butter Masala'); // Contains onion-garlic gravy
    });

    it('filters Nut-Free dishes (safe for nut allergies)', () => {
      const nutFree = filterDishesByDietary(sampleDishes, 'nut_free');
      expect(nutFree.map((d) => d.name)).toContain('Idli');
      expect(nutFree.map((d) => d.name)).toContain('Dosa');
      expect(nutFree.map((d) => d.name)).not.toContain('Paneer Butter Masala'); // Contains cashew paste
    });
  });

  describe('Allergy Guard Conflict Protection', () => {
    it('flags non-veg dish when Table Allergy Guard is set to Jain', () => {
      const conflict = checkDietaryConflict('Chicken Biryani', 'jain');
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.reason).toContain('NOT Jain compliant');
    });

    it('flags dairy-containing dish when Table Allergy Guard is set to Vegan', () => {
      const conflict = checkDietaryConflict('Paneer Butter Masala', 'vegan');
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.reason).toContain('NOT Vegan');
    });

    it('flags cashew paste dish when Table Allergy Guard is set to Nut-Free', () => {
      const conflict = checkDietaryConflict('Paneer Butter Masala', 'nut_free');
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.reason).toContain('Tree Nuts or Cashew Paste');
    });

    it('passes compliant dish with 0 conflict under Jain / Vegan profile', () => {
      const conflict = checkDietaryConflict('Idli', 'jain');
      expect(conflict.hasConflict).toBe(false);
      expect(conflict.reason).toBeNull();
    });
  });

  describe('DietaryConflictModal Component', () => {
    it('renders warning banner, allergen pills, and override buttons', () => {
      const handleOverride = vi.fn();
      const handleClose = vi.fn();

      render(
        <DietaryConflictModal
          isOpen={true}
          onClose={handleClose}
          dishName="Paneer Butter Masala"
          conflictReason="Contains Cashew Nut paste."
          activeProfileLabel="Nut Allergy"
          onConfirmOverride={handleOverride}
        />
      );

      expect(screen.getByText('Dietary & Allergen Conflict')).toBeDefined();
      expect(screen.getByText('Nut Allergy')).toBeDefined();
      expect(screen.getByText('Contains Cashew Nut paste.')).toBeDefined();

      // Cancel button
      const cancelBtn = screen.getByText('Cancel & Keep Safe');
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalled();

      // Override button
      const overrideBtn = screen.getByText('Add to Order Anyway');
      fireEvent.click(overrideBtn);
      expect(handleOverride).toHaveBeenCalled();
    });
  });
});
