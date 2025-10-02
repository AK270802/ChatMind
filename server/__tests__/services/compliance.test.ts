import { ComplianceService, ComplianceRule, ComplianceResult, SecurityEvent, AuditLog } from '../../services/compliance';
import { Request, Response, NextFunction } from 'express';

describe('ComplianceService', () => {
  let complianceService: ComplianceService;
  let mockStorage: any;

  beforeEach(() => {
    // Mock storage
    mockStorage = {
      getUsers: jest.fn(),
      getTrades: jest.fn(),
      createSecurityEvent: jest.fn(),
      createAuditLog: jest.fn(),
    };

    complianceService = new ComplianceService(mockStorage);
  });

  describe('Compliance Rules', () => {
    it('should have default compliance rules', () => {
      const rules = complianceService.getComplianceRules();
      expect(rules).toHaveLength(10);
      expect(rules.every(rule => 
        rule.id && 
        rule.name && 
        rule.description && 
        rule.type && 
        rule.severity && 
        typeof rule.enabled === 'boolean'
      )).toBe(true);
    });

    it('should enable and disable rules', () => {
      const ruleId = 'data_encryption';
      complianceService.enableRule(ruleId);
      let rule = complianceService.getRule(ruleId);
      expect(rule?.enabled).toBe(true);

      complianceService.disableRule(ruleId);
      rule = complianceService.getRule(ruleId);
      expect(rule?.enabled).toBe(false);
    });

    it('should return null for non-existent rule', () => {
      const rule = complianceService.getRule('non-existent');
      expect(rule).toBeNull();
    });
  });

  describe('Data Protection Compliance', () => {
    it('should detect unencrypted sensitive data', async () => {
      const testData = {
        users: [
          { 
            id: '1', 
            username: 'testuser',
            email: 'test@example.com',
            password: 'plaintext123' // Unencrypted password
          }
        ],
        trades: []
      };

      const result = await complianceService.runComplianceCheck(testData);
      
      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe('data_encryption');
      expect(result.violations[0].severity).toBe('critical');
    });

    it('should pass when sensitive data is encrypted', async () => {
      const testData = {
        users: [
          { 
            id: '1', 
            username: 'testuser',
            email: 'test@example.com',
            password: '$2a$10$hashedpassword' // Encrypted password
          }
        ],
        trades: []
      };

      const result = await complianceService.runComplianceCheck(testData);
      
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Financial Compliance', () => {
    it('should detect suspicious trade patterns', async () => {
      const testData = {
        users: [],
        trades: [
          {
            id: '1',
            symbol: 'TEST',
            quantity: 1000000, // Unusually large quantity
            entryPrice: 0.01,
            pnl: 10000000 // Unusually large profit
          }
        ]
      };

      const result = await complianceService.runComplianceCheck(testData);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.ruleId === 'suspicious_patterns')).toBe(true);
    });

    it('should detect wash trading', async () => {
      const testData = {
        users: [],
        trades: [
          {
            id: '1',
            symbol: 'TEST',
            quantity: 1000,
            entryPrice: 10.00,
            exitPrice: 9.95,
            entryDate: '2024-01-01',
            exitDate: '2024-01-01' // Same day entry and exit
          }
        ]
      };

      const result = await complianceService.runComplianceCheck(testData);
      
      expect(result.passed).toBe(false);
      expect(result.violations.some(v => v.ruleId === 'wash_trading')).toBe(true);
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events', async () => {
      const eventData: SecurityEvent = {
        id: '1',
        userId: 'user1',
        eventType: 'login_attempt',
        severity: 'medium',
        description: 'Failed login attempt',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        metadata: { attempts: 3 }
      };

      mockStorage.createSecurityEvent.mockResolvedValue(eventData);

      await complianceService.logSecurityEvent(eventData);
      
      expect(mockStorage.createSecurityEvent).toHaveBeenCalledWith(eventData);
    });

    it('should get recent security events', async () => {
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
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

      mockStorage.getSecurityEvents.mockResolvedValue(mockEvents);

      const events = await complianceService.getRecentSecurityEvents(10);
      
      expect(events).toEqual(mockEvents);
      expect(mockStorage.getSecurityEvents).toHaveBeenCalledWith(10);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', async () => {
      const auditData: AuditLog = {
        id: '1',
        userId: 'user1',
        action: 'trade_create',
        resourceType: 'trade',
        resourceId: 'trade1',
        details: { symbol: 'AAPL', quantity: 100 },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent'
      };

      mockStorage.createAuditLog.mockResolvedValue(auditData);

      await complianceService.logAuditEvent(auditData);
      
      expect(mockStorage.createAuditLog).toHaveBeenCalledWith(auditData);
    });

    it('should get audit logs for user', async () => {
      const mockLogs: AuditLog[] = [
        {
          id: '1',
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

      mockStorage.getAuditLogs.mockResolvedValue(mockLogs);

      const logs = await complianceService.getAuditLogs('user1');
      
      expect(logs).toEqual(mockLogs);
      expect(mockStorage.getAuditLogs).toHaveBeenCalledWith('user1');
    });
  });

  describe('Security Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'test-agent'
        },
        body: {},
        query: {},
        params: {}
      };

      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockNext = jest.fn();
    });

    it('should allow valid requests', async () => {
      mockRequest.user = { id: 'user1', username: 'testuser' };

      await complianceService.securityMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block requests with suspicious patterns', async () => {
      mockRequest.body = {
        query: "SELECT * FROM users" // SQL injection attempt
      };

      await complianceService.securityMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should log security events for blocked requests', async () => {
      mockRequest.body = {
        query: "DROP TABLE users" // SQL injection attempt
      };

      await complianceService.securityMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStorage.createSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'suspicious_request',
          severity: 'high',
          description: expect.stringContaining('SQL injection')
        })
      );
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', email: 'user1@example.com' },
        { id: '2', username: 'user2', email: 'user2@example.com' }
      ];

      const mockTrades = [
        { id: '1', symbol: 'AAPL', quantity: 100, pnl: 1000 },
        { id: '2', symbol: 'GOOGL', quantity: 50, pnl: -500 }
      ];

      mockStorage.getUsers.mockResolvedValue(mockUsers);
      mockStorage.getTrades.mockResolvedValue(mockTrades);

      const report = await complianceService.generateComplianceReport();
      
      expect(report).toEqual(
        expect.objectContaining({
          timestamp: expect.any(Date),
          overallScore: expect.any(Number),
          rules: expect.any(Array),
          violations: expect.any(Array),
          recommendations: expect.any(Array)
        })
      );
    });
  });
});
