import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/dashboard';

// Mock the API calls
jest.mock('../../hooks/useTrades', () => ({
  useTrades: () => ({
    data: [
      {
        id: '1',
        symbol: 'AAPL',
        type: 'long',
        quantity: 100,
        entryPrice: 150.00,
        exitPrice: 160.00,
        entryDate: '2024-01-01',
        exitDate: '2024-01-02',
        pnl: 1000,
        status: 'closed'
      },
      {
        id: '2',
        symbol: 'GOOGL',
        type: 'short',
        quantity: 50,
        entryPrice: 2500.00,
        exitPrice: 2400.00,
        entryDate: '2024-01-03',
        exitDate: '2024-01-04',
        pnl: 5000,
        status: 'closed'
      },
      {
        id: '3',
        symbol: 'MSFT',
        type: 'long',
        quantity: 75,
        entryPrice: 300.00,
        exitPrice: 280.00,
        entryDate: '2024-01-05',
        exitDate: '2024-01-06',
        pnl: -1500,
        status: 'closed'
      }
    ],
    isLoading: false,
    error: null
  })
}));

jest.mock('../../hooks/useAIAnalysis', () => ({
  useAIAnalysis: () => ({
    data: {
      totalTrades: 3,
      winningTrades: 2,
      losingTrades: 1,
      winRate: 66.67,
      averageWin: 3000,
      averageLoss: 1500,
      profitFactor: 4.0,
      patterns: [
        {
          pattern: 'Morning Breakout',
          frequency: 0.4,
          successRate: 0.8,
          avgReturn: 0.05
        }
      ]
    },
    isLoading: false,
    error: null
  })
}));

jest.mock('../../hooks/useUsers', () => ({
  useUserStats: () => ({
    data: {
      totalUsers: 150,
      activeUsers: 45,
      newUsersThisMonth: 12
    },
    isLoading: false,
    error: null
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with key metrics', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total P&L')).toBeInTheDocument();
    expect(screen.getByText('$4,500.00')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('66.67%')).toBeInTheDocument();
    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays recent trades table', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Recent Trades')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('-$1,500.00')).toBeInTheDocument();
  });

  it('displays performance charts', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('P&L Over Time')).toBeInTheDocument();
    expect(screen.getByText('Win/Loss Distribution')).toBeInTheDocument();
    expect(screen.getByText('Performance by Symbol')).toBeInTheDocument();
  });

  it('filters recent trades by date range', async () => {
    renderWithProviders(<Dashboard />);

    const dateFilter = screen.getByLabelText('Filter by date range');
    fireEvent.change(dateFilter, { target: { value: 'last7days' } });

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  it('sorts recent trades by P&L', async () => {
    renderWithProviders(<Dashboard />);

    const pnlHeader = screen.getByText('P&L');
    fireEvent.click(pnlHeader);

    await waitFor(() => {
      const pnlValues = screen.getAllByText(/\$[\d,]+\.\d{2}/);
      expect(pnlValues).toHaveLength(3);
    });
  });

  it('handles loading state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: true,
        error: null
      })
    }));

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: false,
        error: new Error('Failed to load dashboard data')
      })
    }));

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
    expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: false,
        error: null
      })
    }));

    renderWithProviders(<Dashboard />);

    expect(screen.getByText('No trades found')).toBeInTheDocument();
    expect(screen.getByText('Start by adding your first trade')).toBeInTheDocument();
  });

  it('displays AI analysis insights', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Morning Breakout')).toBeInTheDocument();
    expect(screen.getByText('80% success rate')).toBeInTheDocument();
  });

  it('shows user statistics', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('User Statistics')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('handles chart interactions', async () => {
    renderWithProviders(<Dashboard />);

    const chartElements = screen.getAllByRole('img');
    expect(chartElements.length).toBeGreaterThan(0);

    // Simulate hover interaction
    const chart = chartElements[0];
    fireEvent.mouseEnter(chart);

    await waitFor(() => {
      expect(chart).toBeInTheDocument();
    });
  });

  it('exports dashboard data', async () => {
    renderWithProviders(<Dashboard />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export successful')).toBeInTheDocument();
    });
  });

  it('refreshes dashboard data', async () => {
    renderWithProviders(<Dashboard />);

    const refreshButton = screen.getByLabelText('Refresh dashboard');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('displays trade details modal', async () => {
    renderWithProviders(<Dashboard />);

    const viewButtons = screen.getAllByLabelText('View trade details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Trade Details')).toBeInTheDocument();
      expect(screen.getByText('Symbol: AAPL')).toBeInTheDocument();
      expect(screen.getByText('Type: Long')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 100')).toBeInTheDocument();
    });
  });

  it('handles responsive layout', () => {
    renderWithProviders(<Dashboard />);

    const container = screen.getByText('Dashboard').closest('div');
    expect(container).toHaveClass('container mx-auto');

    // Check for responsive grid layout
    const grid = screen.getByText('Recent Trades').closest('div');
    expect(grid).toHaveClass('grid');
  });

  it('calculates correct metrics', () => {
    renderWithProviders(<Dashboard />);

    // Total P&L: 1000 + 5000 - 1500 = 4500
    expect(screen.getByText('$4,500.00')).toBeInTheDocument();
    
    // Win Rate: 2 wins out of 3 trades = 66.67%
    expect(screen.getByText('66.67%')).toBeInTheDocument();
    
    // Total Trades: 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays risk metrics', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Average Win')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('Average Loss')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('handles time period selection', async () => {
    renderWithProviders(<Dashboard />);

    const timePeriodSelect = screen.getByLabelText('Select time period');
    fireEvent.change(timePeriodSelect, { target: { value: 'last30days' } });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('displays performance trends', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
  });

  it('handles chart type switching', async () => {
    renderWithProviders(<Dashboard />);

    const chartTypeButton = screen.getByLabelText('Switch chart type');
    fireEvent.click(chartTypeButton);

    await waitFor(() => {
      expect(screen.getByText('P&L Over Time')).toBeInTheDocument();
    });
  });

  it('displays trading statistics', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Trading Statistics')).toBeInTheDocument();
    expect(screen.getByText('Best Trade')).toBeInTheDocument();
    expect(screen.getByText('Worst Trade')).toBeInTheDocument();
    expect(screen.getByText('Avg. Trade Duration')).toBeInTheDocument();
  });

  it('handles data export options', async () => {
    renderWithProviders(<Dashboard />);

    const exportDropdown = screen.getByLabelText('Export options');
    fireEvent.click(exportDropdown);

    await waitFor(() => {
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as JSON')).toBeInTheDocument();
    });
  });

  it('displays market overview', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Market Overview')).toBeInTheDocument();
    expect(screen.getByText('S&P 500')).toBeInTheDocument();
    expect(screen.getByText('NASDAQ')).toBeInTheDocument();
    expect(screen.getByText('DOW JONES')).toBeInTheDocument();
  });

  it('handles real-time updates', async () => {
    renderWithProviders(<Dashboard />);

    // Simulate real-time update
    const updateButton = screen.getByLabelText('Toggle real-time updates');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('Live updates enabled')).toBeInTheDocument();
    });
  });

  it('displays user preferences', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Compact View')).toBeInTheDocument();
    expect(screen.getByText('Show Charts')).toBeInTheDocument();
  });

  it('handles preference changes', async () => {
    renderWithProviders(<Dashboard />);

    const darkModeToggle = screen.getByLabelText('Toggle dark mode');
    fireEvent.click(darkModeToggle);

    await waitFor(() => {
      expect(screen.getByText('Dark mode enabled')).toBeInTheDocument();
    });
  });
});
