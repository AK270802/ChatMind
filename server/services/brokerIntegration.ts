import { Trade, InsertTrade } from "@shared/schema";
import { BrokerFormat, SUPPORTED_BROKERS } from "./csvParser";

// Helper function to create headers object with filtered undefined values
function createHeaders(headers: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export interface BrokerConnection {
  id: string;
  name: string;
  type: 'api' | 'csv' | 'webhook';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  credentials?: BrokerCredentials;
  config?: BrokerConfig;
}

export interface BrokerCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  twoFactorCode?: string;
}

export interface BrokerConfig {
  sandbox: boolean;
  syncInterval: number; // minutes
  autoImport: boolean;
  dataRetention: number; // days
  customMappings?: Record<string, string>;
}

export interface BrokerTrade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'long' | 'short';
  quantity: number;
  price: number;
  timestamp: Date;
  status: 'open' | 'closed' | 'cancelled';
  exchange?: string;
  product?: string;
  orderType?: string;
  validity?: string;
  brokerage?: number;
  taxes?: number;
  netAmount?: number;
}

export interface SyncResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
  lastSyncTime: Date;
}

// Helper function to build headers object, filtering out undefined values
function buildHeaders(headers: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export abstract class BrokerAdapter {
  protected connection: BrokerConnection;
  
  constructor(connection: BrokerConnection) {
    this.connection = connection;
  }
  
  abstract authenticate(): Promise<boolean>;
  abstract getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]>;
  abstract getAccountInfo(): Promise<any>;
  abstract getPositions(): Promise<any>;
  abstract placeOrder(order: any): Promise<any>;
  abstract cancelOrder(orderId: string): Promise<boolean>;
  abstract syncTrades(): Promise<SyncResult>;
  
  protected handleError(error: any, context: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`${this.connection.name} ${context}: ${errorMessage}`);
  }
}

