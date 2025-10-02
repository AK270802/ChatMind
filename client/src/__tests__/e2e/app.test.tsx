import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../../App';

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

jest.mock('../../hooks/useAIAnalysis', () => ({
  useAIAnalysis: () => ({
    data: {
      totalTrades: 2,
      winningTrades: 2,
      losingTrades: 0,
      winRate: 100,
      averageWin: 3000,
      averageLoss: 0,
      profitFactor: Infinity,
      patterns: [
        {
          pattern: 'Morning Breakout',
          frequency: 0.5,
          successRate: 1.0,
          avgReturn: 0.06
        }
      ],
      recommendations: [
        {
          type: 'strategy',
          title: 'Continue Current Strategy',
          description: 'Your current strategy is performing well',
          priority: 'medium'
        }
      ]
    },
    isLoading: false,
    error: null
  }),
  useGenerateAIAnalysis: () => ({
    mutate: jest.fn(),
    isPending: false
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

describe('App End-to-End Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Navigation', () => {
    it('should render the app with navigation', () => {
      renderWithProviders(<App />);

      expect(screen.getByText('ChatMind')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
    });

    it('should navigate between pages', async () => {
      renderWithProviders(<App />);

      // Navigate to Dashboard
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Navigate to Trade Journal
      const tradeJournalLink = screen.getByText('Trade Journal');
      fireEvent.click(tradeJournalLink);
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Navigate to Analysis
      const analysisLink = screen.getByText('Analysis');
      fireEvent.click(analysisLink);
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });
    });

    it('should maintain navigation state', async () => {
      renderWithProviders(<App />);

      // Navigate to Trade Journal
      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Add a trade
      fireEvent.click(screen.getByText('Add Trade'));
      await waitFor(() => {
        expect(screen.getByText('Add New Trade')).toBeInTheDocument();
      });

      // Close modal
      fireEvent.click(screen.getByText('Cancel'));
      await waitFor(() => {
        expect(screen.queryByText('Add New Trade')).not.toBeInTheDocument();
      });

      // Should still be on Trade Journal page
      expect(screen.getByText('Trade Journal')).toBeInTheDocument();
    });
  });

  describe('Dashboard Flow', () => {
    it('should display dashboard with key metrics', async () => {
      renderWithProviders(<App />);

      // Navigate to Dashboard
      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Check key metrics
      expect(screen.getByText('Total P&L')).toBeInTheDocument();
      expect(screen.getByText('$6,000.00')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Total Trades')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display recent trades table', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Recent Trades')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    });

    it('should display performance charts', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('P&L Over Time')).toBeInTheDocument();
      expect(screen.getByText('Win/Loss Distribution')).toBeInTheDocument();
      expect(screen.getByText('Performance by Symbol')).toBeInTheDocument();
    });

    it('should handle trade interactions from dashboard', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // View trade details
      const viewButtons = screen.getAllByLabelText('View trade details');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Trade Details')).toBeInTheDocument();
        expect(screen.getByText('Symbol: AAPL')).toBeInTheDocument();
      });

      // Close modal
      fireEvent.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Trade Details')).not.toBeInTheDocument();
      });
    });

    it('should export dashboard data', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export successful')).toBeInTheDocument();
      });
    });
  });

  describe('Trade Journal Flow', () => {
    it('should display trade journal with trades', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    });

    it('should add a new trade', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Open add trade modal
      fireEvent.click(screen.getByText('Add Trade'));
      await waitFor(() => {
        expect(screen.getByText('Add New Trade')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'MSFT' } });
      fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '75' } });
      fireEvent.change(screen.getByLabelText('Entry Price'), { target: { value: '300' } });
      fireEvent.change(screen.getByLabelText('Entry Date'), { target: { value: '2024-01-05' } });

      // Submit form
      fireEvent.click(screen.getByText('Create Trade'));
      await waitFor(() => {
        expect(screen.queryByText('Add New Trade')).not.toBeInTheDocument();
      });
    });

    it('should edit an existing trade', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Open edit trade modal
      const editButtons = screen.getAllByLabelText('Edit trade');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Trade')).toBeInTheDocument();
        expect(screen.getByDisplayValue('AAPL')).toBeInTheDocument();
      });

      // Update form
      fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'AAPL_UPDATED' } });

      // Submit form
      fireEvent.click(screen.getByText('Update Trade'));
      await waitFor(() => {
        expect(screen.queryByText('Edit Trade')).not.toBeInTheDocument();
      });
    });

    it('should delete a trade', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Open delete confirmation
      const deleteButtons = screen.getAllByLabelText('Delete trade');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Trade')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete this trade?/)).toBeInTheDocument();
      });

      // Confirm deletion
      fireEvent.click(screen.getByText('Delete'));
      await waitFor(() => {
        expect(screen.queryByText('Delete Trade')).not.toBeInTheDocument();
      });
    });

    it('should filter trades', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Filter by symbol
      const searchInput = screen.getByPlaceholderText('Search trades...');
      fireEvent.change(searchInput, { target: { value: 'AAPL' } });

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.queryByText('GOOGL')).not.toBeInTheDocument();
      });

      // Clear filter
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('GOOGL')).toBeInTheDocument();
      });
    });

    it('should sort trades', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Sort by P&L
      const pnlHeader = screen.getByText('P&L');
      fireEvent.click(pnlHeader);

      await waitFor(() => {
        const pnlValues = screen.getAllByText(/\$[\d,]+\.\d{2}/);
        expect(pnlValues).toHaveLength(2);
      });
    });

    it('should handle CSV upload', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload CSV');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Upload CSV file')).toBeInTheDocument();
      });
    });

    it('should export trades to CSV', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export successful')).toBeInTheDocument();
      });
    });
  });

  describe('Analysis Flow', () => {
    it('should display analysis page with metrics', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });

      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Profit Factor')).toBeInTheDocument();
      expect(screen.getByText('Infinity')).toBeInTheDocument();
    });

    it('should display trade patterns', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });

      expect(screen.getByText('Trade Patterns')).toBeInTheDocument();
      expect(screen.getByText('Morning Breakout')).toBeInTheDocument();
      expect(screen.getByText('100% success rate')).toBeInTheDocument();
    });

    it('should display AI recommendations', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });

      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Continue Current Strategy')).toBeInTheDocument();
      expect(screen.getByText('Your current strategy is performing well')).toBeInTheDocument();
    });

    it('should generate AI analysis', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });

      const generateButton = screen.getByText('Generate AI Analysis');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generating AI analysis...')).toBeInTheDocument();
      });
    });

    it('should switch between analysis tabs', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });

      // Switch to Patterns tab
      fireEvent.click(screen.getByText('Patterns'));
      await waitFor(() => {
        expect(screen.getByText('Trade Patterns')).toBeInTheDocument();
      });

      // Switch to Recommendations tab
      fireEvent.click(screen.getByText('Recommendations'));
      await waitFor(() => {
        expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      });

      // Switch to Charts tab
      fireEvent.click(screen.getByText('Charts'));
      await waitFor(() => {
        expect(screen.getByText('Performance Charts')).toBeInTheDocument();
      });
    });

    it('should export analysis report', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Analysis')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export successful')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Page Interactions', () => {
    it('should maintain data consistency across pages', async () => {
      renderWithProviders(<App />);

      // Check Dashboard
      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Total Trades')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      // Check Trade Journal
      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getAllByText(/AAPL|GOOGL/)).toHaveLength(2);
      });

      // Check Analysis
      fireEvent.click(screen.getByText('Analysis'));
      await waitFor(() => {
        expect(screen.getByText('Total Trades')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should handle navigation during operations', async () => {
      renderWithProviders(<App />);

      // Start adding a trade
      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Trade'));
      await waitFor(() => {
        expect(screen.getByText('Add New Trade')).toBeInTheDocument();
      });

      // Navigate away during operation
      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Modal should be closed
      expect(screen.queryByText('Add New Trade')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle loading states', async () => {
      // Mock loading state
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

      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Loading trades...')).toBeInTheDocument();
      });
    });

    it('should handle error states', async () => {
      // Mock error state
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

      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Error loading trades')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch trades')).toBeInTheDocument();
      });
    });

    it('should handle empty states', async () => {
      // Mock empty state
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

      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('No trades found')).toBeInTheDocument();
        expect(screen.getByText('Start by adding your first trade')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should display mobile navigation', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<App />);

      expect(screen.getByText('ChatMind')).toBeInTheDocument();
      // Mobile menu button should be visible
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    it('should handle desktop navigation', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<App />);

      expect(screen.getByText('ChatMind')).toBeInTheDocument();
      // Desktop navigation should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithProviders(<App />);

      fireEvent.click(screen.getByText('Trade Journal'));
      await waitFor(() => {
        expect(screen.getByText('Trade Journal')).toBeInTheDocument();
      });

      // Check for ARIA labels
      const editButtons = screen.getAllByLabelText('Edit trade');
      const deleteButtons = screen.getAllByLabelText('Delete trade');
      const viewButtons = screen.getAllByLabelText('View trade details');

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(<App />);

      // Test keyboard navigation
      const dashboardLink = screen.getByText('Dashboard');
      dashboardLink.focus();
      fireEvent.keyDown(dashboardLink, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render quickly', async () => {
      const startTime = performance.now();
      renderWithProviders(<App />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeTrades = Array.from({ length: 100 }, (_, i) => ({
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
          data: largeTrades,
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

      const startTime = performance.now();
      renderWithProviders(<App />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should handle large dataset within 2 seconds
    });
  });
});
