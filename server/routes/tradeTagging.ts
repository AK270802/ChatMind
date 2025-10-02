import { Router, Request, Response } from "express";
// @ts-ignore - db is implicitly typed from db.ts
import { db } from "../db";

// Type the db import explicitly to resolve type errors
// @ts-ignore - db is implicitly typed from db.ts
const typedDb = db as any;
import { trades } from "@shared/schema";
import { tradeTaggingService, TradeTaggingResult } from "../services/tradeTagging";
import { eq, and, desc } from "drizzle-orm";
import { Trade } from "@shared/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";

type DatabaseType = PostgresJsDatabase<typeof schema>;

const router = Router();

/**
 * GET /api/trade-tagging/tags
 * Get all available trade tags
 */
router.get("/tags", async (req: Request, res: Response) => {
  try {
    const { category, type, query } = req.query;
    
    let tags;
    
    if (query) {
      tags = tradeTaggingService.searchTags(query as string);
    } else if (category) {
      tags = tradeTaggingService.getTagsByCategory(category as string);
    } else if (type) {
      tags = tradeTaggingService.getTagsByType(type as string);
    } else {
      tags = tradeTaggingService.getTagsByCategory();
    }
    
    res.json({
      success: true,
      data: tags,
      total: tags.length
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tags"
    });
  }
});

/**
 * POST /api/trade-tagging/analyze/:tradeId
 * Analyze a specific trade and suggest tags
 */
router.post("/analyze/:tradeId", async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    // Fetch the trade
    const trade = await typedDb
      .select()
      .from(trades)
      .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
      .limit(1);
    
    if (!trade.length) {
      return res.status(404).json({
        success: false,
        error: "Trade not found"
      });
    }
    
    // Get user context (recent trades for pattern analysis)
    const recentTrades = await typedDb
      .select()
      .where(and(eq(trades.userId, userId), eq(trades.status, 'closed')))
      .orderBy(desc(trades.exitDate))
      .limit(10);
    
    // Analyze the trade
    const result: TradeTaggingResult = await tradeTaggingService.analyzeTrade(
      trade[0],
      { recentTrades }
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error analyzing trade:", error);
    res.status(500).json({
      success: false,
    });
  }
});

/**
 * POST /api/trade-tagging/batch-analyze
 * Analyze multiple trades and suggest tags
 */
router.post("/batch-analyze", async (req: Request, res: Response) => {
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
        error: "Invalid trade IDs provided"
      });
    }
    
    // Fetch the trades
    const userTrades = await typedDb
      .select()
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, 'closed')));
    
    const tradesToAnalyze = userTrades.filter((trade: any) => tradeIds.includes(trade.id));
    
    if (tradesToAnalyze.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No valid trades found"
      });
    }
    
    // Get user context (recent trades for pattern analysis)
    const recentTrades = await typedDb
      .select()
      .from(trades)
      .orderBy(desc(trades.exitDate))
      .limit(20);
    
    // Analyze each trade
    const results: TradeTaggingResult[] = [];
    for (const trade of tradesToAnalyze as Trade[]) {
      const result = await tradeTaggingService.analyzeTrade(trade, { recentTrades });
      results.push(result);
    }
    
    res.json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (error) {
    console.error("Error in batch analysis:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze trades"
    });
  }
});
/**
 * GET /api/trade-tagging/stats
 * Get user's tagging statistics and insights
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }
    
    const userTrades = await typedDb.select({
      id: trades.id,
      symbol: trades.symbol,
      type: trades.type,
      quantity: trades.quantity,
      entryPrice: trades.entryPrice,
      exitPrice: trades.exitPrice,
      pnl: trades.pnl,
      status: trades.status,
      entryDate: trades.entryDate,
      exitDate: trades.exitDate,
      tags: trades.tags
    })
    .from(trades)
    .where(eq(trades.userId, userId));
    
    // Calculate statistics
    const stats = {
      totalTrades: userTrades.length,
      taggedTrades: 0,
      mostUsedTags: {} as Record<string, number>,
      avgTagsPerTrade: 0,
      tagDistribution: {} as Record<string, number>
    };
    
    // Count tag usage
    userTrades.forEach((trade: any) => {
      if (trade.tags && Array.isArray(trade.tags)) {
        stats.taggedTrades++;
        trade.tags.forEach((tag: any) => {
          const tagValue = typeof tag === 'string' ? tag : tag.value || tag;
          stats.mostUsedTags[tagValue] = (stats.mostUsedTags[tagValue] || 0) + 1;
        });
      }
    });
    
    // Get top tags
    const sortedTags = Object.entries(stats.mostUsedTags)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    stats.mostUsedTags = Object.fromEntries(sortedTags);
    
    // Calculate average tags per trade
    const totalTags = Object.values(stats.mostUsedTags).reduce((sum, count) => sum + count, 0);
    stats.avgTagsPerTrade = stats.taggedTrades > 0 ? totalTags / stats.taggedTrades : 0;
    
    // Tag distribution by type
    const allTags = tradeTaggingService.getTagsByCategory();
    allTags.forEach((tag: any) => {
      if (stats.mostUsedTags[tag.value]) {
        stats.tagDistribution[tag.type] = (stats.tagDistribution[tag.type] || 0) + stats.mostUsedTags[tag.value];
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error fetching tagging stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tagging statistics"
    });
  }
});

export default router;
