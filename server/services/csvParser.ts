import { Trade, InsertTrade } from "@shared/schema";

export interface ParsedTradeData {
  symbol: string;
  type: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryDate: Date;
  exitDate?: Date;
  pnl?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  strategy?: string;
}

export interface BrokerFormat {
  name: string;
  description: string;
  headerMappings: Record<string, string[]>;
  dateFormat?: string;
  delimiter?: string;
  quoteCharacter?: string;
}

export const SUPPORTED_BROKERS: BrokerFormat[] = [
  {
    name: 'Generic',
    description: 'Standard CSV format with common column names',
    headerMappings: {
      symbol: ['symbol', 'ticker', 'stock', 'instrument'],
      type: ['type', 'side', 'action', 'buy/sell'],
      quantity: ['quantity', 'qty', 'shares', 'size'],
      entryPrice: ['entry price', 'entry_price', 'buy price', 'open price', 'price'],
      exitPrice: ['exit price', 'exit_price', 'sell price', 'close price'],
      entryDate: ['entry date', 'entry_date', 'open date', 'date', 'timestamp'],
      exitDate: ['exit date', 'exit_date', 'close date', 'sell date'],
      pnl: ['pnl', 'p&l', 'profit/loss', 'profit_loss', 'net'],
      stopLoss: ['stop loss', 'stop_loss', 'sl'],
      takeProfit: ['take profit', 'take_profit', 'tp'],
      notes: ['notes', 'comment', 'description'],
      strategy: ['strategy', 'setup', 'plan']
    }
  },
  {
    name: 'Zerodha',
    description: 'Zerodha (Indian broker) trade book format',
    headerMappings: {
      symbol: ['symbol', 'instrument', 'tradingsymbol', 'exchange:instrument'],
      type: ['type', 'transaction type', 'buy/sell', 'action'],
      quantity: ['quantity', 'qty', 'quantity (lots)'],
      entryPrice: ['average price', 'price', 'avg. price', 'trade price'],
      exitPrice: ['exit price', 'sell price', 'close price'],
      entryDate: ['order date', 'date', 'trade date', 'order execution time'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['p&l', 'profit/loss', 'realised profit & loss', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss price'],
      takeProfit: ['target', 'take profit', 'take profit price'],
      notes: ['remarks', 'notes', 'trade remarks'],
      strategy: ['strategy', 'trade type']
    },
    dateFormat: 'DD-MM-YYYY',
    delimiter: ','
  },
  {
    name: 'Angel One',
    description: 'Angel One (Angel Broking) trade book format',
    headerMappings: {
      symbol: ['symbol', 'scrip name', 'instrument', 'trading symbol'],
      type: ['type', 'buy/sell', 'transaction type', 'action'],
      quantity: ['quantity', 'qty', 'no. of shares', 'shares'],
      entryPrice: ['rate', 'price', 'entry rate', 'trade rate'],
      exitPrice: ['exit rate', 'sell rate', 'close rate'],
      entryDate: ['date', 'trade date', 'order date', 'execution date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['profit/loss', 'p&l', 'net profit/loss', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss trigger'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['remarks', 'notes', 'trade remarks'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'DD/MM/YYYY',
    delimiter: ','
  },
  {
    name: 'ICICIDirect',
    description: 'ICICIDirect (Indian broker) format',
    headerMappings: {
      symbol: ['symbol', 'scrip name', 'instrument', 'stock name'],
      type: ['type', 'buy/sell', 'transaction', 'action'],
      quantity: ['quantity', 'qty', 'no. of shares', 'shares traded'],
      entryPrice: ['rate', 'price', 'entry rate', 'trade price'],
      exitPrice: ['exit rate', 'sell rate', 'close price'],
      entryDate: ['date', 'trade date', 'order date', 'transaction date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['profit/loss', 'p&l', 'net profit/loss', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss price'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['remarks', 'notes', 'trade remarks'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'DD/MM/YYYY',
    delimiter: ','
  },
  {
    name: 'Upstox',
    description: 'Upstox (Indian broker) format',
    headerMappings: {
      symbol: ['symbol', 'instrument', 'trading symbol', 'scrip'],
      type: ['side', 'type', 'buy/sell', 'action'],
      quantity: ['quantity', 'qty', 'shares', 'size'],
      entryPrice: ['price', 'average price', 'entry price', 'trade price'],
      exitPrice: ['exit price', 'sell price', 'close price'],
      entryDate: ['date', 'trade date', 'order date', 'execution date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['p&l', 'profit/loss', 'realised pnl', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss price'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['notes', 'remarks', 'trade notes'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'YYYY-MM-DD',
    delimiter: ','
  },
  {
    name: 'Groww',
    description: 'Groww (Indian broker) format',
    headerMappings: {
      symbol: ['symbol', 'stock', 'company', 'instrument'],
      type: ['type', 'buy/sell', 'transaction type', 'action'],
      quantity: ['quantity', 'qty', 'shares', 'units'],
      entryPrice: ['price', 'avg. price', 'entry price', 'trade price'],
      exitPrice: ['exit price', 'sell price', 'close price'],
      entryDate: ['date', 'trade date', 'order date', 'transaction date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['p&l', 'profit/loss', 'realized profit', 'net profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss price'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['notes', 'remarks', 'trade notes'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'YYYY-MM-DD',
    delimiter: ','
  },
  {
    name: '5Paisa',
    description: '5Paisa (Indian broker) format',
    headerMappings: {
      symbol: ['symbol', 'scrip name', 'instrument', 'trading symbol'],
      type: ['type', 'buy/sell', 'transaction type', 'action'],
      quantity: ['quantity', 'qty', 'no. of shares', 'shares'],
      entryPrice: ['rate', 'price', 'entry rate', 'trade price'],
      exitPrice: ['exit rate', 'sell rate', 'close price'],
      entryDate: ['date', 'trade date', 'order date', 'execution date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['profit/loss', 'p&l', 'net profit/loss', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss trigger'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['remarks', 'notes', 'trade remarks'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'DD-MM-YYYY',
    delimiter: ','
  },
  {
    name: 'Interactive Brokers',
    description: 'Interactive Brokers (IBKR) format',
    headerMappings: {
      symbol: ['symbol', 'asset category', 'description', 'underlying symbol'],
      type: ['side', 'buy/sell', 'action', 'transaction type'],
      quantity: ['quantity', 'qty', 'shares', 'size'],
      entryPrice: ['price', 'trade price', 'average price', 'execution price'],
      exitPrice: ['exit price', 'close price', 'sell price'],
      entryDate: ['date/time', 'trade date', 'date', 'execution time'],
      exitDate: ['exit date', 'close date', 'sell date'],
      pnl: ['p&l', 'profit/loss', 'realized p/l', 'net profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss price'],
      takeProfit: ['take profit', 'tp', 'target price'],
      notes: ['notes', 'comments', 'trade notes'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    delimiter: ','
  },
  {
    name: 'TradingView',
    description: 'TradingView exported trades format',
    headerMappings: {
      symbol: ['symbol', 'ticker', 'instrument'],
      type: ['type', 'side', 'action', 'buy/sell'],
      quantity: ['quantity', 'qty', 'size', 'shares'],
      entryPrice: ['entry price', 'entry', 'open price', 'trade price'],
      exitPrice: ['exit price', 'exit', 'close price', 'sell price'],
      entryDate: ['entry time', 'entry date', 'open time', 'trade time'],
      exitDate: ['exit time', 'exit date', 'close time', 'sell time'],
      pnl: ['profit', 'p&l', 'profit/loss', 'net profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss price'],
      takeProfit: ['take profit', 'tp', 'target', 'target price'],
      notes: ['notes', 'comment', 'trade notes'],
      strategy: ['strategy', 'setup', 'trade strategy']
    },
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    delimiter: ','
  },
  {
    name: 'Motilal Oswal',
    description: 'Motilal Oswal (Indian broker) format',
    headerMappings: {
      symbol: ['symbol', 'scrip name', 'instrument', 'trading symbol'],
      type: ['type', 'buy/sell', 'transaction type', 'action'],
      quantity: ['quantity', 'qty', 'no. of shares', 'shares'],
      entryPrice: ['rate', 'price', 'entry rate', 'trade price'],
      exitPrice: ['exit rate', 'sell rate', 'close price'],
      entryDate: ['date', 'trade date', 'order date', 'execution date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['profit/loss', 'p&l', 'net profit/loss', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss trigger'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['remarks', 'notes', 'trade remarks'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'DD-MM-YYYY',
    delimiter: ','
  },
  {
    name: 'Sharekhan',
    description: 'Sharekhan (Indian broker) format',
    headerMappings: {
      symbol: ['symbol', 'scrip name', 'instrument', 'trading symbol'],
      type: ['type', 'buy/sell', 'transaction type', 'action'],
      quantity: ['quantity', 'qty', 'no. of shares', 'shares'],
      entryPrice: ['rate', 'price', 'entry rate', 'trade price'],
      exitPrice: ['exit rate', 'sell rate', 'close price'],
      entryDate: ['date', 'trade date', 'order date', 'execution date'],
      exitDate: ['exit date', 'sell date', 'close date'],
      pnl: ['profit/loss', 'p&l', 'net profit/loss', 'realized profit'],
      stopLoss: ['stop loss', 'sl', 'stop loss trigger'],
      takeProfit: ['target', 'take profit', 'target price'],
      notes: ['remarks', 'notes', 'trade remarks'],
      strategy: ['strategy', 'trade strategy']
    },
    dateFormat: 'DD-MM-YYYY',
    delimiter: ','
  }
];

/**
 * Detect broker format from CSV headers
 */
export function detectBrokerFormat(headers: string[]): BrokerFormat {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  
  // Score each broker format based on header matches
  const scores = SUPPORTED_BROKERS.map(broker => {
    let score = 0;
    Object.values(broker.headerMappings).forEach(mapping => {
      if (mapping.some(header => normalizedHeaders.includes(header))) {
        score++;
      }
    });
    return { broker, score };
  });
  
  // Return broker with highest score, default to Generic
  const bestMatch = scores.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  return bestMatch.broker;
}

/**
 * Parse date based on broker format
 */
function parseDate(dateStr: string, dateFormat?: string): Date {
  if (!dateStr) return new Date();
  
  // Try parsing as ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Handle different date formats based on broker
  if (dateFormat) {
    const cleanDateStr = dateStr.replace(/["']/g, '').trim();
    
    switch (dateFormat) {
      case 'DD-MM-YYYY':
      case 'DD/MM/YYYY':
        const parts = cleanDateStr.split(/[-\/]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) return date;
        }
        break;
      case 'YYYY-MM-DD':
        const ymdParts = cleanDateStr.split(/[-\/]/);
        if (ymdParts.length === 3) {
          const year = parseInt(ymdParts[0]);
          const month = parseInt(ymdParts[1]) - 1;
          const day = parseInt(ymdParts[2]);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) return date;
        }
        break;
      case 'YYYY-MM-DD HH:mm:ss':
        const datetimeParts = cleanDateStr.split(' ');
        if (datetimeParts.length === 2) {
          const datePart = datetimeParts[0];
          const timePart = datetimeParts[1];
          const dateParts = datePart.split(/[-\/]/);
          const timeParts = timePart.split(':');
          
          if (dateParts.length === 3 && timeParts.length === 3) {
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const day = parseInt(dateParts[2]);
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            const second = parseInt(timeParts[2]);
            
            const date = new Date(year, month, day, hour, minute, second);
            if (!isNaN(date.getTime())) return date;
          }
        }
        break;
    }
  }
  
  // Fallback to standard date parsing
  const fallbackDate = new Date(dateStr);
  if (isNaN(fallbackDate.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  
  return fallbackDate;
}

/**
 * Parse CSV content and convert to trade data
 * Enhanced version with multi-broker support
 */
export function parseCSVTrades(csvContent: string, userId: string, brokerFormat?: string): InsertTrade[] {
  // Detect delimiter (comma, semicolon, or tab)
  const delimiter = detectDelimiter(csvContent);
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain header row and at least one data row');
  }

  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter);
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  
  // Detect broker format
  const broker = brokerFormat 
    ? SUPPORTED_BROKERS.find(b => b.name.toLowerCase() === brokerFormat.toLowerCase()) || SUPPORTED_BROKERS[0]
    : detectBrokerFormat(normalizedHeaders);
  
  console.log(`Detected broker format: ${broker.name}`);
  
  const trades: InsertTrade[] = [];
  const errors: string[] = [];

  // Find column indices
  const columnIndices: Record<string, number> = {};
  Object.keys(broker.headerMappings).forEach(field => {
    const possibleHeaders = broker.headerMappings[field];
    const index = normalizedHeaders.findIndex(h => possibleHeaders.includes(h));
    if (index !== -1) {
      columnIndices[field] = index;
    }
  });

  // Validate required columns
  const requiredColumns = ['symbol', 'type', 'quantity', 'entryPrice', 'entryDate'];
  const missingColumns = requiredColumns.filter(col => columnIndices[col] === undefined);
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Available columns: ${headers.join(', ')}`);
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line, delimiter);
      
      if (values.length < headers.length) {
        errors.push(`Row ${i + 1}: Has fewer columns than expected`);
        continue;
      }

      const trade = parseTradeRow(values, columnIndices, userId, broker.dateFormat);
      if (trade) {
        trades.push(trade);
      }
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      continue;
    }
  }

  if (trades.length === 0) {
    throw new Error(`No valid trades found in CSV file. Errors: ${errors.join('; ')}`);
  }

  // Log warnings for rows that couldn't be parsed
  if (errors.length > 0) {
    console.warn(`CSV parsing completed with ${errors.length} warnings:`, errors);
  }

  return trades;
}

/**
 * Detect CSV delimiter
 */
function detectDelimiter(csvContent: string): string {
  const firstLine = csvContent.split('\n')[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  
  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  if (tabCount > commaCount) return '\t';
  return ',';
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Parse a single trade row
 */
function parseTradeRow(
  values: string[], 
  columnIndices: Record<string, number>, 
  userId: string, 
  dateFormat?: string
): InsertTrade | null {
  try {
    // Symbol
    const symbol = values[columnIndices.symbol]?.toUpperCase().trim();
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    // Type
    const typeValue = values[columnIndices.type]?.toLowerCase().trim();
    const type: 'long' | 'short' = 
      typeValue === 'sell' || typeValue === 'short' || typeValue === 's' ? 'short' : 'long';

    // Quantity
    const quantity = parseInt(values[columnIndices.quantity]?.replace(/[^0-9.-]/g, '') || '0');
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Entry Price
    const entryPrice = parseFloat(values[columnIndices.entryPrice]?.replace(/[^0-9.-]/g, '') || '0');
    if (entryPrice <= 0) {
      throw new Error('Entry price must be positive');
    }

    // Entry Date
    const entryDateStr = values[columnIndices.entryDate]?.trim();
    const entryDate = parseDate(entryDateStr, dateFormat);
    if (isNaN(entryDate.getTime())) {
      throw new Error(`Invalid entry date: ${entryDateStr}`);
    }

    const trade: InsertTrade = {
      userId,
      symbol,
      type,
      quantity,
      entryPrice: entryPrice.toString(),
      entryDate,
      status: 'open'
    };

    // Exit Price (optional)
    if (columnIndices.exitPrice !== undefined && values[columnIndices.exitPrice]) {
      const exitPrice = parseFloat(values[columnIndices.exitPrice]?.replace(/[^0-9.-]/g, '') || '0');
      if (exitPrice > 0) {
        trade.exitPrice = exitPrice.toString();
        trade.status = 'closed';
      }
    }

    // Exit Date (optional)
    if (columnIndices.exitDate !== undefined && values[columnIndices.exitDate]) {
      const exitDateStr = values[columnIndices.exitDate]?.trim();
      const exitDate = parseDate(exitDateStr, dateFormat);
      if (!isNaN(exitDate.getTime())) {
        trade.exitDate = exitDate;
      }
    }

    // P&L (optional)
    if (columnIndices.pnl !== undefined && values[columnIndices.pnl]) {
      const pnlStr = values[columnIndices.pnl]?.replace(/[^0-9.-]/g, '') || '0';
      const pnl = parseFloat(pnlStr);
      if (!isNaN(pnl)) {
        trade.pnl = pnl.toString();
      }
    }

    // Stop Loss (optional)
    if (columnIndices.stopLoss !== undefined && values[columnIndices.stopLoss]) {
      const stopLoss = parseFloat(values[columnIndices.stopLoss]?.replace(/[^0-9.-]/g, '') || '0');
      if (stopLoss > 0) {
        trade.stopLoss = stopLoss.toString();
      }
    }

    // Take Profit (optional)
    if (columnIndices.takeProfit !== undefined && values[columnIndices.takeProfit]) {
      const takeProfit = parseFloat(values[columnIndices.takeProfit]?.replace(/[^0-9.-]/g, '') || '0');
      if (takeProfit > 0) {
        trade.takeProfit = takeProfit.toString();
      }
    }

    // Notes (optional)
    if (columnIndices.notes !== undefined && values[columnIndices.notes]) {
      trade.notes = values[columnIndices.notes].trim();
    }

    // Strategy (optional)
    if (columnIndices.strategy !== undefined && values[columnIndices.strategy]) {
      trade.strategy = values[columnIndices.strategy].trim();
    }

    return trade;
  } catch (error) {
    throw error;
  }
}

/**
 * Generate a sample CSV template for users
 */
export function generateCSVTemplate(brokerFormat: string = 'Generic'): string {
  const broker = SUPPORTED_BROKERS.find(b => b.name.toLowerCase() === brokerFormat.toLowerCase()) || SUPPORTED_BROKERS[0];
  
  // Use the first mapping for each field as the header
  const headers = Object.entries(broker.headerMappings).map(([field, mappings]) => {
    return mappings[0].split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  });

  const sampleRows = [
    ['AAPL', 'Long', '100', '175.50', '178.20', '2023-12-15', '2023-12-15', '270.00', '170.00', '180.00', 'Breakout trade', 'Momentum'],
    ['TSLA', 'Short', '50', '248.00', '245.30', '2023-12-14', '2023-12-14', '135.00', '252.00', '240.00', 'Reversal setup', 'Mean Reversion'],
    ['MSFT', 'Long', '75', '368.50', '', '2023-12-16', '', '', '360.00', '380.00', 'Still holding', 'Support bounce']
  ];

  return [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
}

/**
 * Get list of supported broker formats
 */
export function getSupportedBrokers(): BrokerFormat[] {
  return SUPPORTED_BROKERS;
}

/**
 * Validate CSV structure before parsing
 */
export function validateCSVStructure(csvContent: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      errors.push('CSV must contain at least one header row and one data row');
      return { isValid: false, errors };
    }
    
    const delimiter = detectDelimiter(csvContent);
    const headers = parseCSVLine(lines[0], delimiter);
    
    if (headers.length < 3) {
      errors.push('CSV must have at least 3 columns');
    }
    
    // Check if we can detect a broker format
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const broker = detectBrokerFormat(normalizedHeaders);
    
    if (broker.name === 'Generic') {
      errors.push('Could not detect specific broker format, using generic parser');
    }
    
    // Sample a few data rows
    const sampleRows = lines.slice(1, Math.min(4, lines.length));
    for (let i = 0; i < sampleRows.length; i++) {
      const values = parseCSVLine(sampleRows[i], delimiter);
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 2}: Column count mismatch`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
    
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors };
  }
}
