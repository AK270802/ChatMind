import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useUserStats } from '../../hooks/useUsers';
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

describe('useUsers Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          username: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user' as const,
          subscriptionPlan: 'basic',
          subscriptionStatus: 'active',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: '2',
          email: 'user2@example.com',
          username: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'coach' as const,
          subscriptionPlan: 'premium',
          subscriptionStatus: 'active',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUsers);
      });
    });

    it('should handle error state', async () => {
      const errorMessage = 'Failed to fetch users';
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useUsers(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('useUserStats', () => {
    it('should fetch user stats successfully', async () => {
      const mockStats = {
        totalTrades: 50,
        winRate: 0.65,
        totalProfit: 10000,
        averageProfit: 200,
        averageLoss: -150,
        profitFactor: 1.8,
        sharpeRatio: 1.2,
        maxDrawdown: 0.15,
        currentStreak: 5,
        bestStreak: 10,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStats),
      });

      const { result } = renderHook(() => useUserStats('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockStats);
      });
    });

    it('should not fetch when userId is not provided', async () => {
      const { result } = renderHook(() => useUserStats(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreateUser', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        id: '3',
        email: 'user3@example.com',
        username: 'user3',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'user' as const,
        subscriptionPlan: 'basic',
        subscriptionStatus: 'active',
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const { result } = renderHook(() => useCreateUser(), { wrapper });

      const userData = {
        email: 'user3@example.com',
        username: 'user3',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'user' as const,
        subscriptionPlan: 'basic',
        subscriptionStatus: 'active',
      };

      await act(async () => {
        await result.current.mutateAsync(userData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
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

      const { result } = renderHook(() => useCreateUser(), { wrapper });

      const userData = {
        email: 'user3@example.com',
        username: 'user3',
        role: 'user' as const,
      };

      let error: Error | null = null;
      try {
        await act(async () => {
          await result.current.mutateAsync(userData);
        });
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
    });
  });

  describe('useUpdateUser', () => {
    it('should update user successfully', async () => {
      const mockUpdatedUser = {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as const,
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-04'),
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdatedUser),
      });

      const { result } = renderHook(() => useUpdateUser(), { wrapper });

      const updateData = {
        subscriptionPlan: 'premium',
      };

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: updateData });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }));
    });
  });

  describe('useDeleteUser', () => {
    it('should delete user successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useDeleteUser(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }));
    });
  });
});
