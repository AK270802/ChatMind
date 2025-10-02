import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes';
import { storage } from '../../storage';

// Mock storage
jest.mock('../../storage', () => ({
  storage: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getTrades: jest.fn(),
    createTrade: jest.fn(),
    updateTrade: jest.fn(),
    deleteTrade: jest.fn(),
    getFeedback: jest.fn(),
    createFeedback: jest.fn(),
    getAIAnalysisReport: jest.fn(),
    createAIAnalysisReport: jest.fn(),
  },
}));

// Mock auth
jest.mock('../../auth', () => ({
  setupAuth: jest.fn((app) => {
    app.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = { id: 'user1', username: 'testuser', role: 'user' };
      next();
    });
  }),
}));

describe('Main API Routes', () => {
  let app: express.Application;
  let server: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    server = registerRoutes(app);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
    jest.clearAllMocks();
  });

  describe('GET /api/user', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user')
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should return 404 if user not found', async () => {
      (storage.getUser as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/trades', () => {
    it('should return user trades', async () => {
      const mockTrades = [
        {
          id: 'trade1',
          userId: 'user1',
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        }
      ];

      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);

      const response = await request(app)
        .get('/api/trades')
        .expect(200);

      expect(response.body).toEqual(mockTrades);
    });

    it('should return empty array for no trades', async () => {
      (storage.getTrades as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/trades')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/trades', () => {
    it('should create a new trade', async () => {
      const tradeData = {
        symbol: 'AAPL',
        type: 'long',
        quantity: 100,
        entryPrice: 150.00,
        entryDate: '2024-01-01',
        status: 'open'
      };

      const createdTrade = {
        id: 'trade1',
        userId: 'user1',
        ...tradeData
      };

      (storage.createTrade as jest.Mock).mockResolvedValue(createdTrade);

      const response = await request(app)
        .post('/api/trades')
        .send(tradeData)
        .expect(201);

      expect(response.body).toEqual(createdTrade);
      expect(storage.createTrade).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          ...tradeData
        })
      );
    });

    it('should return 400 for invalid trade data', async () => {
      const invalidTradeData = {
        symbol: '',
        type: 'invalid',
        quantity: -100,
        entryPrice: -150.00
      };

      const response = await request(app)
        .post('/api/trades')
        .send(invalidTradeData)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });
  });

  describe('PUT /api/trades/:id', () => {
    it('should update a trade', async () => {
      const tradeId = 'trade1';
      const updateData = {
        exitPrice: 160.00,
        exitDate: '2024-01-02',
        status: 'closed'
      };

      const updatedTrade = {
        id: tradeId,
        userId: 'user1',
        symbol: 'AAPL',
        type: 'long',
        quantity: 100,
        entryPrice: 150.00,
        entryDate: '2024-01-01',
        ...updateData
      };

      (storage.updateTrade as jest.Mock).mockResolvedValue(updatedTrade);

      const response = await request(app)
        .put(`/api/trades/${tradeId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedTrade);
      expect(storage.updateTrade).toHaveBeenCalledWith(tradeId, updateData);
    });

    it('should return 404 if trade not found', async () => {
      const tradeId = 'nonexistent';

      (storage.updateTrade as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/trades/${tradeId}`)
        .send({ exitPrice: 160.00 })
        .expect(404);

      expect(response.body.message).toBe('Trade not found');
    });
  });

  describe('DELETE /api/trades/:id', () => {
    it('should delete a trade', async () => {
      const tradeId = 'trade1';

      (storage.deleteTrade as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/trades/${tradeId}`)
        .expect(200);

      expect(response.body.message).toBe('Trade deleted successfully');
      expect(storage.deleteTrade).toHaveBeenCalledWith(tradeId);
    });

    it('should return 404 if trade not found', async () => {
      const tradeId = 'nonexistent';

      (storage.deleteTrade as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/trades/${tradeId}`)
        .expect(404);

      expect(response.body.message).toBe('Trade not found');
    });
  });

  describe('POST /api/trades/upload', () => {
    it('should upload and parse CSV file', async () => {
      const csvContent = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price
2024-01-01,AAPL,NSE,EQUITY,Buy,100,150.00
2024-01-02,AAPL,NSE,EQUITY,Sell,100,160.00`;

      const parsedTrades = [
        {
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        },
        {
          symbol: 'AAPL',
          type: 'short',
          quantity: 100,
          entryPrice: 160.00,
          entryDate: '2024-01-02',
          status: 'closed'
        }
      ];

      const createdTrades = parsedTrades.map((trade, index) => ({
        id: `trade${index + 1}`,
        userId: 'user1',
        ...trade
      }));

      // Mock the CSV parsing and trade creation
      jest.doMock('../../services/csvParser', () => ({
        parseCSVTrades: jest.fn().mockResolvedValue(parsedTrades),
      }));

      (storage.createTrade as jest.Mock)
        .mockResolvedValueOnce(createdTrades[0])
        .mockResolvedValueOnce(createdTrades[1]);

      const response = await request(app)
        .post('/api/trades/upload')
        .attach('file', Buffer.from(csvContent), 'trades.csv')
        .field('brokerType', 'zerodha')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Trades uploaded successfully',
        trades: createdTrades,
        total: 2
      });
    });

    it('should return 400 for invalid file type', async () => {
      const response = await request(app)
        .post('/api/trades/upload')
        .attach('file', Buffer.from('invalid content'), 'trades.txt')
        .expect(400);

      expect(response.body.message).toContain('Only CSV and Excel files are allowed');
    });

    it('should return 400 for missing broker type', async () => {
      const csvContent = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price
2024-01-01,AAPL,NSE,EQUITY,Buy,100,150.00`;

      const response = await request(app)
        .post('/api/trades/upload')
        .attach('file', Buffer.from(csvContent), 'trades.csv')
        .expect(400);

      expect(response.body.message).toContain('Broker type is required');
    });
  });

  describe('GET /api/analysis/generate', () => {
    it('should generate AI analysis', async () => {
      const mockTrades = [
        {
          id: 'trade1',
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

      const mockAnalysis = {
        id: 'analysis1',
        userId: 'user1',
        reportData: {
          tradeAnalysis: {
            totalTrades: 1,
            winningTrades: 1,
            losingTrades: 0,
            winRate: 100
          },
          riskAnalysis: {
            maxDrawdown: 0,
            sharpeRatio: 1.5
          },
          performanceAnalysis: {
            totalReturn: 1000,
            averageReturn: 1000
          }
        }
      };

      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);
      (storage.createAIAnalysisReport as jest.Mock).mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .get('/api/analysis/generate')
        .expect(200);

      expect(response.body).toEqual(mockAnalysis);
      expect(storage.createAIAnalysisReport).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          reportData: expect.any(Object)
        })
      );
    });

    it('should return 500 if analysis generation fails', async () => {
      (storage.getTrades as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/analysis/generate')
        .expect(500);

      expect(response.body.message).toBe('Error generating analysis');
    });
  });

  describe('GET /api/analysis/template', () => {
    it('should return CSV template', async () => {
      const response = await request(app)
        .get('/api/analysis/template')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toBe('attachment; filename="trade_template.csv"');
      expect(response.text).toContain('Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price');
    });
  });

  describe('GET /api/feedback', () => {
    it('should return user feedback', async () => {
      const mockFeedback = [
        {
          id: 'feedback1',
          coachId: 'coach1',
          studentId: 'user1',
          rating: 5,
          comment: 'Great coaching!',
          createdAt: '2024-01-01'
        }
      ];

      (storage.getFeedback as jest.Mock).mockResolvedValue(mockFeedback);

      const response = await request(app)
        .get('/api/feedback')
        .expect(200);

      expect(response.body).toEqual(mockFeedback);
    });
  });

  describe('POST /api/feedback', () => {
    it('should create new feedback', async () => {
      const feedbackData = {
        coachId: 'coach1',
        rating: 5,
        comment: 'Excellent coaching!'
      };

      const createdFeedback = {
        id: 'feedback1',
        studentId: 'user1',
        ...feedbackData,
        createdAt: '2024-01-01'
      };

      (storage.createFeedback as jest.Mock).mockResolvedValue(createdFeedback);

      const response = await request(app)
        .post('/api/feedback')
        .send(feedbackData)
        .expect(201);

      expect(response.body).toEqual(createdFeedback);
      expect(storage.createFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'user1',
          ...feedbackData
        })
      );
    });

    it('should return 400 for invalid feedback data', async () => {
      const invalidFeedback = {
        coachId: '',
        rating: 6, // Invalid rating
        comment: ''
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(invalidFeedback)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });
  });
});
