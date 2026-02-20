import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PortfolioView } from './PortfolioView';

// Mock the services - using vi.hoisted to get the mock functions
const { mockGetAccountBalances, mockCreateTrustline, mockRemoveTrustline, mockSubmitTransaction } = vi.hoisted(() => ({
  mockGetAccountBalances: vi.fn(),
  mockCreateTrustline: vi.fn(),
  mockRemoveTrustline: vi.fn(),
  mockSubmitTransaction: vi.fn()
}));

const { mockGetConnectedWallet, mockConnectFreighter, mockSignTransaction } = vi.hoisted(() => ({
  mockGetConnectedWallet: vi.fn(),
  mockConnectFreighter: vi.fn(),
  mockSignTransaction: vi.fn()
}));

const { mockGetPrice } = vi.hoisted(() => ({
  mockGetPrice: vi.fn()
}));

vi.mock('../../services/stellarService', () => ({
  default: {
    getAccountBalances: (...args: any[]) => mockGetAccountBalances(...args),
    createTrustline: (...args: any[]) => mockCreateTrustline(...args),
    removeTrustline: (...args: any[]) => mockRemoveTrustline(...args),
    submitTransaction: (...args: any[]) => mockSubmitTransaction(...args)
  }
}));

vi.mock('../../services/walletService', () => ({
  default: {
    getConnectedWallet: (...args: any[]) => mockGetConnectedWallet(...args),
    connectFreighter: (...args: any[]) => mockConnectFreighter(...args),
    signTransaction: (...args: any[]) => mockSignTransaction(...args)
  }
}));

vi.mock('../../services/priceService', () => ({
  default: {
    getPrice: (...args: any[]) => mockGetPrice(...args)
  }
}));

// Mock lucide-react icons - include ALL icons used
vi.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ChevronDown: () => <div data-testid="chevron-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
  TrendingUp: () => <div data-testid="trend-icon" />,
  DollarSign: () => <div data-testid="dollar-icon" />,
  SearchIcon: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Loader: () => <div data-testid="loader-icon" />
}));

// Mock recharts
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />
}));

describe('PortfolioView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Default mock implementations
    mockGetConnectedWallet.mockReturnValue('GC1234567890');
    mockGetAccountBalances.mockResolvedValue([
      { code: 'XLM', issuer: '', balance: '1000' },
      { code: 'USDC', issuer: 'GA1234567890', balance: '500' }
    ]);
    mockGetPrice.mockResolvedValue(0.5);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Asset List Rendering', () => {
    it('should render loading skeleton on initial load', () => {
      render(<PortfolioView />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should render assets after loading', async () => {
      mockGetAccountBalances.mockResolvedValueOnce([
        { code: 'XLM', issuer: '', balance: '1000' }
      ]);
      
      render(<PortfolioView />);
      
      await waitFor(() => {
        // Use getAllByText for multiple elements
        expect(screen.getAllByText('XLM').length).toBeGreaterThan(0);
      });
    });

    it('should display total portfolio value', async () => {
      mockGetAccountBalances.mockResolvedValueOnce([
        { code: 'XLM', issuer: '', balance: '1000' }
      ]);
      
      render(<PortfolioView />);
      
      await waitFor(() => {
        // Total value = 1000 * 0.5 = 500
        expect(screen.getByText(/\$500/)).toBeInTheDocument();
      });
    });
  });

  describe('Trustline Creation Flow', () => {
    it('should open add trustline modal', async () => {
      render(<PortfolioView />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Trustline')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Trustline');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Asset Code')).toBeInTheDocument();
      });
    });
  });

  describe('Trustline Removal Flow', () => {
    it('should not show remove button for XLM', async () => {
      mockGetAccountBalances.mockResolvedValueOnce([
        { code: 'XLM', issuer: '', balance: '1000' }
      ]);
      
      render(<PortfolioView />);
      
      // Wait for the component to load
      await waitFor(() => {
        // Check that there's no trash icon for XLM
        // XLM native assets shouldn't have remove button
        const trashIcons = screen.queryAllByTestId('trash-icon');
        // Should have 0 trash icons for native XLM only
        expect(trashIcons.length).toBe(0);
      });
    });
  });

  describe('Filtering and Sorting', () => {
    it('should change filter', async () => {
      render(<PortfolioView />);
      
      await waitFor(() => {
        expect(screen.getByText('All Assets')).toBeInTheDocument();
      });

      const filterSelect = screen.getByDisplayValue('All Assets');
      fireEvent.change(filterSelect, { target: { value: 'tokens' } });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Tokens')).toBeInTheDocument();
      });
    });

    it('should persist filter preferences in localStorage', async () => {
      render(<PortfolioView />);
      
      await waitFor(() => {
        const filterSelect = screen.getByDisplayValue('All Assets');
        fireEvent.change(filterSelect, { target: { value: 'tokens' } });
      });

      // Check localStorage
      expect(localStorage.getItem('portfolio-filter')).toBe('tokens');
    });
  });

  describe('Chart Rendering', () => {
    it('should render pie chart', async () => {
      mockGetAccountBalances.mockResolvedValueOnce([
        { code: 'XLM', issuer: '', balance: '1000' },
        { code: 'USDC', issuer: 'GA1234567890', balance: '500' }
      ]);
      
      render(<PortfolioView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should toggle between pie and bar chart', async () => {
      render(<PortfolioView />);
      
      await waitFor(() => {
        const barButton = screen.getByText('Balances');
        fireEvent.click(barButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no assets', async () => {
      mockGetAccountBalances.mockResolvedValueOnce([]);
      
      render(<PortfolioView />);
      
      await waitFor(() => {
        expect(screen.getByText('No Assets Found')).toBeInTheDocument();
      });
    });

    it('should show add trustline button in empty state', async () => {
      mockGetAccountBalances.mockResolvedValueOnce([]);
      
      render(<PortfolioView />);
      
      await waitFor(() => {
        expect(screen.getByText('Add Trustline')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh portfolio data', async () => {
      render(<PortfolioView />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      });

      expect(mockGetAccountBalances).toHaveBeenCalled();
    });
  });

  describe('Currency Selection', () => {
    it('should change currency', async () => {
      render(<PortfolioView />);
      
      await waitFor(() => {
        const currencySelect = screen.getByDisplayValue('USD');
        fireEvent.change(currencySelect, { target: { value: 'EUR' } });
      });

      expect(localStorage.getItem('portfolio-currency')).toBe('EUR');
    });
  });
});
