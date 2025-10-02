import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes';
import { storage } from '../../storage';
import { complianceService } from '../../services/compliance';

// Mock all dependencies
jest.mock('../../storage', () => ({
  storage: {
    // User operations
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    getUsers: jest.fn(),
    
    // Trade operations
    getTrades: jest.fn(),
    createTrade: jest.fn(),
    updateTrade: jest.fn(),
    deleteTrade: jest.fn(),
    
    // Feedback operations
    getFeedback: jest.fn(),
    createFeedback: jest.fn(),
    
    // AI Analysis operations
    getAIAnalysisReport: jest.fn(),
    createAIAnalysisReport: jest.fn(),
    
    // Broker operations
    getBrokerConnections: jest.fn(),
    getBrokerConnection: jest.fn(),
    createBrokerConnection: jest.fn(),
    updateBrokerConnection: jest.fn(),
    deleteBrokerConnection: jest.fn(),
    getBrokerTrades: jest.fn(),
    createBrokerTrade: jest.fn(),
    syncBrokerTrades: jest.fn(),
    
    // Compliance operations
    getSecurityEvents: jest.fn(),
    getAuditLogs: jest.fn(),
    createSecurityEvent: jest.fn(),
    createAuditLog: jest.fn(),
    createComplianceReport: jest.fn(),
  },
}));

// Mock compliance service
jest.mock('../../services/compliance', () => ({
  complianceService: {
    runComplianceCheck: jest.fn(),
    getComplianceRules: jest.fn(),
    enableRule: jest.fn(),
    disableRule: jest.fn(),
    getRule: jest.fn(),
    generateComplianceReport: jest.fn(),
    getRecentSecurityEvents: jest.fn(),
    getAuditLogs: jest.fn(),
    logSecurityEvent: jest.fn(),
    logAuditEvent: jest.fn(),
    securityMiddleware: jest.fn((req, res, next) => next()),
  },
}));

// Mock auth
jest.mock('../../auth', () => ({
  setupAuth: jest.fn((app) => {
    app.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = { id: 'user1', username: 'testuser', role: 'user', email: 'test@example.com' };
      next();
    });
  }),
}));

// Mock AI analysis service
jest.mock('../../services/aiAnalysis', () => ({
  generateAIAnalysis: jest.fn(),
}));

// Mock CSV parser service
jest.mock('../../services/csvParser', () => ({
  parseCSVTrades: jest.fn(),
  generateCSVTemplate: jest.fn(),
}));

