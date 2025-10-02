import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// AI Analysis interfaces
export interface AIAnalysis {
  insights: string[];
  recommendations: string[];
  metrics: {
    totalTrades: number;
    winRate: number;
    averageProfit: number;
    averageLoss: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export interface AnalysisReport {
  id: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
  insights: string[];
  recommendations: string[];
  metrics: AIAnalysis['metrics'];
  createdAt: Date;
}

// API functions
const generateAIAnalysis = async (): Promise<AIAnalysis> => {
  const response = await fetch('/api/analysis/generate', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to generate AI analysis');
  }
  return response.json();
};

const fetchAnalysisReports = async (): Promise<AnalysisReport[]> => {
  const response = await fetch('/api/analysis/reports', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch analysis reports');
  }
  return response.json();
};

// React Query hooks
export const useAIAnalysis = () => {
  return useQuery({
    queryKey: ['aiAnalysis'],
    queryFn: generateAIAnalysis,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

export const useGenerateAIAnalysis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: generateAIAnalysis,
    onSuccess: (data) => {
      queryClient.setQueryData(['aiAnalysis'], data);
      queryClient.invalidateQueries({ queryKey: ['analysisReports'] });
    },
  });
};

export const useAnalysisReports = () => {
  return useQuery({
    queryKey: ['analysisReports'],
    queryFn: fetchAnalysisReports,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
