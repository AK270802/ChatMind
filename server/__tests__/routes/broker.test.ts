import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../routes';
import { storage } from '../../storage';

// Mock storage
jest.mock('../../storage', () => ({
  storage: {
    getBrokerConnections: jest.fn(),
    getBrokerConnection: jest.fn(),
    createBrokerConnection: jest.fn(),
    updateBrokerConnection: jest.fn(),
    deleteBrokerConnection: jest.fn(),
    getBrokerTrades: jest.fn(),
    createBrokerTrade: jest.fn(),
    syncBrokerTrades: jest.fn(),
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

describe('Broker API Routes', () => {
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

  describe('GET /api/broker/connections', () => {
    it('should return user broker connections', async () => {
      const mockConnections = [
        {
          id: 'conn1',
          userId: 'user1',
          name: 'Zerodha Account',
          brokerType: 'zerodha',
          connectionType: 'api',
          status: 'connected',
          isActive: true,
          createdAt: '2024-01-01'
        }
      ];

      (storage.getBrokerConnections as jest.Mock).mockResolvedValue(mockConnections);

      const response = await request(app)
        .get('/api/broker/connections')
        .expect(200);

      expect(response.body).toEqual(mockConnections);
      expect(storage.getBrokerConnections).toHaveBeenCalledWith('user1');
    });

    it('should return empty array for no connections', async () => {
      (storage.getBrokerConnections as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/broker/connections')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/broker/connections/:id', () => {
    it('should return specific broker connection', async () => {
      const connectionId = 'conn1';
      const mockConnection = {
        id: connectionId,
        userId: 'user1',
        name: 'Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'connected',
        isActive: true,
        createdAt: '2024-01-01'
      };

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(mockConnection);

      const response = await request(app)
        .get(`/api/broker/connections/${connectionId}`)
        .expect(200);

      expect(response.body).toEqual(mockConnection);
      expect(storage.getBrokerConnection).toHaveBeenCalledWith(connectionId);
    });

    it('should return 404 if connection not found', async () => {
      const connectionId = 'nonexistent';

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/broker/connections/${connectionId}`)
        .expect(404);

      expect(response.body.message).toBe('Broker connection not found');
    });
  });

  describe('POST /api/broker/connections', () => {
    it('should create new broker connection', async () => {
      const connectionData = {
        name: 'ICICI Direct Account',
        brokerType: 'icicidirect',
        connectionType: 'api',
        credentials: { apiKey: 'test-key', secret: 'test-secret' },
        config: { sandbox: true }
      };

      const createdConnection = {
        id: 'conn1',
        userId: 'user1',
        ...connectionData,
        status: 'disconnected',
        isActive: true,
        createdAt: '2024-01-01'
      };

      (storage.createBrokerConnection as jest.Mock).mockResolvedValue(createdConnection);

      const response = await request(app)
        .post('/api/broker/connections')
        .send(connectionData)
        .expect(201);

      expect(response.body).toEqual(createdConnection);
      expect(storage.createBrokerConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          ...connectionData
        })
      );
    });

    it('should return 400 for invalid connection data', async () => {
      const invalidConnection = {
        name: '',
        brokerType: 'invalid_broker',
        connectionType: 'invalid_type',
        credentials: {},
        config: {}
      };

      const response = await request(app)
        .post('/api/broker/connections')
        .send(invalidConnection)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });
  });

  describe('PUT /api/broker/connections/:id', () => {
    it('should update broker connection', async () => {
      const connectionId = 'conn1';
      const updateData = {
        name: 'Updated Zerodha Account',
        status: 'connected',
        credentials: { apiKey: 'new-key', secret: 'new-secret' }
      };

      const updatedConnection = {
        id: connectionId,
        userId: 'user1',
        name: 'Updated Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'connected',
        credentials: { apiKey: 'new-key', secret: 'new-secret' },
        isActive: true,
        createdAt: '2024-01-01'
      };

      (storage.updateBrokerConnection as jest.Mock).mockResolvedValue(updatedConnection);

      const response = await request(app)
        .put(`/api/broker/connections/${connectionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedConnection);
      expect(storage.updateBrokerConnection).toHaveBeenCalledWith(connectionId, updateData);
    });

    it('should return 404 if connection not found', async () => {
      const connectionId = 'nonexistent';

      (storage.updateBrokerConnection as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/broker/connections/${connectionId}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.message).toBe('Broker connection not found');
    });
  });

  describe('DELETE /api/broker/connections/:id', () => {
    it('should delete broker connection', async () => {
      const connectionId = 'conn1';

      (storage.deleteBrokerConnection as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/broker/connections/${connectionId}`)
        .expect(200);

      expect(response.body.message).toBe('Broker connection deleted successfully');
      expect(storage.deleteBrokerConnection).toHaveBeenCalledWith(connectionId);
    });

    it('should return 404 if connection not found', async () => {
      const connectionId = 'nonexistent';

      (storage.deleteBrokerConnection as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/broker/connections/${connectionId}`)
        .expect(404);

      expect(response.body.message).toBe('Broker connection not found');
    });
  });

  describe('POST /api/broker/connections/:id/test', () => {
    it('should test broker connection', async () => {
      const connectionId = 'conn1';
      const mockConnection = {
        id: connectionId,
        userId: 'user1',
        name: 'Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'connected',
        credentials: { apiKey: 'test-key' },
        isActive: true
      };

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(mockConnection);

      const response = await request(app)
        .post(`/api/broker/connections/${connectionId}/test`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Connection test successful',
        details: expect.any(Object)
      });
    });

    it('should return 404 if connection not found', async () => {
      const connectionId = 'nonexistent';

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/broker/connections/${connectionId}/test`)
        .expect(404);

      expect(response.body.message).toBe('Broker connection not found');
    });

    it('should return 400 for failed connection test', async () => {
      const connectionId = 'conn1';
      const mockConnection = {
        id: connectionId,
        userId: 'user1',
        name: 'Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'disconnected',
        credentials: { apiKey: 'invalid-key' },
        isActive: true
      };

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(mockConnection);

      const response = await request(app)
        .post(`/api/broker/connections/${connectionId}/test`)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Connection test failed',
        error: expect.any(String)
      });
    });
  });

  describe('POST /api/broker/connections/:id/sync', () => {
    it('should sync broker trades', async () => {
      const connectionId = 'conn1';
      const mockConnection = {
        id: connectionId,
        userId: 'user1',
        name: 'Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'connected',
        isActive: true
      };

      const syncResult = {
        success: true,
        message: 'Sync completed successfully',
        tradesImported: 5,
        tradesUpdated: 2,
        errors: []
      };

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(mockConnection);
      (storage.syncBrokerTrades as jest.Mock).mockResolvedValue(syncResult);

      const response = await request(app)
        .post(`/api/broker/connections/${connectionId}/sync`)
        .expect(200);

      expect(response.body).toEqual(syncResult);
      expect(storage.syncBrokerTrades).toHaveBeenCalledWith(connectionId);
    });

    it('should return 404 if connection not found', async () => {
      const connectionId = 'nonexistent';

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/broker/connections/${connectionId}/sync`)
        .expect(404);

      expect(response.body.message).toBe('Broker connection not found');
    });

    it('should return 400 for sync failure', async () => {
      const connectionId = 'conn1';
      const mockConnection = {
        id: connectionId,
        userId: 'user1',
        name: 'Zerodha Account',
        brokerType: 'zerodha',
        connectionType: 'api',
        status: 'disconnected',
        isActive: true
      };

      (storage.getBrokerConnection as jest.Mock).mockResolvedValue(mockConnection);
      (storage.syncBrokerTrades as jest.Mock).mockRejectedValue(new Error('Sync failed'));

      const response = await request(app)
        .post(`/api/broker/connections/${connectionId}/sync`)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Sync failed',
        error: 'Sync failed'
      });
    });
  });

  describe('GET /api/broker/trades', () => {
    it('should return broker trades', async () => {
      const mockTrades = [
        {
          id: 'trade1',
          brokerConnectionId: 'conn1',
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          exitPrice: 160.00,
          pnl: 1000,
          brokerTradeId: 'broker123',
          status: 'completed'
        }
      ];

      (storage.getBrokerTrades as jest.Mock).mockResolvedValue(mockTrades);

      const response = await request(app)
        .get('/api/broker/trades')
        .expect(200);

      expect(response.body).toEqual(mockTrades);
      expect(storage.getBrokerTrades).toHaveBeenCalledWith('user1');
    });

    it('should support connectionId filter', async () => {
      const connectionId = 'conn1';
      const mockTrades = [];

      (storage.getBrokerTrades as jest.Mock).mockResolvedValue(mockTrades);

      const response = await request(app)
        .get(`/api/broker/trades?connectionId=${connectionId}`)
        .expect(200);

      expect(storage.getBrokerTrades).toHaveBeenCalledWith('user1', connectionId);
    });

    it('should return empty array for no trades', async () => {
      (storage.getBrokerTrades as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/broker/trades')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/broker/trades/import', () => {
    it('should import broker trades', async () => {
      const importData = {
        connectionId: 'conn1',
        trades: [
          {
            symbol: 'AAPL',
            type: 'long',
            quantity: 100,
            entryPrice: 150.00,
            entryDate: '2024-01-01',
            brokerTradeId: 'broker123'
          }
        ]
      };

      const importedTrades = importData.trades.map((trade, index) => ({
        id: `trade${index + 1}`,
        brokerConnectionId: 'conn1',
        userId: 'user1',
        ...trade,
        status: 'completed'
      }));

      (storage.createBrokerTrade as jest.Mock)
        .mockResolvedValueOnce(importedTrades[0]);

      const response = await request(app)
        .post('/api/broker/trades/import')
        .send(importData)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Trades imported successfully',
        trades: importedTrades,
        total: 1
      });
    });

    it('should return 400 for invalid import data', async () => {
      const invalidImport = {
        connectionId: '',
        trades: []
      };

      const response = await request(app)
        .post('/api/broker/trades/import')
        .send(invalidImport)
        .expect(400);

      expect(response.body.message).toContain('validation');
    });
  });

  describe('GET /api/broker/supported', () => {
    it('should return supported brokers', async () => {
      const response = await request(app)
        .get('/api/broker/supported')
        .expect(200);

      expect(response.body).toEqual([
        {
          id: 'zerodha',
          name: 'Zerodha',
          description: 'Indian discount broker',
          connectionTypes: ['api', 'csv'],
          features: ['equity', 'futures', 'options']
        },
        {
          id: 'icicidirect',
          name: 'ICICI Direct',
          description: 'Indian full-service broker',
          connectionTypes: ['api', 'csv'],
          features: ['equity', 'futures', 'options', 'mutual_funds']
        },
        {
          id: 'upstox',
          name: 'Upstox',
          description: 'Indian discount broker',
          connectionTypes: ['api', 'csv'],
          features: ['equity', 'futures', 'options']
        },
        {
          id: 'interactive_brokers',
          name: 'Interactive Brokers',
          description: 'International broker',
          connectionTypes: ['api', 'csv', 'webhook'],
          features: ['equity', 'futures', 'options', 'forex', 'crypto']
        }
      ]);
    });
  });
});
