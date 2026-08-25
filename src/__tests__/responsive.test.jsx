import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNav from '../components/MobileNav';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

describe('Multi-Device Responsive UI & Navigation Suite', () => {
  const mockOrder = { id: 1042, status: 'ACTIVE', items: [] };

  it('MobileNav renders all core destinations for small handheld devices', () => {
    const handleNavigate = vi.fn();
    render(<MobileNav currentPage="landing" onNavigate={handleNavigate} />);

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Menu')).toBeDefined();
    expect(screen.getByText('Bill')).toBeDefined();
    expect(screen.getByText('Table')).toBeDefined();
    expect(screen.getByText('Kitchen')).toBeDefined();

    // Clicking a destination on mobile invokes onNavigate
    fireEvent.click(screen.getByText('Menu'));
    expect(handleNavigate).toHaveBeenCalledWith('dishes');
  });

  it('TopBar provides hamburger menu toggle on mobile and tablet screens', () => {
    const handleNavigate = vi.fn();
    render(<TopBar order={mockOrder} currentPage="landing" onNavigate={handleNavigate} />);

    const toggleBtn = screen.getByLabelText('Open navigation menu');
    expect(toggleBtn).toBeDefined();

    // Toggle menu open
    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText('Close navigation menu')).toBeDefined();

    // Drawer displays all primary portal links
    expect(screen.getByText('Dish Explorer')).toBeDefined();
    expect(screen.getByText('Operations Console')).toBeDefined();
    expect(screen.getByText('Tax Receipt')).toBeDefined();
    expect(screen.getByText('Reliability Center')).toBeDefined();

    // Clicking a drawer item navigates and closes drawer
    fireEvent.click(screen.getByText('Dish Explorer'));
    expect(handleNavigate).toHaveBeenCalledWith('dishes');
  });

  it('Sidebar renders complete desktop and laptop navigation hierarchy', () => {
    const handleNavigate = vi.fn();
    render(<Sidebar currentPage="operations" onNavigate={handleNavigate} />);

    // Brand and categories
    expect(screen.getByText('◆ PLATEFLOW')).toBeDefined();
    expect(screen.getByText('Portal & Overview')).toBeDefined();
    expect(screen.getByText('Table & Kitchen')).toBeDefined();
    expect(screen.getByText('Analytics & Reports')).toBeDefined();

    // Core links
    expect(screen.getByText('Operations Console')).toBeDefined();
    expect(screen.getByText('Kitchen Display')).toBeDefined();
    expect(screen.getByText('Order History')).toBeDefined();

    fireEvent.click(screen.getByText('Kitchen Display'));
    expect(handleNavigate).toHaveBeenCalledWith('kitchen');
  });
});
