import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { generateUpiUrl, generateQrSvg, RESTAURANT_UPI_VPA } from '../utils/upiQrGenerator';
import BillSplitterModal from '../components/BillSplitterModal';

describe('Feature 1: Multi-Payer Bill Splitter & Dynamic UPI QR Engine', () => {
  const mockOrder = {
    id: 8842,
    items: [
      { id: 1, name: 'Chicken Biryani', price: 400, quantity: 2 }, // 800
      { id: 2, name: 'Dosa', price: 100, quantity: 2 },           // 200
    ],
  };

  const mockMetadata = {
    subtotal: 1000,
    sgst: 50,
    cgst: 50,
    grandTotal: 1100,
    plateCount: 4,
  };

  describe('UPI URL & QR Matrix Generator', () => {
    it('generateUpiUrl produces valid NPCI formatted UPI deep link', () => {
      const url = generateUpiUrl({
        vpa: 'plateflow@icici',
        name: 'PlateFlow Restaurant',
        amount: 550,
        orderId: 8842,
        tableNo: 'Table 04',
        payerName: 'Rohan',
      });

      expect(url).toContain('upi://pay?');
      expect(url).toContain('pa=plateflow@icici');
      expect(url).toContain('am=550.00');
      expect(url).toContain('cu=INR');
      expect(url).toContain('Rohan');
    });

    it('generateQrSvg generates high-contrast SVG with finder patterns', () => {
      const upiString = 'upi://pay?pa=plateflow@icici&am=250.00&cu=INR';
      const result = generateQrSvg(upiString, 160);

      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('viewBox="0 0 160 160"');
      expect(result.svg).toContain('<rect');
      expect(result.matrix.length).toBe(25);
    });
  });

  describe('BillSplitterModal Component Tests', () => {
    it('renders equal split by default with correct per-payer share', () => {
      render(
        <BillSplitterModal
          isOpen={true}
          onClose={() => {}}
          order={mockOrder}
          orderMetadata={mockMetadata}
          tableNo="Table 04"
        />
      );

      expect(screen.getByText('Multi-Payer Bill Splitter')).toBeDefined();
      expect(screen.getByText('Split Equally')).toBeDefined();
      expect(screen.getByText('Split by Dishes')).toBeDefined();

      // Total 1100 split 2 ways = 550 per person
      const shares = screen.getAllByText('₹550');
      expect(shares.length).toBeGreaterThan(0);
    });

    it('allows increasing diner count to 3 and recalculates equal shares', () => {
      render(
        <BillSplitterModal
          isOpen={true}
          onClose={() => {}}
          order={mockOrder}
          orderMetadata={mockMetadata}
          tableNo="Table 04"
        />
      );

      const plusBtn = screen.getByText('+');
      fireEvent.click(plusBtn); // 3 diners

      expect(screen.getByText('3')).toBeDefined();
      // 1100 / 3 = 367, 367, 366 (or similar integer partition)
      expect(screen.getAllByText(/₹36[67]/).length).toBeGreaterThan(0);
    });

    it('supports switching to Split by Dishes mode and assigning items', () => {
      render(
        <BillSplitterModal
          isOpen={true}
          onClose={() => {}}
          order={mockOrder}
          orderMetadata={mockMetadata}
          tableNo="Table 04"
        />
      );

      const splitByDishesBtn = screen.getByText('Split by Dishes');
      fireEvent.click(splitByDishesBtn);

      expect(screen.getByText(/Assign Dishes to Diners/)).toBeDefined();
      expect(screen.getByText('Chicken Biryani')).toBeDefined();
      expect(screen.getByText('Dosa')).toBeDefined();
    });

    it('toggles payer payment status and updates table settlement progress bar', () => {
      render(
        <BillSplitterModal
          isOpen={true}
          onClose={() => {}}
          order={mockOrder}
          orderMetadata={mockMetadata}
          tableNo="Table 04"
        />
      );

      const markPaidBtn = screen.getByText('Mark as Paid');
      fireEvent.click(markPaidBtn);

      // Payer 1 marked as paid -> 50% settled (₹550 / ₹1100)
      expect(screen.getByText(/50%/)).toBeDefined();
      expect(screen.getByText(/Paid in Full/)).toBeDefined();
    });

    it('calls onSettleAll when all payers are settled', () => {
      const handleSettleAll = vi.fn();
      render(
        <BillSplitterModal
          isOpen={true}
          onClose={() => {}}
          order={mockOrder}
          orderMetadata={mockMetadata}
          tableNo="Table 04"
          onSettleAll={handleSettleAll}
        />
      );

      // Mark Payer 1 as Paid
      const markPaidBtn1 = screen.getByText('Mark as Paid');
      fireEvent.click(markPaidBtn1);

      // Switch to Payer 2 tab
      const payer2Tab = screen.getByText('Payer 2');
      fireEvent.click(payer2Tab);

      // Mark Payer 2 as Paid
      const markPaidBtn2 = screen.getByText('Mark as Paid');
      fireEvent.click(markPaidBtn2);

      // Progress reaches 100%
      expect(screen.getByText(/100%/)).toBeDefined();

      // Complete button appears
      const completeBtn = screen.getByText(/Complete & Print Bill/);
      expect(completeBtn).toBeDefined();

      fireEvent.click(completeBtn);
      expect(handleSettleAll).toHaveBeenCalled();
    });
  });
});
