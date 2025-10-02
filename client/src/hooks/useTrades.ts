import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// Trade interface based on the server routes
export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryDate: Date;
  exitDate?: Date;
  status: 'open' | 'closed';
  pnl?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API functions
const fetchTrades = async (page = 1, limit = 50): Promise<Trade[]> => {
  const response = await fetch(`/api/trades?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch trades');
  }
  return response.json();
};

const createTrade = async (tradeData: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Trade> => {
  const response = await fetch('/api/trades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(tradeData),
  });
  if (!response.ok) {
    throw new Error('Failed to create trade');
  }
  return response.json();
};

const updateTrade = async (id: string, tradeData: Partial<Trade>): Promise<Trade> => {
  const response = await fetch(`/api/trades/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(tradeData),
  });
  if (!response.ok) {
    throw new Error('Failed to update trade');
  }
  return response.json();
};

const deleteTrade = async (id: string): Promise<void> => {
  const response = await fetch(`/api/trades/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete trade');
  }
};

// React Query hooks
export const useTrades = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['trades', page, limit],
    queryFn: () => fetchTrades(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

export const useUpdateTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Trade> }) => 
      updateTrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

export const useDeleteTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};
