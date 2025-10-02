import { Router, Request, Response } from "express";
import { brokerIntegrationService, BrokerConnection, BrokerCredentials, SyncResult } from "../services/brokerIntegration";
import { getSupportedBrokers } from "../services/csvParser";

const router = Router();

// Get all supported brokers
router.get("/brokers", (req: Request, res: Response) => {
  try {
    const brokers = getSupportedBrokers();
    res.json({
      success: true,
      data: brokers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get all connections
router.get("/connections", (req: Request, res: Response) => {
  try {
    const connections = brokerIntegrationService.getConnections();
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get specific connection
router.get("/connections/:connectionId", (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const connection = brokerIntegrationService.getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found"
      });
    }
    
    res.json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Connect to a broker
router.post("/connections/:connectionId/connect", async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const credentials: BrokerCredentials = req.body;
    
    // Validate required credentials based on broker
    const connection = brokerIntegrationService.getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found"
      });
    }
    
    // Basic validation
    if (!credentials.apiKey || !credentials.accessToken) {
      return res.status(400).json({
        success: false,
        error: "API key and access token are required"
      });
    }
    
    const success = await brokerIntegrationService.connect(connectionId, credentials);
    
    if (success) {
      res.json({
        success: true,
        message: "Connected successfully",
        data: brokerIntegrationService.getConnection(connectionId)
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to connect"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Disconnect from a broker
router.post("/connections/:connectionId/disconnect", async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    
    await brokerIntegrationService.disconnect(connectionId);
    
    res.json({
      success: true,
      message: "Disconnected successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Sync trades from a specific broker
router.post("/connections/:connectionId/sync", async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const result = await brokerIntegrationService.syncTrades(connectionId);
    
    res.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Synced ${result.imported} trades successfully` 
        : "Sync failed"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Sync trades from all connected brokers
router.post("/sync-all", async (req: Request, res: Response) => {
  try {
    const results = await brokerIntegrationService.syncAllTrades();
    
    const totalImported = Object.values(results).reduce((sum, result) => sum + result.imported, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);
    
    res.json({
      success: totalErrors === 0,
      data: results,
      summary: {
        totalImported,
        totalErrors,
        brokersSynced: Object.keys(results).length
      },
      message: totalErrors === 0 
        ? `Synced ${totalImported} trades from ${Object.keys(results).length} brokers` 
        : `Sync completed with ${totalErrors} errors`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get account info from a broker
router.get("/connections/:connectionId/account", async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const connection = brokerIntegrationService.getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found"
      });
    }
    
    if (connection.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: "Broker not connected"
      });
    }
    
    // This would need to be implemented in the adapter
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        message: "Account info retrieval not implemented yet",
        broker: connection.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get positions from a broker
router.get("/connections/:connectionId/positions", async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const connection = brokerIntegrationService.getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found"
      });
    }
    
    if (connection.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: "Broker not connected"
      });
    }
    
    // This would need to be implemented in the adapter
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        message: "Positions retrieval not implemented yet",
        broker: connection.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Place an order through a broker
router.post("/connections/:connectionId/orders", async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const orderData = req.body;
    const connection = brokerIntegrationService.getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found"
      });
    }
    
    if (connection.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: "Broker not connected"
      });
    }
    
    // Validate order data
    const requiredFields = ['symbol', 'type', 'quantity', 'price'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // This would need to be implemented in the adapter
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        message: "Order placement not implemented yet",
        broker: connection.name,
        order: orderData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Cancel an order
router.delete("/connections/:connectionId/orders/:orderId", async (req: Request, res: Response) => {
  try {
    const { connectionId, orderId } = req.params;
    const connection = brokerIntegrationService.getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: "Connection not found"
      });
    }
    
    if (connection.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: "Broker not connected"
      });
    }
    
    // This would need to be implemented in the adapter
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        message: "Order cancellation not implemented yet",
        broker: connection.name,
        orderId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Webhook endpoint for broker notifications
router.post("/webhook/:brokerName", (req: Request, res: Response) => {
  try {
    const { brokerName } = req.params;
    const webhookData = req.body;
    
    // Process webhook data based on broker
    console.log(`Received webhook from ${brokerName}:`, webhookData);
    
    // This would need to be implemented based on broker-specific webhook formats
    // For now, just acknowledge receipt
    
    res.json({
      success: true,
      message: "Webhook received successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get sync history
router.get("/sync-history", (req: Request, res: Response) => {
  try {
    // This would need to be implemented with database storage
    // For now, return placeholder data
    res.json({
      success: true,
      data: {
        message: "Sync history not implemented yet",
        history: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get sync status
router.get("/sync-status", (req: Request, res: Response) => {
  try {
    const connections = brokerIntegrationService.getConnections();
    const status = connections.map(conn => ({
      broker: conn.name,
      status: conn.status,
      lastSync: conn.lastSync,
      isConnected: conn.status === 'connected'
    }));
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
