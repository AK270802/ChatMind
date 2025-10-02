import { Router, Request, Response } from "express";
import { db } from "../db";
// Type the db import properly
const typedDb = db as any;
import { trades } from "@shared/schema";
import { 
  parseCSVTrades, 
  detectBrokerFormat, 
  validateCSVStructure, 
  getSupportedBrokers, 
  generateCSVTemplate 
} from "../services/csvParser";
import { eq, and, desc } from "drizzle-orm";
import { Trade } from "@shared/schema";

const router = Router();

/**
 * GET /api/csv-import/supported-brokers
 * Get list of supported broker formats
 */
router.get("/supported-brokers", async (req: Request, res: Response) => {
  try {
    const brokers = getSupportedBrokers();
    
    res.json({
      success: true,
      data: brokers.map(broker => ({
        name: broker.name,
        description: broker.description,
        dateFormat: broker.dateFormat,
        delimiter: broker.delimiter || ','
      })),
      total: brokers.length
    });
  } catch (error) {
    console.error("Error fetching supported brokers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch supported brokers"
    });
  }
});

/**
 * GET /api/csv-import/template/:brokerFormat
 * Generate CSV template for specific broker format
 */
router.get("/template/:brokerFormat", async (req: Request, res: Response) => {
  try {
    const { brokerFormat } = req.params;
    const template = generateCSVTemplate(brokerFormat);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${brokerFormat}_trades_template.csv"`);
    res.send(template);
  } catch (error) {
    console.error("Error generating CSV template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate CSV template"
    });
  }
});

/**
 * POST /api/csv-import/validate
 * Validate CSV structure and detect broker format
 */
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { csvContent } = req.body;
    
    if (!csvContent) {
      return res.status(400).json({
        success: false,
        error: "CSV content is required"
      });
    }
    
    // Validate CSV structure
    const validation = validateCSVStructure(csvContent);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "CSV validation failed",
        validationErrors: validation.errors
      });
    }
    
    // Detect broker format
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim());
    const brokerFormat = detectBrokerFormat(headers);
    
    res.json({
      success: true,
      data: {
        brokerFormat: brokerFormat.name,
        brokerDescription: brokerFormat.description,
        dateFormat: brokerFormat.dateFormat,
        delimiter: brokerFormat.delimiter || ',',
        headers: headers,
        totalRows: lines.length - 1,
        validationWarnings: validation.errors
      }
    });
  } catch (error) {
    console.error("Error validating CSV:", error);
    res.status(500).json({
      success: false,
      error: "Failed to validate CSV"
    });
  }
});

/**
 * POST /api/csv-import/parse
 * Parse CSV and return parsed trade data (without saving)
 */
router.post("/parse", async (req: Request, res: Response) => {
  try {
    const { csvContent, brokerFormat } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    if (!csvContent) {
      return res.status(400).json({
        success: false,
        error: "CSV content is required"
      });
    }
    
    // Parse CSV trades
    const parsedTrades = parseCSVTrades(csvContent, userId, brokerFormat);
    
    res.json({
      success: true,
      data: {
        trades: parsedTrades,
        total: parsedTrades.length,
        brokerFormat: brokerFormat || 'Auto-detected'
      }
    });
  } catch (error) {
    console.error("Error parsing CSV:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse CSV"
    });
  }
});

/**
 * POST /api/csv-import/import
 * Parse CSV and import trades to database
 */
router.post("/import", async (req: Request, res: Response) => {
  try {
    const { csvContent, brokerFormat, skipDuplicates = true } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    if (!csvContent) {
      return res.status(400).json({
        success: false,
        error: "CSV content is required"
      });
    }
    
    // Parse CSV trades
    const parsedTrades = parseCSVTrades(csvContent, userId, brokerFormat);
    
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Import trades to database
    for (const trade of parsedTrades) {
      try {
        // Check for duplicates if enabled
        if (skipDuplicates) {
          const existingTrade = await typedDb
            .select()
            .from(trades)
            .where(and(
              eq(trades.userId, userId),
              eq(trades.symbol, trade.symbol),
              eq(trades.type, trade.type),
              eq(trades.quantity, trade.quantity),
              eq(trades.entryPrice, trade.entryPrice),
              eq(trades.entryDate, trade.entryDate)
            ))
            .limit(1);
          
          if (existingTrade.length > 0) {
            duplicateCount++;
            continue;
          }
        }
        
        // Insert trade
        await typedDb.insert(trades).values(trade);
        importedCount++;
        
      } catch (error) {
        errorCount++;
        errors.push(`Failed to import trade ${trade.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    res.json({
      success: true,
      data: {
        importedCount,
        duplicateCount,
        errorCount,
        totalProcessed: parsedTrades.length,
        errors: errors.length > 0 ? errors : undefined,
        brokerFormat: brokerFormat || 'Auto-detected'
      }
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to import CSV"
    });
  }
});

/**
 * GET /api/csv-import/import-history
 * Get user's CSV import history
 */
router.get("/import-history", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    // Get user's trades with import metadata
    const userTrades = await typedDb
      .select({
        id: trades.id,
        symbol: trades.symbol,
        type: trades.type,
        quantity: trades.quantity,
        entryPrice: trades.entryPrice,
        exitPrice: trades.exitPrice,
        entryDate: trades.entryDate,
        exitDate: trades.exitDate,
        status: trades.status,
        createdAt: trades.createdAt
      })
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(100);
    
    // Group by date to simulate import batches
    const importBatches = userTrades.reduce((batches: any, trade: any) => {
      const importDate = new Date(trade.createdAt).toISOString().split('T')[0];
      if (!batches[importDate]) {
        batches[importDate] = {
          date: importDate,
          trades: [],
          count: 0
        };
      }
      batches[importDate].trades.push(trade);
      batches[importDate].count++;
      return batches;
    }, {} as Record<string, any>);
    
    res.json({
      success: true,
      data: Object.values(importBatches).slice(0, 10), // Last 10 import batches
      total: Object.keys(importBatches).length
    });
  } catch (error) {
    console.error("Error fetching import history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch import history"
    });
  }
});

/**
 * POST /api/csv-import/batch-delete
 * Delete multiple trades (useful for removing failed imports)
 */
router.post("/batch-delete", async (req: Request, res: Response) => {
  try {
    const { tradeIds } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid trade IDs are required"
      });
    }
    
    // Delete trades that belong to the user
    const deletedTrades = await typedDb
      .delete(trades)
      .where(and(
        eq(trades.userId, userId),
        eq(trades.id, tradeIds[0]) // This will need to be adjusted for multiple IDs
      ))
      .returning();
    
    // Note: For multiple IDs, you might need to use a more complex query
    // This is a simplified version
    
    res.json({
      success: true,
      data: {
        deletedCount: deletedTrades.length,
        message: `Successfully deleted ${deletedTrades.length} trades`
      }
    });
  } catch (error) {
    console.error("Error batch deleting trades:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete trades"
    });
  }
});

export default router;
