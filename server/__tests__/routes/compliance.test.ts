import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes';
import { storage } from '../../storage';
import { complianceService } from '../../services/compliance';

// Mock storage
jest.mock('../../storage', () => ({
  storage: {
    getUsers: jest.fn(),
    getTrades: jest.fn(),
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
      req.user = { id: 'user1', username: 'testuser', role: 'admin' };
      next();
    });
  }),
}));

describe('Compliance API Routes', () => {
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

  describe('GET /api/compliance/status', () => {
    it('should return compliance status', async () => {
      const mockUsers = [
        { id: 'user1', username: 'testuser', email: 'test@example.com' }
      ];
      const mockTrades = [
        { id: 'trade1', symbol: 'AAPL', quantity: 100, pnl: 1000 }
      ];

      const mockComplianceResult = {
        score: 85,
        passed: true,
        violations: [],
        rules: []
      };

      (storage.getUsers as jest.Mock).mockResolvedValue(mockUsers);
      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);
      (complianceService.runComplianceCheck as jest.Mock).mockResolvedValue(mockComplianceResult);
      (complianceService.getComplianceRules as jest.Mock).mockReturnValue([]);

      const response = await request(app)
        .get('/api/compliance/status')
        .expect(200);

      expect(response.body).toEqual({
        timestamp: expect.any(String),
        overallScore: 85,
        passed: true,
        violations: [],
        rules: []
      });

      expect(complianceService.runComplianceCheck).toHaveBeenCalledWith({
        users: mockUsers,
        trades: mockTrades,
        sessions: [],
        recentActions: []
      });
    });

    it('should return 500 if compliance check fails', async () => {
      (storage.getUsers as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/compliance/status')
        .expect(500);

      expect(response.body.message).toBe('Error checking compliance status');
    });
  });

  describe('GET /api/compliance/report', () => {
    it('should generate compliance report', async () => {
      const mockReport = {
        timestamp: new Date(),
        overallScore: 90,
        rules: [],
        violations: [],
        recommendations: []
      };

      (complianceService.generateComplianceReport as jest.Mock).mockResolvedValue(mockReport);

      const response = await request(app)
        .get('/api/compliance/report')
        .expect(200);

      expect(response.body).toEqual(mockReport);
      expect(complianceService.generateComplianceReport).toHaveBeenCalled();
    });

    it('should return 500 if report generation fails', async () => {
      (complianceService.generateComplianceReport as jest.Mock)
        .mockRejectedValue(new Error('Report generation failed'));

      const response = await request(app)
        .get('/api/compliance/report')
        .expect(500);

      expect(response.body.message).toBe('Error generating compliance report');
    });
  });

  describe('GET /api/compliance/rules', () => {
    it('should return compliance rules', async () => {
      const mockRules = [
        {
          id: 'data_encryption',
          name: 'Data Encryption',
          description: 'Sensitive data must be encrypted',
          type: 'data_protection',
          severity: 'critical',
          enabled: true
        }
      ];

      (complianceService.getComplianceRules as jest.Mock).mockReturnValue(mockRules);

      const response = await request(app)
        .get('/api/compliance/rules')
        .expect(200);

      expect(response.body).toEqual(mockRules);
    });
  });

  describe('POST /api/compliance/rules/:id/enable', () => {
    it('should enable a compliance rule', async () => {
      const ruleId = 'data_encryption';

      (complianceService.enableRule as jest.Mock).mockReturnValue(true);

      const response = await request(app)
        .post(`/api/compliance/rules/${ruleId}/enable`)
        .expect(200);

      expect(response.body).toEqual({
        message: `Rule ${ruleId} enabled successfully`
      });
      expect(complianceService.enableRule).toHaveBeenCalledWith(ruleId);
    });

    it('should return 404 if rule not found', async () => {
      const ruleId = 'nonexistent';

      (complianceService.enableRule as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .post(`/api/compliance/rules/${ruleId}/enable`)
        .expect(404);

      expect(response.body.message).toBe('Rule not found');
    });
  });

  describe('POST /api/compliance/rules/:id/disable', () => {
    it('should disable a compliance rule', async () => {
      const ruleId = 'data_encryption';

      (complianceService.disableRule as jest.Mock).mockReturnValue(true);

      const response = await request(app)
        .post(`/api/compliance/rules/${ruleId}/disable`)
        .expect(200);

      expect(response.body).toEqual({
        message: `Rule ${ruleId} disabled successfully`
      });
      expect(complianceService.disableRule).toHaveBeenCalledWith(ruleId);
    });

    it('should return 404 if rule not found', async () => {
      const ruleId = 'nonexistent';

      (complianceService.disableRule as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .post(`/api/compliance/rules/${ruleId}/disable`)
        .expect(404);

      expect(response.body.message).toBe('Rule not found');
    });
  });

  describe('GET /api/compliance/security-events', () => {
    it('should return security events', async () => {
      const mockEvents = [
        {
          id: 'event1',
          userId: 'user1',
          eventType: 'login_attempt',
          severity: 'medium',
          description: 'Failed login attempt',
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          timestamp: new Date(),
          metadata: { attempts: 3 }
        }
      ];

      (complianceService.getRecentSecurityEvents as jest.Mock).mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/compliance/security-events')
        .expect(200);

      expect(response.body).toEqual(mockEvents);
      expect(complianceService.getRecentSecurityEvents).toHaveBeenCalledWith(50);
    });

    it('should support limit parameter', async () => {
      const mockEvents = [];
      (complianceService.getRecentSecurityEvents as jest.Mock).mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/compliance/security-events?limit=10')
        .expect(200);

      expect(complianceService.getRecentSecurityEvents).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /api/compliance/audit-logs', () => {
    it('should return audit logs', async () => {
      const mockLogs = [
        {
          id: 'log1',
          userId: 'user1',
          action: 'trade_create',
          resourceType: 'trade',
          resourceId: 'trade1',
          details: { symbol: 'AAPL', quantity: 100 },
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          timestamp: new Date()
        }
      ];

      (complianceService.getAuditLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/compliance/audit-logs')
        .expect(200);

      expect(response.body).toEqual(mockLogs);
      expect(complianceService.getAuditLogs).toHaveBeenCalledWith('user1');
    });

    it('should support userId parameter', async () => {
      const mockLogs = [];
      const userId = 'user2';

      (complianceService.getAuditLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get(`/api/compliance/audit-logs?userId=${userId}`)
        .expect(200);

      expect(complianceService.getAuditLogs).toHaveBeenCalledWith(userId);
    });
  });

  describe('POST /api/compliance/security-events', () => {
    it('should create security event', async () => {
      const eventData = {
        eventType: 'suspicious_activity',
        severity: 'high',
        description: 'Suspicious login pattern detected',
        metadata: { ip: '192.168.1.1', attempts: 5 }
      };

      const createdEvent = {
        id: 'event1',
        userId: 'user1',
        ...eventData,
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        timestamp: new Date()
      };

      (complianceService.logSecurityEvent as jest.Mock).mockResolvedValue(createdEvent);

      const response = await request(app)
        .post('/api/compliance/security-events')
        .send(eventData)
        .expect(201);

      expect(response.body).toEqual(createdEvent);
      expect(complianceService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          ...eventData,
          ipAddress: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });

    it('should return 400 for invalid event data', async () => {
      const invalidEventData = {
        eventType: '',
        severity: 'invalid_severity',
        description: ''
      };

      const response = await request(app)
        .post('/api/compliance/security-events')
        .send(invalidEventData)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });
  });

  describe('POST /api/compliance/audit-logs', () => {
    it('should create audit log', async () => {
      const auditData = {
        action: 'trade_update',
        resourceType: 'trade',
        resourceId: 'trade1',
        details: { symbol: 'AAPL', quantity: 150 }
      };

      const createdLog = {
        id: 'log1',
        userId: 'user1',
        ...auditData,
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        timestamp: new Date()
      };

      (complianceService.logAuditEvent as jest.Mock).mockResolvedValue(createdLog);

      const response = await request(app)
        .post('/api/compliance/audit-logs')
        .send(auditData)
        .expect(201);

      expect(response.body).toEqual(createdLog);
      expect(complianceService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          ...auditData,
          ipAddress: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });

    it('should return 400 for invalid audit data', async () => {
      const invalidAuditData = {
        action: '',
        resourceType: '',
        resourceId: '',
        details: {}
      };

      const response = await request(app)
        .post('/api/compliance/audit-logs')
        .send(invalidAuditData)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });
  });

  describe('GET /api/compliance/export', () => {
    it('should export compliance data as CSV', async () => {
      const mockUsers = [
        { id: 'user1', username: 'testuser', email: 'test@example.com' }
      ];
      const mockTrades = [
        { id: 'trade1', symbol: 'AAPL', quantity: 100, pnl: 1000 }
      ];
      const mockEvents = [
        { id: 'event1', eventType: 'login_attempt', severity: 'medium' }
      ];
      const mockLogs = [
        { id: 'log1', action: 'trade_create', resourceType: 'trade' }
      ];

      (storage.getUsers as jest.Mock).mockResolvedValue(mockUsers);
      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);
      (complianceService.getRecentSecurityEvents as jest.Mock).mockResolvedValue(mockEvents);
      (complianceService.getAuditLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/compliance/export')
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toBe('attachment; filename="compliance_export.csv"');
      expect(response.text).toContain('Type,ID,Details,Timestamp');
    });

    it('should support format parameter', async () => {
      const mockUsers = [];
      const mockTrades = [];
      const mockEvents = [];
      const mockLogs = [];

      (storage.getUsers as jest.Mock).mockResolvedValue(mockUsers);
      (storage.getTrades as jest.Mock).mockResolvedValue(mockTrades);
      (complianceService.getRecentSecurityEvents as jest.Mock).mockResolvedValue(mockEvents);
      (complianceService.getAuditLogs as jest.Mock).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/compliance/export?format=json')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toEqual({
        users: [],
        trades: [],
        securityEvents: [],
        auditLogs: []
      });
    });

    it('should return 500 if export fails', async () => {
      (storage.getUsers as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/compliance/export')
        .expect(500);

      expect(response.body.message).toBe('Error exporting compliance data');
    });
  });
});
