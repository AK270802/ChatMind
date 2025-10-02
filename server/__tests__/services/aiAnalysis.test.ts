import { AIAnalysisService } from '../../services/aiAnalysis';
import { InsertTrade, Trade } from '../../shared/schema';

describe('AIAnalysisService', () => {
  let aiAnalysisService: AIAnalysisService;
  let mockStorage: any;

  beforeEach(() => {
    // Mock storage
    mockStorage = {
      getTrades: jest.fn(),
      getAIAnalysisReport: jest.fn(),
      createAIAnalysisReport: jest.fn(),
    };

    aiAnalysisService = new AIAnalysisService(mockStorage);
  });

  describe('Trade Pattern Analysis', () => {
    it('should analyze winning trade patterns', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
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
          userId: 'user1',
          symbol: 'GOOGL',
          type: 'long',
          quantity: 50,
          entryPrice: 2500.00,
          exitPrice: 2600.00,
          entryDate: '2024-01-03',
          exitDate: '2024-01-04',
          pnl: 5000,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const analysis = await aiAnalysisService.analyzeTradePatterns('user1');
      
      expect(analysis).toEqual(
        expect.objectContaining({
          totalTrades: 2,
          winningTrades: 2,
          losingTrades: 0,
          winRate: 100,
          averageWin: 3000,
          averageLoss: 0,
          profitFactor: Infinity,
          patterns: expect.any(Array)
        })
      );

      expect(analysis.patterns).toHaveLength(2);
      expect(analysis.patterns[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'long',
          successRate: 100,
          avgProfit: 1000
        })
      );
    });

    it('should analyze losing trade patterns', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
          symbol: 'AAPL',
          type: 'short',
          quantity: 100,
          entryPrice: 150.00,
          exitPrice: 160.00,
          entryDate: '2024-01-01',
          exitDate: '2024-01-02',
          pnl: -1000,
          status: 'closed'
        },
        {
          id: '2',
          userId: 'user1',
          symbol: 'TSLA',
          type: 'long',
          quantity: 50,
          entryPrice: 800.00,
          exitPrice: 750.00,
          entryDate: '2024-01-03',
          exitDate: '2024-01-04',
          pnl: -2500,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const analysis = await aiAnalysisService.analyzeTradePatterns('user1');
      
      expect(analysis).toEqual(
        expect.objectContaining({
          totalTrades: 2,
          winningTrades: 0,
          losingTrades: 2,
          winRate: 0,
          averageWin: 0,
          averageLoss: -1750,
          profitFactor: 0,
          patterns: expect.any(Array)
        })
      );
    });

    it('should handle empty trade list', async () => {
      mockStorage.getTrades.mockResolvedValue([]);

      const analysis = await aiAnalysisService.analyzeTradePatterns('user1');
      
      expect(analysis).toEqual(
        expect.objectContaining({
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          averageWin: 0,
          averageLoss: 0,
          profitFactor: 0,
          patterns: []
        })
      );
    });
  });

  describe('Risk Analysis', () => {
    it('should calculate risk metrics', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
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
          userId: 'user1',
          symbol: 'GOOGL',
          type: 'long',
          quantity: 50,
          entryPrice: 2500.00,
          exitPrice: 2400.00,
          entryDate: '2024-01-03',
          exitDate: '2024-01-04',
          pnl: -5000,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const riskAnalysis = await aiAnalysisService.analyzeRisk('user1');
      
      expect(riskAnalysis).toEqual(
        expect.objectContaining({
          maxDrawdown: expect.any(Number),
          sharpeRatio: expect.any(Number),
          sortinoRatio: expect.any(Number),
          calmarRatio: expect.any(Number),
          riskMetrics: expect.any(Object)
        })
      );

      expect(riskAnalysis.maxDrawdown).toBeLessThan(0);
      expect(riskAnalysis.riskMetrics).toEqual(
        expect.objectContaining({
          totalRisk: expect.any(Number),
          averageTradeRisk: expect.any(Number),
          riskPerTrade: expect.any(Array)
        })
      );
    });

    it('should handle high-risk trades', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
          symbol: 'AAPL',
          type: 'long',
          quantity: 1000, // High quantity
          entryPrice: 150.00,
          exitPrice: 140.00,
          entryDate: '2024-01-01',
          exitDate: '2024-01-02',
          pnl: -10000, // Large loss
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const riskAnalysis = await aiAnalysisService.analyzeRisk('user1');
      
      expect(riskAnalysis.maxDrawdown).toBe(-10000);
      expect(riskAnalysis.riskMetrics.totalRisk).toBeGreaterThan(0);
    });
  });

  describe('Performance Analysis', () => {
    it('should calculate performance metrics', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
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
          userId: 'user1',
          symbol: 'GOOGL',
          type: 'long',
          quantity: 50,
          entryPrice: 2500.00,
          exitPrice: 2600.00,
          entryDate: '2024-01-03',
          exitDate: '2024-01-04',
          pnl: 5000,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const performance = await aiAnalysisService.analyzePerformance('user1');
      
      expect(performance).toEqual(
        expect.objectContaining({
          totalReturn: 6000,
          totalTrades: 2,
          winningTrades: 2,
          losingTrades: 0,
          winRate: 100,
          averageReturn: 3000,
          bestTrade: 5000,
          worstTrade: 1000,
          monthlyReturns: expect.any(Array),
          yearlyReturns: expect.any(Array)
        })
      );
    });

    it('should calculate monthly returns', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          exitPrice: 160.00,
          entryDate: '2024-01-01',
          exitDate: '2024-01-15',
          pnl: 1000,
          status: 'closed'
        },
        {
          id: '2',
          userId: 'user1',
          symbol: 'GOOGL',
          type: 'long',
          quantity: 50,
          entryPrice: 2500.00,
          exitPrice: 2600.00,
          entryDate: '2024-02-01',
          exitDate: '2024-02-15',
          pnl: 5000,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const performance = await aiAnalysisService.analyzePerformance('user1');
      
      expect(performance.monthlyReturns).toHaveLength(2);
      expect(performance.monthlyReturns[0]).toEqual(
        expect.objectContaining({
          month: '2024-01',
          return: 1000
        })
      );
      expect(performance.monthlyReturns[1]).toEqual(
        expect.objectContaining({
          month: '2024-02',
          return: 5000
        })
      );
    });
  });

  describe('AI Coaching', () => {
    it('should generate coaching recommendations', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          exitPrice: 140.00,
          entryDate: '2024-01-01',
          exitDate: '2024-01-02',
          pnl: -1000,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const coaching = await aiAnalysisService.generateCoaching('user1');
      
      expect(coaching).toEqual(
        expect.objectContaining({
          recommendations: expect.any(Array),
          strengths: expect.any(Array),
          weaknesses: expect.any(Array),
          actionItems: expect.any(Array),
          priority: expect.any(String)
        })
      );

      expect(coaching.recommendations.length).toBeGreaterThan(0);
      expect(coaching.weaknesses.length).toBeGreaterThan(0);
      expect(coaching.actionItems.length).toBeGreaterThan(0);
    });

    it('should identify trading strengths', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
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
          userId: 'user1',
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 155.00,
          exitPrice: 165.00,
          entryDate: '2024-01-03',
          exitDate: '2024-01-04',
          pnl: 1000,
          status: 'closed'
        }
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const coaching = await aiAnalysisService.generateCoaching('user1');
      
      expect(coaching.strengths).toContain(
        expect.stringContaining('AAPL')
      );
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive analysis report', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
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
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const report = await aiAnalysisService.generateReport('user1');
      
      expect(report).toEqual(
        expect.objectContaining({
          userId: 'user1',
          generatedAt: expect.any(Date),
          tradeAnalysis: expect.any(Object),
          riskAnalysis: expect.any(Object),
          performanceAnalysis: expect.any(Object),
          coaching: expect.any(Object),
          summary: expect.any(Object)
        })
      );

      expect(report.summary).toEqual(
        expect.objectContaining({
          totalTrades: 1,
          totalReturn: 1000,
          winRate: 100,
          riskLevel: expect.any(String),
          recommendationsCount: expect.any(Number)
        })
      );
    });

    it('should save report to storage', async () => {
      const mockTrades: Trade[] = [
        {
          id: '1',
          userId: 'user1',
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
      ];

      mockStorage.getTrades.mockResolvedValue(mockTrades);
      mockStorage.createAIAnalysisReport.mockResolvedValue({ id: 'report1' });

      const report = await aiAnalysisService.generateAndSaveReport('user1');
      
      expect(mockStorage.createAIAnalysisReport).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          reportData: expect.any(Object)
        })
      );
    });
  });
});
