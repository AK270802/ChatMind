import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// User interface based on the authentication system
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'coach' | 'admin';
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentStreak: number;
  bestStreak: number;
}

// API functions
const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/users', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const response = await fetch(`/api/users/${userId}/stats`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  return response.json();
};

const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
};

const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
};

const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
};

// React Query hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => fetchUserStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
