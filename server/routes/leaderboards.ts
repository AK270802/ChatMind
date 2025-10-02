import { Router, Request, Response } from "express";
// @ts-ignore - db is implicitly typed from db.ts
import { db } from "../db";

// Type the db import explicitly to resolve type errors
// @ts-ignore - db is implicitly typed from db.ts
const typedDb = db as any;
import { 
  users, 
  trades, 
  leaderboards, 
  leaderboardEntries, 
  userAchievements,
  userBadges,
  badges 
} from "@shared/schema";
import { LeaderboardEngine, LeaderboardFilter } from "../services/social/leaderboards/leaderboardEngine";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";

const router = Router();
const leaderboardEngine = new LeaderboardEngine();

// Simple authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Get all available leaderboards
router.get("/", async (req: Request, res: Response) => {
  try {
    const availableLeaderboards = await typedDb
      .select({
        id: leaderboards.id,
        name: leaderboards.name,
        description: leaderboards.description,
        type: leaderboards.type,
        timeframe: leaderboards.timeframe,
        isActive: leaderboards.isActive,
        criteria: leaderboards.criteria
      })
      .from(leaderboards)
      .where(eq(leaderboards.isActive, true));

    res.json({
      success: true,
      data: availableLeaderboards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get specific leaderboard with entries
router.get("/:leaderboardId", async (req: Request, res: Response) => {
  try {
    const { leaderboardId } = req.params;
    const { period = 'monthly', category = 'overall', page = 1, limit = 50 } = req.query;

    // Get leaderboard details
    const leaderboard = await typedDb
      .select()
      .from(leaderboards)
      .where(eq(leaderboards.id, leaderboardId))
      .limit(1);

    if (!leaderboard.length) {
      return res.status(404).json({
        success: false,
        error: "Leaderboard not found"
      });
    }

    // Get leaderboard entries with pagination
    const offset = (Number(page) - 1) * Number(limit);
    const entries = await typedDb
      .select({
        id: leaderboardEntries.id,
        rank: leaderboardEntries.rank,
        score: leaderboardEntries.score,
        metrics: leaderboardEntries.metrics,
        previousRank: leaderboardEntries.previousRank,
        change: leaderboardEntries.change,
        periodStart: leaderboardEntries.periodStart,
        periodEnd: leaderboardEntries.periodEnd,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(leaderboardEntries)
      .innerJoin(users, eq(leaderboardEntries.userId, users.id))
      .where(eq(leaderboardEntries.leaderboardId, leaderboardId))
      .orderBy(desc(leaderboardEntries.score))
      .limit(Number(limit))
      .offset(offset);

    // Get user's current rank if authenticated
    let userRank = null;
    if (req.isAuthenticated()) {
      const userEntry = await typedDb
        .select({
          rank: leaderboardEntries.rank,
          score: leaderboardEntries.score,
          change: leaderboardEntries.change
        })
        .from(leaderboardEntries)
        .where(and(
          eq(leaderboardEntries.leaderboardId, leaderboardId),
          eq(leaderboardEntries.userId, req.user!.id)
        ))
        .limit(1);

      if (userEntry.length) {
        userRank = userEntry[0];
      }
    }

    // Get total count for pagination
    const totalCount = await typedDb
      .select({ count: count() })
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.leaderboardId, leaderboardId));

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard[0],
        entries,
        userRank,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount[0].count,
          totalPages: Math.ceil(totalCount[0].count / Number(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get dynamic leaderboard using the leaderboard engine
router.get("/dynamic/:category", async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { period = 'monthly', minTrades = 10 } = req.query;

    const filter: LeaderboardFilter = {
      period: period as 'daily' | 'weekly' | 'monthly' | 'all-time',
      category: category as 'overall' | 'risk-adjusted' | 'improvement' | 'discipline',
      minTrades: Number(minTrades)
    };

    const entries = await leaderboardEngine.getLeaderboard(filter);

    // Get user's rank if authenticated
    let userRank = null;
    if (req.isAuthenticated()) {
      const userEntry = entries.find(entry => entry.userId === req.user!.id);
      if (userEntry) {
        userRank = {
          rank: userEntry.rank,
          score: userEntry.score,
          totalTrades: userEntry.totalTrades,
          winRate: userEntry.winRate,
          riskAdjustedScore: userEntry.riskAdjustedScore
        };
      }
    }

    res.json({
      success: true,
      data: {
        entries,
        userRank,
        filter
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get user's leaderboard history
router.get("/user/:userId/history", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { leaderboardId, limit = 10 } = req.query;

    let query = typedDb
      .select({
        id: leaderboardEntries.id,
        rank: leaderboardEntries.rank,
        score: leaderboardEntries.score,
        metrics: leaderboardEntries.metrics,
        previousRank: leaderboardEntries.previousRank,
        change: leaderboardEntries.change,
        periodStart: leaderboardEntries.periodStart,
        periodEnd: leaderboardEntries.periodEnd,
        leaderboard: {
          id: leaderboards.id,
          name: leaderboards.name,
          type: leaderboards.type
        }
      })
      .from(leaderboardEntries)
      .innerJoin(leaderboards, eq(leaderboardEntries.leaderboardId, leaderboards.id))
      .where(eq(leaderboardEntries.userId, userId))
      .orderBy(desc(leaderboardEntries.periodEnd))
      .limit(Number(limit));

    if (leaderboardId) {
      query = query.where(eq(leaderboardEntries.leaderboardId, leaderboardId as string));
    }

    const history = await query;

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Admin: Create new leaderboard
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    const { name, description, type, timeframe, criteria, resetSchedule } = req.body;

    const newLeaderboard = await typedDb
      .insert(leaderboards)
      .values({
        name,
        description,
        type,
        timeframe,
        criteria,
        resetSchedule,
        isActive: true
      })
      .returning();

    res.json({
      success: true,
      data: newLeaderboard[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Admin: Update leaderboard
router.put("/:leaderboardId", requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }

    const { leaderboardId } = req.params;
    const { name, description, isActive, criteria } = req.body;

    const updatedLeaderboard = await typedDb
      .update(leaderboards)
      .set({
        name,
        description,
        isActive,
        criteria,
        updatedAt: new Date()
      })
      .where(eq(leaderboards.id, leaderboardId))
      .returning();

    if (!updatedLeaderboard.length) {
      return res.status(404).json({
        success: false,
        error: "Leaderboard not found"
      });
    }

    res.json({
      success: true,
      data: updatedLeaderboard[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