export class ZerodhaAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox 
      ? 'https://api.kite.trade/sandbox' 
      : 'https://api.kite.trade';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      // Zerodha Kite Connect API authentication
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('API key and access token are required');
      }
      
      // Test authentication by getting user profile
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: buildHeaders({
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('Not authenticated');
      }
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/trades?${params}`, {
        headers: createHeaders({
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/margins`, {
        headers: createHeaders({
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/orders/regular`, {
        method: 'POST',
        headers: createHeaders({
                    'X-Kite-Version': '3',
                    'Authorization': `token ${apiKey}:${accessToken}`,
                    'Content-Type': 'application/json'
                  }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/orders/regular/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'X-Kite-Version': '3',
          'Authorization': `token ${apiKey}:${accessToken}`
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      // Here you would save to database
      // For now, return sync result
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.trade_id,
      symbol: trade.trading_symbol,
      type: trade.transaction_type.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.price,
      timestamp: new Date(trade.exchange_timestamp),
      status: 'closed',
      exchange: trade.exchange,
      product: trade.product,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.net_amount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system', // This would be the actual user ID
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class ICICIDirectAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.icicidirect.com/sandbox'
      : 'https://api.icicidirect.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      // ICICIDirect API authentication
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('API key and access token are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/session`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/order/trades?${params}`, {
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.trades || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': apiKey
        }),
        body: JSON.stringify(order)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Key': apiKey
        })
      });
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.orderId,
      symbol: trade.scripName,
      type: trade.buySell.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.price,
      timestamp: new Date(trade.orderTime),
      status: trade.status.toLowerCase() === 'executed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.netAmount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class UpstoxAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.upstox.com/sandbox'
      : 'https://api.upstox.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('API key and access token are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/trade/trades?${params}`, {
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: buildHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: createHeaders({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-key': apiKey
                  }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': apiKey
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.trade_id,
      symbol: trade.symbol,
      type: trade.side.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.price,
      timestamp: new Date(trade.timestamp),
      status: trade.status.toLowerCase() === 'completed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.net_amount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class AngelOneAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://smartapi.angelbroking.com/sandbox'
      : 'https://smartapi.angelbroking.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken || !clientId) {
        throw new Error('API key, access token, and client ID are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/order/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.orderId,
      symbol: trade.scripName,
      type: trade.buySell.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.rate,
      timestamp: new Date(trade.orderTime),
      status: trade.status.toLowerCase() === 'executed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.netAmount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class GrowwAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.groww.in/sandbox'
      : 'https://api.groww.in';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('API key and access token are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/trade/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: createHeaders({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Api-Key': apiKey
                  }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.tradeId,
      symbol: trade.stock,
      type: trade.type.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.price,
      timestamp: new Date(trade.date),
      status: trade.status.toLowerCase() === 'completed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.netAmount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class FivePaisaAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://openapi.5paisa.com/sandbox'
      : 'https://openapi.5paisa.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken || !clientId) {
        throw new Error('API key, access token, and client ID are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/order/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.orderId,
      symbol: trade.scripName,
      type: trade.buySell.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.rate,
      timestamp: new Date(trade.date),
      status: trade.status.toLowerCase() === 'executed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.netAmount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class InteractiveBrokersAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.interactivebrokers.com/sandbox'
      : 'https://api.interactivebrokers.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('API key and access token are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/account/info`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.trade_id,
      symbol: trade.symbol,
      type: trade.side.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.price,
      timestamp: new Date(trade.date_time),
      status: trade.status.toLowerCase() === 'filled' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.commission,
      taxes: trade.taxes,
      netAmount: trade.net_amount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class TradingViewAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.tradingview.com/sandbox'
      : 'https://api.tradingview.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken) {
        throw new Error('API key and access token are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/info`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Api-Key': apiKey
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      type: trade.type.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.entry_price,
      timestamp: new Date(trade.entry_time),
      status: trade.status.toLowerCase() === 'closed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.commission,
      taxes: trade.taxes,
      netAmount: trade.net_amount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class MotilalOswalAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.motilaloswal.com/sandbox'
      : 'https://api.motilaloswal.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken || !clientId) {
        throw new Error('API key, access token, and client ID are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/order/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.orderId,
      symbol: trade.scripName,
      type: trade.buySell.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.rate,
      timestamp: new Date(trade.date),
      status: trade.status.toLowerCase() === 'executed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.netAmount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class SharekhanAdapter extends BrokerAdapter {
  private baseUrl: string;
  
  constructor(connection: BrokerConnection) {
    super(connection);
    this.baseUrl = connection.config?.sandbox
      ? 'https://api.sharekhan.com/sandbox'
      : 'https://api.sharekhan.com';
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      if (!apiKey || !accessToken || !clientId) {
        throw new Error('API key, access token, and client ID are required');
      }
      
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      this.connection.status = 'connected';
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.handleError(error, 'authentication');
    }
  }
  
  async getTrades(startDate?: Date, endDate?: Date): Promise<BrokerTrade[]> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const params = new URLSearchParams();
      if (startDate) params.append('from', startDate.toISOString());
      if (endDate) params.append('to', endDate.toISOString());
      
      const response = await fetch(`${this.baseUrl}/order/trades?${params}`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformTrades(data.data || []);
    } catch (error) {
      this.handleError(error, 'fetching trades');
    }
  }
  
  async getAccountInfo(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/user/balance`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching account info');
    }
  }
  
  async getPositions(): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'fetching positions');
    }
  }
  
  async placeOrder(order: any): Promise<any> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/place`, {
        method: 'POST',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        }),
        body: JSON.stringify(order)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error, 'placing order');
    }
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const { apiKey, accessToken, clientId } = this.connection.credentials || {};
      
      const response = await fetch(`${this.baseUrl}/order/cancel/${orderId}`, {
        method: 'DELETE',
        headers: createHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-ApiKey': apiKey,
          'X-ClientCode': clientId
        })
      })
      
      return response.ok;
    } catch (error) {
      this.handleError(error, 'cancelling order');
    }
  }
  
  async syncTrades(): Promise<SyncResult> {
    try {
      const startTime = new Date();
      const lastSync = this.connection.lastSync || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const brokerTrades = await this.getTrades(lastSync);
      const transformedTrades = brokerTrades.map(trade => this.brokerTradeToInsertTrade(trade));
      
      const result: SyncResult = {
        success: true,
        imported: transformedTrades.length,
        updated: 0,
        errors: [],
        lastSyncTime: startTime
      };
      
      this.connection.lastSync = startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    }
  }
  
  private transformTrades(trades: any[]): BrokerTrade[] {
    return trades.map(trade => ({
      id: trade.orderId,
      symbol: trade.scripName,
      type: trade.buySell.toLowerCase() === 'buy' ? 'buy' : 'sell',
      quantity: trade.quantity,
      price: trade.rate,
      timestamp: new Date(trade.date),
      status: trade.status.toLowerCase() === 'executed' ? 'closed' : 'open',
      exchange: trade.exchange,
      brokerage: trade.brokerage,
      taxes: trade.taxes,
      netAmount: trade.netAmount
    }));
  }
  
  private brokerTradeToInsertTrade(brokerTrade: BrokerTrade): InsertTrade {
    return {
      userId: 'system',
      symbol: brokerTrade.symbol,
      type: brokerTrade.type === 'buy' || brokerTrade.type === 'long' ? 'long' : 'short',
      quantity: brokerTrade.quantity,
      entryPrice: brokerTrade.price.toString(),
      entryDate: brokerTrade.timestamp,
      status: brokerTrade.status === 'closed' ? 'closed' : 'open',
      notes: `Imported from ${this.connection.name}`,
      strategy: 'Broker Import'
    };
  }
}