describe('Application Integration Tests', () => {
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

  describe('User Flow Integration', () => {
    it('should handle complete user flow from login to trade analysis', async () => {
      // Mock user data
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      // Mock trade data
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
        },
        {
          id: 'trade2',
          userId: 'user1',
          symbol: 'GOOGL',
          type: 'short',
          quantity: 50,
          entryPrice: 2500.00,
          exitPrice: 2400.00,
          entryDate: '2024-01-03',
          exitDate: '2024-01-04',
          pnl: 5000,
          status: 'closed'
        }
      ];

      // Mock AI analysis
      const mockAnalysis = {
        id: 'analysis1',
        userId: 'user1',
        reportData: {
          tradeAnalysis: {
            totalTrades: 2,
            winningTrades: 2,
            losingTrades: 0,
            winRate: 100,
            averageReturn: 3000
          },
          riskAnalysis: {
            maxDrawdown: 0,
            sharpeRatio: 2.5
          },
          performanceAnalysis: {
            totalReturn: 6000,
            monthlyReturns: [
              { month: '2024-01', return: 6000 }
            ]
          }
        }
      };

      // Set up mocks
      (storage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);
      (storage.createAIAnalysisReport as jest.Mock).mockResolvedValue(mockAnalysis);

      // Test user flow
      // 1. Get user profile
      const userResponse = await request(app)
        .get('/api/user')
        .expect(200);

      expect(userResponse.body).toEqual(mockUser);

      // 2. Get user trades
      const tradesResponse = await request(app)
        .get('/api/trades')
        .expect(200);

      expect(tradesResponse.body).toEqual(mockTrades);

      // 3. Generate AI analysis
      const analysisResponse = await request(app)
        .get('/api/analysis/generate')
        .expect(200);

      expect(analysisResponse.body).toEqual(mockAnalysis);

      // 4. Verify all services were called correctly
      expect(storage.getUser).toHaveBeenCalledWith('user1');
      expect(storage.getTrades).toHaveBeenCalledWith('user1');
      expect(storage.createAIAnalysisReport).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          reportData: expect.any(Object)
        })
      );
    });

    it('should handle trade creation and compliance checking', async () => {
      // Mock compliance check
      const mockComplianceResult = {
        score: 95,
        passed: true,
        violations: [],
        rules: []
      };

      // Mock created trade
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

      // Set up mocks
      (storage.createTrade as jest.Mock).mockResolvedValue(createdTrade);
      (complianceService.runComplianceCheck as jest.Mock).mockResolvedValue(mockComplianceResult);

      // Create trade
      const response = await request(app)
        .post('/api/trades')
        .send(tradeData)
        .expect(201);

      expect(response.body).toEqual(createdTrade);

      // Verify compliance was checked
      expect(complianceService.runComplianceCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          trades: expect.arrayContaining([createdTrade])
        })
      );
    });

    it('should handle CSV upload and broker integration', async () => {
      // Mock broker connection
      const mockConnection = {
        id: 'conn1',
        userId: 'user1',
        name: 'Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'connected',
        isActive: true
      };

      // Mock parsed trades
      const parsedTrades = [
        {
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        }
      ];

      const createdTrades = parsedTrades.map((trade, index) => ({
        id: `trade${index + 1}`,
        userId: 'user1',
        ...trade
      }));

      // Set up mocks
      (storage.getBrokerConnections as jest.Mock).mockResolvedValue([mockConnection]);
      (storage.createTrade as jest.Mock)
        .mockResolvedValueOnce(createdTrades[0]);

      // Import CSV trades
      const csvContent = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price
2024-01-01,AAPL,NSE,EQUITY,Buy,100,150.00`;

      const response = await request(app)
        .post('/api/trades/upload')
        .attach('file', Buffer.from(csvContent), 'trades.csv')
        .field('brokerType', 'zerodha')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Trades uploaded successfully',
        trades: createdTrades,
        total: 1
      });

      // Verify broker integration
      expect(storage.getBrokerConnections).toHaveBeenCalledWith('user1');
      expect(storage.createTrade).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          symbol: 'AAPL'
        })
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      (storage.getTrades as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/trades')
        .expect(500);

      expect(response.body.message).toBe('Error fetching trades');
    });

    it('should handle validation errors consistently', async () => {
      const invalidTrade = {
        symbol: '',
        type: 'invalid',
        quantity: -100,
        entryPrice: -150.00
      };

      const response = await request(app)
        .post('/api/trades')
        .send(invalidTrade)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });

    it('should handle authentication errors', async () => {
      // Mock authentication failure
      const mockAuth = require('../../auth');
      mockAuth.setupAuth.mockImplementationOnce((app) => {
        app.use((req, res, next) => {
          req.isAuthenticated = () => false;
          next();
        });
      });

      // Recreate app with new auth mock
      if (server) {
        server.close();
      }
      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      server = registerRoutes(app);

      const response = await request(app)
        .get('/api/trades')
        .expect(401);

      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('Security Integration', () => {
    it('should apply security middleware to all API routes', async () => {
      // Mock security middleware to check if it's called
      let securityMiddlewareCalled = false;
      (complianceService.securityMiddleware as jest.Mock).mockImplementationOnce((req, res, next) => {
        securityMiddlewareCalled = true;
        next();
      });

      const response = await request(app)
        .get('/api/trades')
        .expect(200);

      expect(securityMiddlewareCalled).toBe(true);
    });

    it('should log security events for suspicious requests', async () => {
      const suspiciousRequest = {
        query: "SELECT * FROM users -- SQL injection attempt"
      };

      // Mock security event logging
      (complianceService.logSecurityEvent as jest.Mock).mockResolvedValue({
        id: 'event1',
        userId: 'user1',
        eventType: 'suspicious_request',
        severity: 'high',
        description: 'SQL injection attempt detected'
      });

      const response = await request(app)
        .post('/api/trades')
        .send(suspiciousRequest)
        .expect(400);

      expect(complianceService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'suspicious_request',
          severity: 'high',
          description: expect.stringContaining('SQL injection')
        })
      );
    });

    it('should handle compliance violations', async () => {
      // Mock compliance violation
      const mockComplianceResult = {
        score: 45,
        passed: false,
        violations: [
          {
            ruleId: 'data_encryption',
            severity: 'critical',
            message: 'Unencrypted sensitive data detected'
          }
        ]
      };

      (complianceService.runComplianceCheck as jest.Mock).mockResolvedValue(mockComplianceResult);

      const response = await request(app)
        .get('/api/compliance/status')
        .expect(200);

      expect(response.body.passed).toBe(false);
      expect(response.body.violations).toHaveLength(1);
      expect(response.body.violations[0].ruleId).toBe('data_encryption');
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large number of trades
      const mockTrades = Array.from({ length: 1000 }, (_, i) => ({
        id: `trade${i}`,
        userId: 'user1',
        symbol: `SYMBOL${i}`,
        type: i % 2 === 0 ? 'long' : 'short',
        quantity: 100,
        entryPrice: 100 + i,
        entryDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        status: 'closed'
      }));

      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/trades')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent requests', async () => {
      // Mock successful responses
      (storage.getTrades as jest.Mock).mockResolvedValue([]);
      (storage.getUser as jest.Mock).mockResolvedValue({ id: 'user1', username: 'testuser' });

      // Make concurrent requests
      const requests = [
        request(app).get('/api/trades'),
        request(app).get('/api/user'),
        request(app).get('/api/trades'),
        request(app).get('/api/user'),
        request(app).get('/api/trades')
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Create a trade
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

      const createResponse = await request(app)
        .post('/api/trades')
        .send(tradeData)
        .expect(201);

      expect(createResponse.body).toEqual(createdTrade);

      // Update the trade
      const updateData = {
        exitPrice: 160.00,
        exitDate: '2024-01-02',
        status: 'closed'
      };

      const updatedTrade = {
        ...createdTrade,
        ...updateData
      };

      (storage.updateTrade as jest.Mock).mockResolvedValue(updatedTrade);

      const updateResponse = await request(app)
        .put(`/api/trades/${createdTrade.id}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toEqual(updatedTrade);

      // Verify the trade was updated correctly
      expect(updateResponse.body.status).toBe('closed');
      expect(updateResponse.body.exitPrice).toBe(160.00);
    });

    it('should handle data validation across all endpoints', async () => {
      // Test validation on different endpoints
      const invalidData = {
        symbol: '',
        type: 'invalid',
        quantity: -100,
        entryPrice: -150.00
      };

      // Test POST /api/trades
      const postResponse = await request(app)
        .post('/api/trades')
        .send(invalidData)
        .expect(400);

      expect(postResponse.body.message).toContain('validation');

      // Test PUT /api/trades/:id
      const putResponse = await request(app)
        .put('/api/trades/trade1')
        .send(invalidData)
        .expect(400);

      expect(putResponse.body.message).toContain('validation');
    });
  });
});
