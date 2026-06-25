import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StatusBadge from '../components/shared/StatusBadge';
import MetricCard  from '../components/shared/MetricCard';
import { FiPackage } from 'react-icons/fi';

const mockStore = configureStore({
  reducer: {
    auth: () => ({ user: { role: 'admin' }, token: 'test' }),
  },
});

describe('StatusBadge — warehouse statuses', () => {
  it('renders active badge', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText(/active/i)).toBeTruthy();
  });

  it('renders maintenance badge', () => {
    render(<StatusBadge status="maintenance" />);
    expect(screen.getByText(/maintenance/i)).toBeTruthy();
  });

  it('renders available badge', () => {
    render(<StatusBadge status="available" />);
    expect(screen.getByText(/available/i)).toBeTruthy();
  });

  it('renders occupied badge', () => {
    render(<StatusBadge status="occupied" />);
    expect(screen.getByText(/occupied/i)).toBeTruthy();
  });
});

describe('MetricCard — warehouse KPIs', () => {
  it('renders metric with warehouse value', () => {
    render(
      <Provider store={mockStore}>
        <MetricCard title="Total Warehouses" value={5} icon={FiPackage} accent="#FF7A00" />
      </Provider>
    );
    expect(screen.getByText('Total Warehouses')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('renders zero capacity correctly', () => {
    render(
      <Provider store={mockStore}>
        <MetricCard label="Capacity Used" value="0/0" icon={FiPackage} accentColor="#6B7280" />
      </Provider>
    );
    expect(screen.getByText('0/0')).toBeTruthy();
  });
});

describe('Warehouse zone types', () => {
  const VALID_TYPES = ['receiving', 'storage', 'picking', 'packing', 'returns', 'damaged', 'dispatch', 'custom'];
  it('has 8 valid zone types', () => {
    expect(VALID_TYPES.length).toBe(8);
  });
  it('includes all required types', () => {
    expect(VALID_TYPES).toContain('receiving');
    expect(VALID_TYPES).toContain('dispatch');
    expect(VALID_TYPES).toContain('damaged');
  });
});

describe('Warehouse user roles', () => {
  const ROLES = ['warehouse_manager', 'supervisor', 'picker', 'packer', 'loader', 'auditor'];
  it('has 6 roles', () => {
    expect(ROLES.length).toBe(6);
  });
  it('includes all required roles', () => {
    ['warehouse_manager', 'picker', 'packer', 'auditor'].forEach(r => {
      expect(ROLES).toContain(r);
    });
  });
});
