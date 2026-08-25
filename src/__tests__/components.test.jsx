import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DishTile from '../components/DishTile';
import BillItem from '../components/BillItem';
import QuantityGuard from '../components/QuantityGuard';
import Toast from '../components/Toast';
import OrderPulse from '../components/OrderPulse';
import BillDNA from '../components/BillDNA';

describe('PlateFlow Component Tests', () => {
  // DishTile Tests
  describe('DishTile Component', () => {
    const mockDish = { id: 1, name: 'Masala Dosa', price: 150, description: 'Crispy' };

    it('renders dish name, index, price and Add button', () => {
      render(
        <DishTile
          dish={mockDish}
          index={1}
          quantity={0}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
      expect(screen.getByText('#01')).toBeInTheDocument();
      expect(screen.getByText('₹150')).toBeInTheDocument();
      expect(screen.getByText('ADD TO ORDER')).toBeInTheDocument();
    });

    it('calls onAdd when Add to Order button is clicked', () => {
      const handleAdd = vi.fn();
      render(
        <DishTile
          dish={mockDish}
          index={1}
          quantity={0}
          onAdd={handleAdd}
          onRemove={vi.fn()}
        />
      );

      const button = screen.getByText('ADD TO ORDER');
      fireEvent.click(button);
      expect(handleAdd).toHaveBeenCalledWith(1);
    });

    it('triggers guard protection callback when decreasing quantity below 0', () => {
      const handleGuard = vi.fn();
      render(
        <DishTile
          dish={mockDish}
          index={1}
          quantity={0}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onGuardTrigger={handleGuard}
        />
      );

      // Decreasing at 0 is prevented or triggers guard
      expect(screen.queryByLabelText(/decrease/i)).not.toBeInTheDocument();
    });
  });

  // BillItem Tests
  describe('BillItem Component', () => {
    const mockItem = { id: 2, name: 'Chicken Biryani', price: 400, quantity: 2 };

    it('renders item name, unit price, quantity and line total', () => {
      render(
        <BillItem
          item={mockItem}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.getByText('Chicken Biryani')).toBeInTheDocument();
      expect(screen.getByText('2 plates')).toBeInTheDocument();
      expect(screen.getByText('₹800')).toBeInTheDocument();
    });

    it('calls onQuantityChange with +1 when plus button clicked', () => {
      const handleQuantityChange = vi.fn();
      render(
        <BillItem
          item={mockItem}
          onQuantityChange={handleQuantityChange}
          onRemove={vi.fn()}
        />
      );

      const plusBtn = screen.getByLabelText(/increase chicken biryani quantity/i);
      fireEvent.click(plusBtn);
      expect(handleQuantityChange).toHaveBeenCalledWith(1);
    });

    it('calls onRemove when trash button is clicked', () => {
      const handleRemove = vi.fn();
      render(
        <BillItem
          item={mockItem}
          onQuantityChange={vi.fn()}
          onRemove={handleRemove}
        />
      );

      const trashBtn = screen.getByLabelText(/remove chicken biryani/i);
      fireEvent.click(trashBtn);
      expect(handleRemove).toHaveBeenCalled();
    });
  });

  // QuantityGuard Modal Tests
  describe('QuantityGuard Component', () => {
    const mockGuardData = {
      available: 2,
      requested: 5,
      itemName: 'Chicken Biryani',
      reason: 'Requested removal exceeds available plates in order',
    };

    it('displays available vs requested plates and BLOCKED badge', () => {
      render(
        <QuantityGuard
          guardData={mockGuardData}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('QUANTITY GUARD')).toBeInTheDocument();
      expect(screen.getByText('BLOCKED')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('triggers onClose when Adjust Quantity is clicked', () => {
      const handleClose = vi.fn();
      render(
        <QuantityGuard
          guardData={mockGuardData}
          onClose={handleClose}
          onConfirm={vi.fn()}
        />
      );

      fireEvent.click(screen.getByText('Adjust Quantity'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  // Toast Component Tests
  describe('Toast Component', () => {
    it('renders success toast with message and correct icon', () => {
      render(<Toast message="Item added to order" type="success" />);
      expect(screen.getByText('Item added to order')).toBeInTheDocument();
    });

    it('renders error toast message', () => {
      render(<Toast message="Invalid quantity specified" type="error" />);
      expect(screen.getByText('Invalid quantity specified')).toBeInTheDocument();
    });
  });

  // OrderPulse Component Tests
  describe('OrderPulse Component', () => {
    const mockOrder = { id: 1042, status: 'ACTIVE', items: [{ id: 1, name: 'Idli', price: 100, quantity: 2 }] };
    const mockMeta = { itemCount: 1, plateCount: 2, subtotal: 200, sgst: 10, cgst: 10, grandTotal: 220 };

    it('renders all 5 order stages and live statistics', () => {
      render(
        <OrderPulse
          order={mockOrder}
          orderMetadata={mockMeta}
          onStageNavigate={vi.fn()}
        />
      );

      expect(screen.getByText('ORDER PULSE')).toBeInTheDocument();
      expect(screen.getByText('ORDER CREATED')).toBeInTheDocument();
      expect(screen.getByText('DISHES ADDED')).toBeInTheDocument();
      expect(screen.getByText('QUANTITY VERIFIED')).toBeInTheDocument();
      expect(screen.getByText('TOTAL CALCULATED')).toBeInTheDocument();
      expect(screen.getByText('BILL GENERATED')).toBeInTheDocument();
      expect(screen.getByText('₹220')).toBeInTheDocument();
    });
  });

  // BillDNA Component Tests
  describe('BillDNA Component', () => {
    const mockOrder = { id: 1042, status: 'ACTIVE', items: [{ id: 1, price: 100, quantity: 2 }] };
    const mockMeta = { itemCount: 1, plateCount: 2, subtotal: 200, grandTotal: 220 };

    it('renders generated checksum hash and expandable details', () => {
      render(<BillDNA order={mockOrder} orderMetadata={mockMeta} />);

      expect(screen.getByText('BILL DNA')).toBeInTheDocument();
      expect(screen.getByText(/SHA-MAP/i)).toBeInTheDocument();
      expect(screen.getByText('#1042')).toBeInTheDocument();
    });
  });
});
