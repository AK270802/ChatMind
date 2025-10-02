import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrades, useCreateTrade, useUpdateTrade, useDeleteTrade } from '../../hooks/useTrades';
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

describe('useTrades Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTrades', () => {
    it('should fetch trades successfully', async () => {
      const mockTrades = [
        {
          id: '1',
          userId: 'user1',
          symbol: 'AAPL',
          type: 'long' as const,
          quantity: 100,
          entryPrice: 150.00,
          entryDate: new Date('2023-01-01'),
          status: 'open' as const,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: '2',
          userId: 'user1',
          symbol: 'GOOGL',
          type: 'short' as const,
          quantity: 50,
          entryPrice: 2500.00,
          exitPrice: 2400.00,
          entryDate: new Date('2023-01-02'),
          exitDate: new Date('2023-01-03'),
          status: 'closed' as const,
          pnl: 5000.00,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-03'),
        },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTrades),
      });

      const { result } = renderHook(() => useTrades(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTrades);
      });
    });

    it('should handle error state', async () => {
      const errorMessage = 'Failed to fetch trades';
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useTrades(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useCreateTrade', () => {
    it('should create trade successfully', async () => {
      const mockTrade = {
        id: '3',
        userId: 'user1',
        symbol: 'TSLA',
        type: 'long' as const,
        quantity: 200,
        entryPrice: 800.00,
        entryDate: new Date('2023-01-04'),
        status: 'open' as const,
        createdAt: new Date('2023-01-04'),
        updatedAt: new Date('2023-01-04'),
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTrade),
      });

      const { result } = renderHook(() => useCreateTrade(), { wrapper });

      const tradeData = {
        symbol: 'TSLA',
        type: 'long' as const,
        quantity: 200,
        entryPrice: 800.00,
        entryDate: new Date('2023-01-04'),
        status: 'open' as const,
      };

      await act(async () => {
        await result.current.mutateAsync(tradeData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/trades', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }));
    });

    it('should handle creation error', async () => {
      const errorMessage = 'Creation failed';
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useCreateTrade(), { wrapper });

      const tradeData = {
        symbol: 'TSLA',
        type: 'long' as const,
        quantity: 200,
        entryPrice: 800.00,
        entryDate: new Date('2023-01-04'),
        status: 'open' as const,
      };

      let error: Error | null = null;
      try {
        await act(async () => {
          await result.current.mutateAsync(tradeData);
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
    });
  });

  describe('useUpdateTrade', () => {
    it('should update trade successfully', async () => {
      const mockUpdatedTrade = {
        id: '1',
        userId: 'user1',
        symbol: 'AAPL',
        type: 'long' as const,
        quantity: 100,
        entryPrice: 150.00,
        exitPrice: 160.00,
        entryDate: new Date('2023-01-01'),
        exitDate: new Date('2023-01-05'),
        status: 'closed' as const,
        pnl: 1000.00,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-05'),
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedTrade),
      });

      const { result } = renderHook(() => useUpdateTrade(), { wrapper });

      const updateData = {
        exitPrice: 160.00,
        exitDate: new Date('2023-01-05'),
        status: 'closed' as const,
        pnl: 1000.00,
      };

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: updateData });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/trades/1', expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }));
    });
  });

  describe('useDeleteTrade', () => {
    it('should delete trade successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useDeleteTrade(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/trades/1', expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }));
    });
  });
});
