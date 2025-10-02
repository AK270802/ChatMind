import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Analysis from '../../pages/analysis';

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
        },
        {
          pattern: 'Afternoon Reversal',
          frequency: 0.3,
          successRate: 0.6,
          avgReturn: 0.03
        }
      ],
      recommendations: [
        {
          type: 'strategy',
          title: 'Improve Risk Management',
          description: 'Consider implementing tighter stop-losses to reduce average loss',
          priority: 'high'
        },
        {
          type: 'pattern',
          title: 'Focus on Morning Breakout',
          description: 'Morning breakout pattern shows 80% success rate',
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

describe('Analysis Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders analysis page with key metrics', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('66.67%')).toBeInTheDocument();
    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('displays trade patterns analysis', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Trade Patterns')).toBeInTheDocument();
    expect(screen.getByText('Morning Breakout')).toBeInTheDocument();
    expect(screen.getByText('Afternoon Reversal')).toBeInTheDocument();
    expect(screen.getByText('80% success rate')).toBeInTheDocument();
    expect(screen.getByText('60% success rate')).toBeInTheDocument();
  });

  it('displays AI recommendations', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Improve Risk Management')).toBeInTheDocument();
    expect(screen.getByText('Focus on Morning Breakout')).toBeInTheDocument();
    expect(screen.getByText('Consider implementing tighter stop-losses')).toBeInTheDocument();
  });

  it('displays performance charts', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Performance Charts')).toBeInTheDocument();
    expect(screen.getByText('Monthly Returns')).toBeInTheDocument();
    expect(screen.getByText('Risk vs Reward')).toBeInTheDocument();
    expect(screen.getByText('Drawdown Analysis')).toBeInTheDocument();
  });

  it('generates AI analysis report', async () => {
    const mockGenerateAnalysis = jest.fn();
    
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
          patterns: [],
          recommendations: []
        },
        isLoading: false,
        error: null
      }),
      useGenerateAIAnalysis: () => ({
        mutate: mockGenerateAnalysis,
        isPending: false
      })
    }));

    renderWithProviders(<Analysis />);

    const generateButton = screen.getByText('Generate AI Analysis');
    fireEvent.click(generateButton);

    expect(mockGenerateAnalysis).toHaveBeenCalled();
  });

  it('handles analysis generation loading state', () => {
    jest.mock('../../hooks/useAIAnalysis', () => ({
      useAIAnalysis: () => ({
        data: null,
        isLoading: true,
        error: null
      }),
      useGenerateAIAnalysis: () => ({
        mutate: jest.fn(),
        isPending: true
      })
    }));

    renderWithProviders(<Analysis />);

    expect(screen.getByText('Generating AI analysis...')).toBeInTheDocument();
  });

  it('handles analysis generation error state', () => {
    jest.mock('../../hooks/useAIAnalysis', () => ({
      useAIAnalysis: () => ({
        data: null,
        isLoading: false,
        error: new Error('Failed to generate analysis')
      }),
      useGenerateAIAnalysis: () => ({
        mutate: jest.fn(),
        isPending: false
      })
    }));

    renderWithProviders(<Analysis />);

    expect(screen.getByText('Error generating analysis')).toBeInTheDocument();
    expect(screen.getByText('Failed to generate analysis')).toBeInTheDocument();
  });

  it('filters analysis by date range', async () => {
    renderWithProviders(<Analysis />);

    const dateFilter = screen.getByLabelText('Filter by date range');
    fireEvent.change(dateFilter, { target: { value: 'last30days' } });

    await waitFor(() => {
      expect(screen.getByText('Analysis')).toBeInTheDocument();
    });
  });

  it('filters analysis by symbol', async () => {
    renderWithProviders(<Analysis />);

    const symbolFilter = screen.getByLabelText('Filter by symbol');
    fireEvent.change(symbolFilter, { target: { value: 'AAPL' } });

    await waitFor(() => {
      expect(screen.getByText('Analysis')).toBeInTheDocument();
    });
  });

  it('exports analysis report', async () => {
    renderWithProviders(<Analysis />);

    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export successful')).toBeInTheDocument();
    });
  });

  it('displays detailed trade statistics', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Trade Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Winning Trades')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Losing Trades')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays risk metrics', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Risk Metrics')).toBeInTheDocument();
    expect(screen.getByText('Average Win')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('Average Loss')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
  });

  it('displays monthly performance', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Monthly Performance')).toBeInTheDocument();
    expect(screen.getByText('January 2024')).toBeInTheDocument();
    expect(screen.getByText('February 2024')).toBeInTheDocument();
  });

  it('handles chart interactions', async () => {
    renderWithProviders(<Analysis />);

    const chartElements = screen.getAllByRole('img');
    expect(chartElements.length).toBeGreaterThan(0);

    // Simulate hover interaction
    const chart = chartElements[0];
    fireEvent.mouseEnter(chart);

    await waitFor(() => {
      expect(chart).toBeInTheDocument();
    });
  });

  it('switches between analysis tabs', async () => {
    renderWithProviders(<Analysis />);

    const patternsTab = screen.getByText('Patterns');
    const recommendationsTab = screen.getByText('Recommendations');
    const chartsTab = screen.getByText('Charts');

    fireEvent.click(patternsTab);
    await waitFor(() => {
      expect(screen.getByText('Trade Patterns')).toBeInTheDocument();
    });

    fireEvent.click(recommendationsTab);
    await waitFor(() => {
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    });

    fireEvent.click(chartsTab);
    await waitFor(() => {
      expect(screen.getByText('Performance Charts')).toBeInTheDocument();
    });
  });

  it('displays pattern details', async () => {
    renderWithProviders(<Analysis />);

    const viewDetailsButton = screen.getAllByLabelText('View pattern details')[0];
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Pattern Details')).toBeInTheDocument();
      expect(screen.getByText('Morning Breakout')).toBeInTheDocument();
      expect(screen.getByText('40% frequency')).toBeInTheDocument();
    });
  });

  it('handles recommendation actions', async () => {
    renderWithProviders(<Analysis />);

    const actionButton = screen.getAllByLabelText('Take action on recommendation')[0];
    fireEvent.click(actionButton);

    await waitFor(() => {
      expect(screen.getByText('Recommendation Actions')).toBeInTheDocument();
      expect(screen.getByText('Improve Risk Management')).toBeInTheDocument();
    });
  });

  it('displays comparative analysis', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
    expect(screen.getByText('vs Previous Period')).toBeInTheDocument();
    expect(screen.getByText('vs Benchmark')).toBeInTheDocument();
  });

  it('handles time period comparison', async () => {
    renderWithProviders(<Analysis />);

    const comparisonSelect = screen.getByLabelText('Compare with period');
    fireEvent.change(comparisonSelect, { target: { value: 'previousMonth' } });

    await waitFor(() => {
      expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
    });
  });

  it('displays trade distribution', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Trade Distribution')).toBeInTheDocument();
    expect(screen.getByText('By Symbol')).toBeInTheDocument();
    expect(screen.getByText('By Type')).toBeInTheDocument();
    expect(screen.getByText('By Time Period')).toBeInTheDocument();
  });

  it('handles distribution view changes', async () => {
    renderWithProviders(<Analysis />);

    const symbolView = screen.getByText('By Symbol');
    const typeView = screen.getByText('By Type');
    const timeView = screen.getByText('By Time Period');

    fireEvent.click(symbolView);
    await waitFor(() => {
      expect(screen.getByText('Trade Distribution')).toBeInTheDocument();
    });

    fireEvent.click(typeView);
    await waitFor(() => {
      expect(screen.getByText('Trade Distribution')).toBeInTheDocument();
    });

    fireEvent.click(timeView);
    await waitFor(() => {
      expect(screen.getByText('Trade Distribution')).toBeInTheDocument();
    });
  });

  it('displays correlation analysis', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Correlation Analysis')).toBeInTheDocument();
    expect(screen.getByText('Symbol Correlation')).toBeInTheDocument();
    expect(screen.getByText('Time Correlation')).toBeInTheDocument();
  });

  it('handles correlation matrix interactions', async () => {
    renderWithProviders(<Analysis />);

    const correlationMatrix = screen.getByText('Symbol Correlation');
    fireEvent.click(correlationMatrix);

    await waitFor(() => {
      expect(screen.getByText('Correlation Matrix')).toBeInTheDocument();
    });
  });

  it('displays backtesting results', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Backtesting Results')).toBeInTheDocument();
    expect(screen.getByText('Strategy Performance')).toBeInTheDocument();
    expect(screen.getByText('Risk Metrics')).toBeInTheDocument();
  });

  it('handles backtesting parameters', async () => {
    renderWithProviders(<Analysis />);

    const parametersButton = screen.getByText('Adjust Parameters');
    fireEvent.click(parametersButton);

    await waitFor(() => {
      expect(screen.getByText('Backtesting Parameters')).toBeInTheDocument();
      expect(screen.getByLabelText('Initial Capital')).toBeInTheDocument();
      expect(screen.getByLabelText('Risk Per Trade')).toBeInTheDocument();
    });
  });

  it('displays optimization suggestions', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Optimization Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Entry Timing')).toBeInTheDocument();
    expect(screen.getByText('Position Sizing')).toBeInTheDocument();
    expect(screen.getByText('Exit Strategy')).toBeInTheDocument();
  });

  it('handles optimization implementation', async () => {
    renderWithProviders(<Analysis />);

    const implementButton = screen.getAllByLabelText('Implement optimization')[0];
    fireEvent.click(implementButton);

    await waitFor(() => {
      expect(screen.getByText('Optimization Implementation')).toBeInTheDocument();
    });
  });

  it('displays sentiment analysis', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument();
    expect(screen.getByText('Market Sentiment')).toBeInTheDocument();
    expect(screen.getByText('Trading Sentiment')).toBeInTheDocument();
  });

  it('handles sentiment filters', async () => {
    renderWithProviders(<Analysis />);

    const sentimentFilter = screen.getByLabelText('Filter by sentiment');
    fireEvent.change(sentimentFilter, { target: { value: 'bullish' } });

    await waitFor(() => {
      expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument();
    });
  });

  it('displays predictive analytics', () => {
    renderWithProviders(<Analysis />);

    expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
    expect(screen.getByText('Next Trade Prediction')).toBeInTheDocument();
    expect(screen.getByText('Market Forecast')).toBeInTheDocument();
  });

  it('handles prediction confidence levels', async () => {
    renderWithProviders(<Analysis />);

    const confidenceSlider = screen.getByLabelText('Adjust confidence level');
    fireEvent.change(confidenceSlider, { target: { value: '80' } });

    await waitFor(() => {
      expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
    });
  });

  it('exports analysis in different formats', async () => {
    renderWithProviders(<Analysis />);

    const exportDropdown = screen.getByLabelText('Export options');
    fireEvent.click(exportDropdown);

    await waitFor(() => {
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as JSON')).toBeInTheDocument();
    });
  });

  it('handles responsive layout', () => {
    renderWithProviders(<Analysis />);

    const container = screen.getByText('Analysis').closest('div');
    expect(container).toHaveClass('container mx-auto');

    // Check for responsive grid layout
    const grid = screen.getByText('Performance Metrics').closest('div');
    expect(grid).toHaveClass('grid');
  });

  it('displays loading states for charts', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: true,
        error: null
      })
    }));

    renderWithProviders(<Analysis />);

    expect(screen.getByText('Loading charts...')).toBeInTheDocument();
  });

  it('handles empty analysis state', () => {
    jest.mock('../../hooks/useTrades', () => ({
      useTrades: () => ({
        data: [],
        isLoading: false,
        error: null
      })
    }));

    renderWithProviders(<Analysis />);

    expect(screen.getByText('No trades to analyze')).toBeInTheDocument();
    expect(screen.getByText('Add some trades to see detailed analysis')).toBeInTheDocument();
  });
});
