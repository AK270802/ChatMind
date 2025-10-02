import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { db } from '../db';

// Mock storage
jest.mock('../storage', () => ({
  storage: {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getTrades: jest.fn(),
    createTrade: jest.fn(),
    updateTrade: jest.fn(),
    deleteTrade: jest.fn(),
    getAIAnalysisReport: jest.fn(),
    createAIAnalysisReport: jest.fn(),
    getFeedback: jest.fn(),
    createFeedback: jest.fn(),
    getComplianceRules: jest.fn(),
    createComplianceRule: jest.fn(),
    getSecurityEvents: jest.fn(),
    createSecurityEvent: jest.fn(),
    getAuditLogs: jest.fn(),
    createAuditLog: jest.fn(),
    getBrokerConnections: jest.fn(),
    createBrokerConnection: jest.fn(),
    updateBrokerConnection: jest.fn(),
    deleteBrokerConnection: jest.fn(),
    syncBrokerTrades: jest.fn(),
  },
}));

// Mock auth
jest.mock('../auth', () => ({
  setupAuth: jest.fn((app) => {
    app.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = { id: 'user1', username: 'testuser', role: 'user' };
      next();
    });
  }),
}));

// Mock db
jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('API Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Mock the routes
    const mockRoutes = express.Router();
    mockRoutes.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    
    app.use(mockRoutes);
    
    server = app.listen(0);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user and return user data', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user')
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should handle authentication errors', async () => {
      (storage.getUser as jest.Mock).mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .get('/api/user')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('Trade Management', () => {
    const mockTrade = {
      id: '1',
      symbol: 'AAPL',
      type: 'long',
      quantity: 100,
      entryPrice: 150.00,
      entryDate: '2024-01-01',
      status: 'open',
      userId: 'user1',
      createdAt: new Date().toISOString(),
    };

    describe('GET /api/trades', () => {
      it('should return all trades for user', async () => {
        const mockTrades = [mockTrade];
        (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);

        const response = await request(app)
          .get('/api/trades')
          .expect(200);

        expect(response.body).toEqual(mockTrades);
        expect(storage.getTrades).toHaveBeenCalledWith('user1');
      });

      it('should handle empty trades list', async () => {
        (storage.getTrades as jest.Mock).mockResolvedValue([]);

        const response = await request(app)
          .get('/api/trades')
          .expect(200);

        expect(response.body).toEqual([]);
      });

      it('should handle trades fetch error', async () => {
        (storage.getTrades as jest.Mock).mockRejectedValue(new Error('Failed to fetch trades'));

        const response = await request(app)
          .get('/api/trades')
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to fetch trades');
      });
    });

    describe('POST /api/trades', () => {
      it('should create a new trade', async () => {
        const newTrade = {
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'open',
        };

        (storage.createTrade as jest.Mock).mockResolvedValue(mockTrade);

        const response = await request(app)
          .post('/api/trades')
          .send(newTrade)
          .expect(201);

        expect(response.body).toEqual(mockTrade);
        expect(storage.createTrade).toHaveBeenCalledWith({
          ...newTrade,
          userId: 'user1',
        });
      });

      it('should validate trade data', async () => {
        const invalidTrade = {
          symbol: '',
          type: 'invalid',
          quantity: -1,
          entryPrice: 0,
          entryDate: 'invalid-date',
          status: 'invalid',
        };

        const response = await request(app)
          .post('/api/trades')
          .send(invalidTrade)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle trade creation error', async () => {
        const newTrade = {
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'open',
        };

        (storage.createTrade as jest.Mock).mockRejectedValue(new Error('Failed to create trade'));

        const response = await request(app)
          .post('/api/trades')
          .send(newTrade)
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to create trade');
      });
    });

    describe('PUT /api/trades/:id', () => {
      it('should update an existing trade', async () => {
        const updateData = {
          exitPrice: 160.00,
          exitDate: '2024-01-02',
          status: 'closed',
        };

        const updatedTrade = {
          ...mockTrade,
          ...updateData,
        };

        (storage.updateTrade as jest.Mock).mockResolvedValue(updatedTrade);

        const response = await request(app)
          .put(`/api/trades/${mockTrade.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toEqual(updatedTrade);
        expect(storage.updateTrade).toHaveBeenCalledWith(mockTrade.id, updateData);
      });

      it('should handle trade update error', async () => {
        const updateData = {
          exitPrice: 160.00,
          exitDate: '2024-01-02',
          status: 'closed',
        };

        (storage.updateTrade as jest.Mock).mockRejectedValue(new Error('Failed to update trade'));

        const response = await request(app)
          .put(`/api/trades/${mockTrade.id}`)
          .send(updateData)
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to update trade');
      });
    });

    describe('DELETE /api/trades/:id', () => {
      it('should delete a trade', async () => {
        (storage.deleteTrade as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
          .delete(`/api/trades/${mockTrade.id}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Trade deleted successfully');
        expect(storage.deleteTrade).toHaveBeenCalledWith(mockTrade.id);
      });

      it('should handle trade deletion error', async () => {
        (storage.deleteTrade as jest.Mock).mockRejectedValue(new Error('Failed to delete trade'));

        const response = await request(app)
          .delete(`/api/trades/${mockTrade.id}`)
          .expect(500);

        expect(response.body).toHaveProperty('error', 'Failed to delete trade');
      });
    });
  });

  describe('AI Analysis', () => {
    const mockAnalysis = {
      id: '1',
      userId: 'user1',
      totalTrades: 10,
      winningTrades: 7,
      losingTrades: 3,
      winRate: 70,
      averageWin: 2500,
      averageLoss: 1500,
      profitFactor: 3.89,
      patterns: [
        {
          pattern: 'Morning Breakout',
          frequency: 0.4,
          successRate: 0.8,
          avgReturn: 0.05,
        },
      ],
      recommendations: [
        {
          type: 'strategy',
          title: 'Improve Risk Management',
          description: 'Consider implementing tighter stop-losses',
          priority: 'high',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    describe('GET /api/ai-analysis/:userId', () => {
      it('should return AI analysis for user', async () => {
        (storage.getAIAnalysisReport as jest.Mock).mockResolvedValue(mockAnalysis);

        const response = await request(app)
          .get(`/api/ai-analysis/user1`)
          .expect(200);

        expect(response.body).toEqual(mockAnalysis);
        expect(storage.getAIAnalysisReport).toHaveBeenCalledWith('user1');
      });

      it('should handle analysis not found', async () => {
        (storage.getAIAnalysisReport as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .get(`/api/ai-analysis/user1`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Analysis not found');
      });
    });

    describe('POST /api/ai-analysis/generate', () => {
      it('should generate AI analysis', async () => {
        const generateRequest = {
          userId: 'user1',
          options: {
            includePatterns: true,
            includeRecommendations: true,
          },
        };

        (storage.createAIAnalysisReport as jest.Mock).mockResolvedValue(mockAnalysis);

        const response = await request(app)
          .post('/api/ai-analysis/generate')
          .send(generateRequest)
          .expect(201);

        expect(response.body).toEqual(mockAnalysis);
        expect(storage.createAIAnalysisReport).toHaveBeenCalledWith({
          userId: 'user1',
          ...generateRequest.options,
        });
      });

      it('should validate generation request', async () => {
        const invalidRequest = {
          userId: '',
          options: {},
        };

        const response = await request(app)
          .post('/api/ai-analysis/generate')
          .send(invalidRequest)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Compliance and Security', () => {
    const mockComplianceRule = {
      id: '1',
      name: 'Risk Management Rule',
      description: 'Maximum position size limit',
      type: 'risk_management',
      severity: 'high',
      enabled: true,
      config: {
        maxPositionSize: 100000,
      },
      createdAt: new Date().toISOString(),
    };

    const mockSecurityEvent = {
      id: '1',
      userId: 'user1',
      eventType: 'login_attempt',
      description: 'Failed login attempt',
      severity: 'medium',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    describe('GET /api/compliance/rules', () => {
      it('should return compliance rules', async () => {
        const mockRules = [mockComplianceRule];
        (storage.getComplianceRules as jest.Mock).mockResolvedValue(mockRules);

        const response = await request(app)
          .get('/api/compliance/rules')
          .expect(200);

        expect(response.body).toEqual(mockRules);
      });
    });

    describe('POST /api/compliance/rules', () => {
      it('should create a new compliance rule', async () => {
        const newRule = {
          name: 'New Rule',
          description: 'New compliance rule',
          type: 'data_protection',
          severity: 'medium',
          enabled: true,
          config: {},
        };

        (storage.createComplianceRule as jest.Mock).mockResolvedValue(mockComplianceRule);

        const response = await request(app)
          .post('/api/compliance/rules')
          .send(newRule)
          .expect(201);

        expect(response.body).toEqual(mockComplianceRule);
      });
    });

    describe('GET /api/security/events', () => {
      it('should return security events', async () => {
        const mockEvents = [mockSecurityEvent];
        (storage.getSecurityEvents as jest.Mock).mockResolvedValue(mockEvents);

        const response = await request(app)
          .get('/api/security/events')
          .expect(200);

        expect(response.body).toEqual(mockEvents);
      });
    });

    describe('POST /api/security/events', () => {
      it('should create a new security event', async () => {
        const newEvent = {
          eventType: 'login_attempt',
          description: 'Failed login attempt',
          severity: 'medium',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: {},
        };

        (storage.createSecurityEvent as jest.Mock).mockResolvedValue(mockSecurityEvent);

        const response = await request(app)
          .post('/api/security/events')
          .send(newEvent)
          .expect(201);

        expect(response.body).toEqual(mockSecurityEvent);
      });
    });
  });

  describe('Broker Integration', () => {
    const mockBrokerConnection = {
      id: '1',
      userId: 'user1',
      brokerName: 'zerodha',
      apiKey: 'test_api_key',
      apiSecret: 'test_api_secret',
      isActive: true,
      lastSyncAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    describe('GET /api/brokers', () => {
      it('should return broker connections', async () => {
        const mockConnections = [mockBrokerConnection];
        (storage.getBrokerConnections as jest.Mock).mockResolvedValue(mockConnections);

        const response = await request(app)
          .get('/api/brokers')
          .expect(200);

        expect(response.body).toEqual(mockConnections);
      });
    });

    describe('POST /api/brokers', () => {
      it('should create a new broker connection', async () => {
        const newConnection = {
          brokerName: 'zerodha',
          apiKey: 'test_api_key',
          apiSecret: 'test_api_secret',
        };

        (storage.createBrokerConnection as jest.Mock).mockResolvedValue(mockBrokerConnection);

        const response = await request(app)
          .post('/api/brokers')
          .send(newConnection)
          .expect(201);

        expect(response.body).toEqual(mockBrokerConnection);
      });
    });

    describe('POST /api/brokers/:id/sync', () => {
      it('should sync trades from broker', async () => {
        const mockSyncedTrades = [mockTrade];
        (storage.syncBrokerTrades as jest.Mock).mockResolvedValue(mockSyncedTrades);

        const response = await request(app)
          .post(`/api/brokers/${mockBrokerConnection.id}/sync`)
          .expect(200);

        expect(response.body).toEqual(mockSyncedTrades);
        expect(storage.syncBrokerTrades).toHaveBeenCalledWith(mockBrokerConnection.id);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/trades')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors', async () => {
      (storage.getTrades as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/trades')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('Request Validation', () => {
    it('should validate content-type for POST requests', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate JSON body', async () => {
      const response = await request(app)
        .post('/api/trades')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should include content-type header', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Mock rate limiting middleware
      app.use('/api/rate-limited', (req, res, next) => {
        res.status(429).json({ error: 'Too many requests' });
      });

      const response = await request(app)
        .get('/api/rate-limited')
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Too many requests');
    });
  });

  describe('File Upload', () => {
    it('should handle CSV file upload', async () => {
      const csvContent = `symbol,type,quantity,entryPrice,entryDate,status
AAPL,long,100,150.00,2024-01-01,open
GOOGL,short,50,2500.00,2024-01-02,open`;

      const response = await request(app)
        .post('/api/upload-csv')
        .attach('file', Buffer.from(csvContent), 'trades.csv')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'CSV uploaded successfully');
    });

    it('should validate file type', async () => {
      const response = await request(app)
        .post('/api/upload-csv')
        .attach('file', Buffer.from('invalid content'), 'trades.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Only CSV files are allowed');
    });

    it('should handle file upload errors', async () => {
      const response = await request(app)
        .post('/api/upload-csv')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'No file uploaded');
    });
  });
});
