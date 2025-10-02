import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import TradeJournal from '../../pages/trade-journal';

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
      }
    ],
    isLoading: false,
    error: null
  }),
  useCreateTrade: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useUpdateTrade: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useDeleteTrade: () => ({
    mutate: jest.fn(),
    isPending: false
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

describe('TradeJournal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trade journal with trades', () => {
    renderWithProviders(<TradeJournal />);

    expect(screen.getByText('Trade Journal')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('GOOGL')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('displays trade statistics', () => {
    renderWithProviders(<TradeJournal />);

    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('opens add trade modal when button is clicked', () => {
    renderWithProviders(<TradeJournal />);

    const addButton = screen.getByText('Add Trade');
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Trade')).toBeInTheDocument();
    expect(screen.getByLabelText('Symbol')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Entry Price')).toBeInTheDocument();
  });

  it('opens edit trade modal when edit button is clicked', async () => {
    renderWithProviders(<TradeJournal />);

    const editButtons = screen.getAllByLabelText('Edit trade');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Trade')).toBeInTheDocument();
      expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
    });
  });

  it('handles trade deletion confirmation', async () => {
    const mockDeleteTrade = jest.fn();
    
    // Mock the delete trade hook
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
          }
        ],
        isLoading: false,
        error: null
      }),
      useCreateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useUpdateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useDeleteTrade: () => ({
        mutate: mockDeleteTrade,
        isPending: false
      })
    }));

    renderWithProviders(<TradeJournal />);

    const deleteButtons = screen.getAllByLabelText('Delete trade');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete Trade')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this trade?/)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    expect(mockDeleteTrade).toHaveBeenCalledWith('1');
  });

  it('filters trades by symbol', async () => {
    renderWithProviders(<TradeJournal />);

    const searchInput = screen.getByPlaceholderText('Search trades...');
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
    });
  });

  it('filters trades by status', async () => {
    renderWithProviders(<TradeJournal />);

    const statusFilter = screen.getByLabelText('Filter by status');
    fireEvent.change(statusFilter, { target: { value: 'closed' } });

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
    });
  });

  it('sorts trades by date', async () => {
    renderWithProviders(<TradeJournal />);

    const dateHeader = screen.getByText('Entry Date');
    fireEvent.click(dateHeader);

    await waitFor(() => {
      const trades = screen.getAllByText(/2024-01-/);
      expect(trades).toHaveLength(2);
    });
  });

  it('sorts trades by P&L', async () => {
    renderWithProviders(<TradeJournal />);

    const pnlHeader = screen.getByText('P&L');
    fireEvent.click(pnlHeader);

    await waitFor(() => {
      const pnlValues = screen.getAllByText(/\$[\d,]+\.\d{2}/);
      expect(pnlValues).toHaveLength(2);
    });
  });

  it('handles loading state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: true,
        error: null
      }),
      useCreateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useUpdateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useDeleteTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      })
    }));

    renderWithProviders(<TradeJournal />);

    expect(screen.getByText('Loading trades...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: false,
        error: new Error('Failed to fetch trades')
      }),
      useCreateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useUpdateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useDeleteTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      })
    }));

    renderWithProviders(<TradeJournal />);

    expect(screen.getByText('Error loading trades')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch trades')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: false,
        error: null
      }),
      useCreateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useUpdateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useDeleteTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      })
    }));

    renderWithProviders(<TradeJournal />);

    expect(screen.getByText('No trades found')).toBeInTheDocument();
    expect(screen.getByText('Start by adding your first trade')).toBeInTheDocument();
  });

  it('validates trade form inputs', async () => {
    renderWithProviders(<TradeJournal />);

    const addButton = screen.getByText('Add Trade');
    fireEvent.click(addButton);

    const submitButton = screen.getByText('Create Trade');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Symbol is required')).toBeInTheDocument();
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument();
      expect(screen.getByText('Entry price must be greater than 0')).toBeInTheDocument();
    });
  });

  it('handles successful trade creation', async () => {
    const mockCreateTrade = jest.fn();
    
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: false,
        error: null
      }),
      useCreateTrade: () => ({
        mutate: mockCreateTrade,
        isPending: false
      }),
      useUpdateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useDeleteTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      })
    }));

    renderWithProviders(<TradeJournal />);

    const addButton = screen.getByText('Add Trade');
    fireEvent.click(addButton);

    const symbolInput = screen.getByLabelText('Symbol');
    const quantityInput = screen.getByLabelText('Quantity');
    const priceInput = screen.getByLabelText('Entry Price');
    const dateInput = screen.getByLabelText('Entry Date');

    fireEvent.change(symbolInput, { target: { value: 'AAPL' } });
    fireEvent.change(quantityInput, { target: { value: '100' } });
    fireEvent.change(priceInput, { target: { value: '150' } });
    fireEvent.change(dateInput, { target: { value: '2024-01-01' } });

    const submitButton = screen.getByText('Create Trade');
    fireEvent.click(submitButton);

    expect(mockCreateTrade).toHaveBeenCalledWith({
      symbol: 'AAPL',
      type: 'long',
      quantity: 100,
      entryPrice: 150,
      entryDate: '2024-01-01',
      status: 'open'
    });
  });

  it('handles CSV file upload', async () => {
    const mockFile = new File(['test,csv,content'], 'trades.csv', { type: 'text/csv' });
    
    renderWithProviders(<TradeJournal />);

    const uploadButton = screen.getByText('Upload CSV');
    fireEvent.click(uploadButton);

    const fileInput = screen.getByLabelText('Upload CSV file');
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Uploading trades...')).toBeInTheDocument();
    });
  });

  it('exports trades to CSV', async () => {
    renderWithProviders(<TradeJournal />);

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export successful')).toBeInTheDocument();
    });
  });

  it('displays trade details in modal', async () => {
    renderWithProviders(<TradeJournal />);

    const viewButtons = screen.getAllByLabelText('View trade details');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Trade Details')).toBeInTheDocument();
      expect(screen.getByText('Symbol: AAPL')).toBeInTheDocument();
      expect(screen.getByText('Type: Long')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 100')).toBeInTheDocument();
      expect(screen.getByText('Entry Price: $150.00')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    // Mock many trades
    const manyTrades = Array.from({ length: 25 }, (_, i) => ({
      id: `trade${i}`,
      symbol: `SYMBOL${i}`,
      type: i % 2 === 0 ? 'long' : 'short',
      quantity: 100,
      entryPrice: 100 + i,
      entryDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
      pnl: (i % 2 === 0 ? 1 : -1) * (100 + i),
      status: 'closed'
    }));

    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: manyTrades,
        isLoading: false,
        error: null
      }),
      useCreateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useUpdateTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      }),
      useDeleteTrade: () => ({
        mutate: jest.fn(),
        isPending: false
      })
    }));

    renderWithProviders(<TradeJournal />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();

    const nextPageButton = screen.getByText('Next');
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });
  });
});