export class BrokerIntegrationService {
  private connections: Map<string, BrokerConnection> = new Map();
  private adapters: Map<string, BrokerAdapter> = new Map();
  
  constructor() {
    // Initialize with supported brokers
    SUPPORTED_BROKERS.forEach(broker => {
      const connection: BrokerConnection = {
        id: broker.name.toLowerCase(),
        name: broker.name,
        type: 'api',
        status: 'disconnected',
        config: {
          sandbox: true,
          syncInterval: 60,
          autoImport: false,
          dataRetention: 90
        }
      };
      
      this.connections.set(connection.id, connection);
    });
  }
  
  async addConnection(connection: BrokerConnection): Promise<void> {
    this.connections.set(connection.id, connection);
    const adapter = this.createAdapter(connection);
    this.adapters.set(connection.id, adapter);
  }
  
  async removeConnection(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
    this.adapters.delete(connectionId);
  }
  
  async connect(connectionId: string, credentials: BrokerCredentials): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    
    connection.credentials = credentials;
    const adapter = this.createAdapter(connection);
    this.adapters.set(connectionId, adapter);
    
    return await adapter.authenticate();
  }
  
  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'disconnected';
      connection.credentials = undefined;
    }
  }
  
  async syncAllTrades(): Promise<Record<string, SyncResult>> {
    const results: Record<string, SyncResult> = {};
    
    for (const [connectionId, adapter] of Array.from(this.adapters.entries())) {
      try {
        const result = await adapter.syncTrades();
        results[connectionId] = result;
      } catch (error) {
        results[connectionId] = {
          success: false,
          imported: 0,
          updated: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          lastSyncTime: new Date()
        };
      }
    }
    
    return results;
  }
  
  async syncTrades(connectionId: string): Promise<SyncResult> {
    const adapter = this.adapters.get(connectionId);
    if (!adapter) {
      throw new Error(`Adapter for ${connectionId} not found`);
    }
    
    return await adapter.syncTrades();
  }
  
  getConnections(): BrokerConnection[] {
    return Array.from(this.connections.values());
  }
  
  getConnection(connectionId: string): BrokerConnection | undefined {
    return this.connections.get(connectionId);
  }
  
  getSupportedBrokers(): BrokerFormat[] {
    return SUPPORTED_BROKERS;
  }
  
  private createAdapter(connection: BrokerConnection): BrokerAdapter {
    switch (connection.name.toLowerCase()) {
      case 'zerodha':
        return new ZerodhaAdapter(connection);
      case 'icicidirect':
        return new ICICIDirectAdapter(connection);
      case 'upstox':
        return new UpstoxAdapter(connection);
      case 'angel one':
        return new AngelOneAdapter(connection);
      case 'groww':
        return new GrowwAdapter(connection);
      case '5paisa':
        return new FivePaisaAdapter(connection);
      case 'interactive brokers':
        return new InteractiveBrokersAdapter(connection);
      case 'tradingview':
        return new TradingViewAdapter(connection);
      case 'motilal oswal':
        return new MotilalOswalAdapter(connection);
      case 'sharekhan':
        return new SharekhanAdapter(connection);
      default:
        throw new Error(`Unsupported broker: ${connection.name}`);
    }
  }
}

// Export singleton instance
export const brokerIntegrationService = new BrokerIntegrationService();









