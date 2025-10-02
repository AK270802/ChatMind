import { CSVParserService } from '../../services/csvParser';
import { InsertTrade } from '../../shared/schema';

describe('CSVParserService', () => {
  let csvParserService: CSVParserService;

  beforeEach(() => {
    csvParserService = new CSVParserService();
  });

  describe('Zerodha Format Parsing', () => {
    it('should parse Zerodha CSV format correctly', () => {
      const csvData = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price,Order ID,Trade ID
2024-01-01,AAPL,NSE,EQUITY,Buy,100,150.00,ORD001,TRD001
2024-01-02,AAPL,NSE,EQUITY,Sell,100,160.00,ORD002,TRD002`;

      const result = csvParserService.parseZerodhaCSV(csvData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'short',
          quantity: 100,
          entryPrice: 160.00,
          entryDate: '2024-01-02',
          status: 'closed'
        })
      );
    });

    it('should handle Zerodha CSV with missing fields', () => {
      const csvData = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price
2024-01-01,AAPL,NSE,EQUITY,Buy,100,150.00`;

      const result = csvParserService.parseZerodhaCSV(csvData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01'
        })
      );
    });

    it('should reject invalid Zerodha CSV format', () => {
      const csvData = `Invalid,CSV,Format
Data,Here,Test`;

      const result = csvParserService.parseZerodhaCSV(csvData);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('ICICI Direct Format Parsing', () => {
    it('should parse ICICI Direct CSV format correctly', () => {
      const csvData = `Date,Symbol,Exchange,Type,Quantity,Price,Amount,Status
01-Jan-2024,AAPL,NSE,Buy,100,150.00,15000.00,Completed
02-Jan-2024,AAPL,NSE,Sell,100,160.00,16000.00,Completed`;

      const result = csvParserService.parseICICICSV(csvData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'short',
          quantity: 100,
          entryPrice: 160.00,
          entryDate: '2024-01-02',
          status: 'closed'
        })
      );
    });

    it('should handle ICICI Direct date format conversion', () => {
      const csvData = `Date,Symbol,Exchange,Type,Quantity,Price,Amount,Status
15-Feb-2024,GOOGL,NSE,Buy,50,2500.00,125000.00,Completed`;

      const result = csvParserService.parseICICICSV(csvData);
      
      expect(result[0].entryDate).toBe('2024-02-15');
    });

    it('should reject invalid ICICI Direct CSV format', () => {
      const csvData = `Wrong,Format,Here
Test,Data,Invalid`;

      const result = csvParserService.parseICICICSV(csvData);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Upstox Format Parsing', () => {
    it('should parse Upstox CSV format correctly', () => {
      const csvData = `timestamp,symbol,exchange,transaction_type,quantity,price,amount,status
2024-01-01 09:15:00,AAPL,NSE,BUY,100,150.00,15000.00,COMPLETE
2024-01-02 09:16:00,AAPL,NSE,SELL,100,160.00,16000.00,COMPLETE`;

      const result = csvParserService.parseUpstoxCSV(csvData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'short',
          quantity: 100,
          entryPrice: 160.00,
          entryDate: '2024-01-02',
          status: 'closed'
        })
      );
    });

    it('should handle Upstox timestamp format', () => {
      const csvData = `timestamp,symbol,exchange,transaction_type,quantity,price,amount,status
2024-01-01 14:30:00,TSLA,NSE,BUY,200,800.00,160000.00,COMPLETE`;

      const result = csvParserService.parseUpstoxCSV(csvData);
      
      expect(result[0].entryDate).toBe('2024-01-01');
    });

    it('should reject invalid Upstox CSV format', () => {
      const csvData = `invalid,csv,format
test,data,here`;

      const result = csvParserService.parseUpstoxCSV(csvData);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Interactive Brokers Format Parsing', () => {
    it('should parse Interactive Brokers CSV format correctly', () => {
      const csvData = `Date,Time,Symbol,Exchange,Action,Quantity,Price,Amount,Status
20240101,091500,AAPL,NASDAQ,BUY,100,150.00,15000.00,FILLED
20240102,091600,AAPL,NASDAQ,SELL,100,160.00,16000.00,FILLED`;

      const result = csvParserService.parseInteractiveBrokersCSV(csvData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'closed'
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          type: 'short',
          quantity: 100,
          entryPrice: 160.00,
          entryDate: '2024-01-02',
          status: 'closed'
        })
      );
    });

    it('should handle Interactive Brokers date-time format', () => {
      const csvData = `Date,Time,Symbol,Exchange,Action,Quantity,Price,Amount,Status
20240215,143000,GOOGL,NASDAQ,BUY,50,2500.00,125000.00,FILLED`;

      const result = csvParserService.parseInteractiveBrokersCSV(csvData);
      
      expect(result[0].entryDate).toBe('2024-02-15');
    });

    it('should reject invalid Interactive Brokers CSV format', () => {
      const csvData = `wrong,format,here
test,data,invalid`;

      const result = csvParserService.parseInteractiveBrokersCSV(csvData);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Generic CSV Parsing', () => {
    it('should detect and parse Zerodha format automatically', () => {
      const csvData = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price
2024-01-01,AAPL,NSE,EQUITY,Buy,100,150.00`;

      const result = csvParserService.parseCSV(csvData, 'zerodha');
      
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].type).toBe('long');
    });

    it('should detect and parse ICICI Direct format automatically', () => {
      const csvData = `Date,Symbol,Exchange,Type,Quantity,Price
01-Jan-2024,AAPL,NSE,Buy,100,150.00`;

      const result = csvParserService.parseCSV(csvData, 'icicidirect');
      
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].type).toBe('long');
    });

    it('should detect and parse Upstox format automatically', () => {
      const csvData = `timestamp,symbol,exchange,transaction_type,quantity,price
2024-01-01 09:15:00,AAPL,NSE,BUY,100,150.00`;

      const result = csvParserService.parseCSV(csvData, 'upstox');
      
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].type).toBe('long');
    });

    it('should detect and parse Interactive Brokers format automatically', () => {
      const csvData = `Date,Time,Symbol,Exchange,Action,Quantity,Price
20240101,091500,AAPL,NASDAQ,BUY,100,150.00`;

      const result = csvParserService.parseCSV(csvData, 'interactive_brokers');
      
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[0].type).toBe('long');
    });

    it('should handle unknown broker format', () => {
      const csvData = `some,random,csv,format
data,here,test`;

      const result = csvParserService.parseCSV(csvData, 'unknown');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const invalidTrade: Partial<InsertTrade> = {
        symbol: '',
        quantity: 0,
        entryPrice: 0
      };

      const isValid = csvParserService.validateTrade(invalidTrade);
      
      expect(isValid).toBe(false);
    });

    it('should validate positive quantities', () => {
      const invalidTrade: Partial<InsertTrade> = {
        symbol: 'AAPL',
        quantity: -100,
        entryPrice: 150.00
      };

      const isValid = csvParserService.validateTrade(invalidTrade);
      
      expect(isValid).toBe(false);
    });

    it('should validate positive prices', () => {
      const invalidTrade: Partial<InsertTrade> = {
        symbol: 'AAPL',
        quantity: 100,
        entryPrice: -150.00
      };

      const isValid = csvParserService.validateTrade(invalidTrade);
      
      expect(isValid).toBe(false);
    });

    it('should validate valid trade data', () => {
      const validTrade: Partial<InsertTrade> = {
        symbol: 'AAPL',
        type: 'long',
        quantity: 100,
        entryPrice: 150.00,
        entryDate: '2024-01-01'
      };

      const isValid = csvParserService.validateTrade(validTrade);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty CSV data', () => {
      const result = csvParserService.parseCSV('', 'zerodha');
      
      expect(result).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const csvData = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price`;

      const result = csvParserService.parseCSV(csvData, 'zerodha');
      
      expect(result).toHaveLength(0);
    });

    it('should handle malformed CSV data', () => {
      const csvData = `invalid,csv,data,with,wrong,number,of,columns,here,extra,data
2024-01-01,AAPL,NSE,EQUITY,Buy,100`;

      const result = csvParserService.parseCSV(csvData, 'zerodha');
      
      expect(result).toHaveLength(0);
    });

    it('should handle CSV with invalid numeric data', () => {
      const csvData = `Trade Date,Symbol,Exchange,Segment,Trade Type,Quantity,Price
2024-01-01,AAPL,NSE,EQUITY,Buy,invalid,invalid_price`;

      const result = csvParserService.parseCSV(csvData, 'zerodha');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Trade Matching', () => {
    it('should match buy and sell trades for same symbol', () => {
      const trades = [
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

      const matchedTrades = csvParserService.matchTrades(trades);
      
      expect(matchedTrades).toHaveLength(1);
      expect(matchedTrades[0]).toEqual(
        expect.objectContaining({
          symbol: 'AAPL',
          entryPrice: 150.00,
          exitPrice: 160.00,
          pnl: 1000
        })
      );
    });

    it('should handle unmatched trades', () => {
      const trades = [
        {
          symbol: 'AAPL',
          type: 'long',
          quantity: 100,
          entryPrice: 150.00,
          entryDate: '2024-01-01',
          status: 'open'
        }
      ];

      const matchedTrades = csvParserService.matchTrades(trades);
      
      expect(matchedTrades).toHaveLength(1);
      expect(matchedTrades[0].status).toBe('open');
    });
  });
});
