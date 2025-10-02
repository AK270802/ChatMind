import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAIAnalysis, useGenerateAIAnalysis } from '../../hooks/useAIAnalysis';
import React from 'react';

// Mock the API
jest.mock('../../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const api = require('../../api').api;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAIAnalysis Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAIAnalysis', () => {
    it('should fetch AI analysis successfully', async () => {
      const mockAnalysis = {
        insights: ['Test insight'],
        recommendations: ['Test recommendation'],
        metrics: {
          totalTrades: 10,
          winRate: 0.6,
          averageProfit: 100,
          averageLoss: -50,
          profitFactor: 2.0,
          sharpeRatio: 1.5,
          maxDrawdown: 0.1,
        },
      };

      api.post.mockResolvedValue({ data: mockAnalysis });

      const { result } = renderHook(() => useAIAnalysis(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockAnalysis);
      });
    });

    it('should handle error state', async () => {
      const errorMessage = 'Failed to fetch analysis';
      api.post.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAIAnalysis(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        if (result.current.error) {
          expect(result.current.error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('useGenerateAIAnalysis', () => {
    it('should generate AI analysis successfully', async () => {
      const mockAnalysis = {
        insights: ['Generated insight'],
        recommendations: ['Generated recommendation'],
        metrics: {
          totalTrades: 5,
          winRate: 0.8,
          averageProfit: 150,
          averageLoss: -30,
          profitFactor: 2.5,
          sharpeRatio: 2.0,
          maxDrawdown: 0.05,
        },
      };

      api.post.mockResolvedValue({ data: mockAnalysis });

      const { result } = renderHook(() => useGenerateAIAnalysis(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(api.post).toHaveBeenCalledWith('/api/analysis/generate');
    });

    it('should handle mutation error', async () => {
      const errorMessage = 'Generation failed';
      api.post.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useGenerateAIAnalysis(), { wrapper });

      let error: Error | null = null;
      try {
        await act(async () => {
          await result.current.mutateAsync();
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error?.message).toBe(errorMessage);
    });
  });
});
