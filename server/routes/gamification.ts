import { Router, Request, Response } from "express";
// @ts-ignore - db is implicitly typed from db.ts
import { db } from "../db";

// Type the db import explicitly to resolve type errors
// @ts-ignore - db is implicitly typed from db.ts
const typedDb = db as any;
import { 
  users, 
  trades, 
  badges, 
  userBadges, 
  userAchievements 
} from "@shared/schema";
import { eq, and, desc, sql, count, gte, lte, or, ilike } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const router = Router();

// ===== BADGES ENDPOINTS =====

// GET /api/gamification/badges - Get all available badges
router.get("/badges", async (req: Request, res: Response) => {
  try {
    const { category, rarity, search } = req.query;
    
    let queryConditions = [eq(badges.isActive, true)];
    
    if (category) {
      queryConditions.push(eq(badges.category, category as string));
    }
    
    if (rarity) {
      queryConditions.push(eq(badges.rarity, rarity as string));
    }
    
    if (search) {
      queryConditions.push(
        or(
          ilike(badges.name, `%${search as string}%`),
          ilike(badges.description, `%${search as string}%`)
        ) as any
      );
    }
    
    const allBadges = await typedDb
      .select()
      .from(badges)
      .where(and(...queryConditions))
      .orderBy(desc(badges.points));
    
    res.json({
      success: true,
      data: allBadges,
      categories: ["trading", "consistency", "skill", "social", "indian"],
      rarities: ["common", "rare", "epic", "legendary"]
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch badges" 
    });
  }
});

// GET /api/gamification/badges/user/:userId - Get user's badges
router.get("/badges/user/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authUserId = req.user?.id;
    
    // Users can only view their own badges unless they're admin
    if (userId !== authUserId && req.user?.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized to view this user's badges" 
      });
    }
    
    const userBadgeData = await typedDb
      .select({
        badge: badges,
        userBadge: userBadges,
      })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));

    const earnedBadges = userBadgeData
      .filter((item: any) => item.userBadge.earnedAt)
      .map((item: any) => ({
        ...item.badge,
        earnedAt: item.userBadge.earnedAt,
        progress: item.userBadge.progress,
        isDisplayed: item.userBadge.isDisplayed
      }));

    const inProgressBadges = userBadgeData
      .filter((item: any) => !item.userBadge.earnedAt)
      .map((item: any) => ({
        ...item.badge,
        progress: item.userBadge.progress,
        isDisplayed: item.userBadge.isDisplayed
      }));

    res.json({
      success: true,
      data: {
        earned: earnedBadges,
        inProgress: inProgressBadges,
        totalEarned: earnedBadges.length,
        totalPoints: earnedBadges.reduce((sum: number, badge: any) => sum + (badge.points || 0), 0)
      }
    });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch user badges" 
    });
  }
});

// POST /api/gamification/badges/check-progress - Check and update badge progress
router.post("/badges/check-progress", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }
    
    // Get all active badges
    const allBadges = await typedDb
      .select()
      .from(badges)
      .where(eq(badges.isActive, true));
    
    // Get user's current badges and progress
    const currentUserBadges = await typedDb
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    
    // Get user's trade data for badge calculations
    const userTrades = await typedDb
      .select()
      .from(trades)
      .where(eq(trades.userId, userId));
    
    const updatedBadges = [];
    
    for (const badge of allBadges) {
      const userBadge = currentUserBadges.find((ub: any) => ub.badgeId === badge.id);
      const requirements = badge.requirements as any;
      let progress = userBadge?.progress || {};
      let isEarned = false;
      
      // Calculate progress based on badge type
      switch (badge.category) {
        case "trading":
          progress = calculateTradingProgress(userTrades, requirements, progress);
          break;
        case "consistency":
          progress = calculateConsistencyProgress(userTrades, requirements, progress);
          break;
        case "skill":
          progress = calculateSkillProgress(userTrades, requirements, progress);
          break;
        case "social":
          progress = await calculateSocialProgress(userId, requirements, progress);
          break;
        case "indian":
          progress = calculateIndianProgress(userTrades, requirements, progress);
          break;
      }
      
      // Check if badge is earned
      isEarned = checkBadgeEarned(progress, requirements);
      
      // Update or create user badge record
      if (userBadge) {
        if (isEarned && !userBadge.earnedAt) {
          await typedDb
            .update(userBadges)
            .set({ 
              progress, 
              earnedAt: new Date(),
              isNotified: false 
            })
            .where(eq(userBadges.id, userBadge.id));
          
          updatedBadges.push({
            badge,
            isNew: true,
            progress
          });
        } else if (!isEarned) {
          await typedDb
            .update(userBadges)
            .set({ progress })
            .where(eq(userBadges.id, userBadge.id));
        }
      } else {
        await typedDb.insert(userBadges).values({
          userId,
          badgeId: badge.id,
          progress,
          earnedAt: isEarned ? new Date() : null,
          isNotified: false,
          isDisplayed: true
        });
        
        if (isEarned) {
          updatedBadges.push({
            badge,
            isNew: true,
            progress
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        updatedBadges,
        message: updatedBadges.length > 0 
          ? `Congratulations! You earned ${updatedBadges.length} new badge(s)!` 
          : "Progress updated successfully"
      }
    });
  } catch (error) {
    console.error("Error checking badge progress:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to check badge progress" 
    });
  }
});

// POST /api/gamification/badges/:badgeId/display - Toggle badge display
router.post("/badges/:badgeId/display", requireAuth, async (req: Request, res: Response) => {
  try {
    const { badgeId } = req.params;
    const { isDisplayed } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }
    
    const userBadge = await typedDb
      .select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId)
      ))
      .limit(1);
    
    if (!userBadge.length) {
      return res.status(404).json({ 
        success: false, 
        error: "Badge not found for user" 
      });
    }
    
    await typedDb
      .update(userBadges)
      .set({ isDisplayed })
      .where(eq(userBadges.id, userBadge[0].id));
    
    res.json({
      success: true,
      data: { isDisplayed }
    });
  } catch (error) {
    console.error("Error updating badge display:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update badge display" 
    });
  }
});

// ===== ACHIEVEMENTS ENDPOINTS =====

// GET /api/gamification/achievements/user/:userId - Get user's achievements
router.get("/achievements/user/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authUserId = req.user?.id;
    
    // Users can only view their own achievements unless they're admin
    if (userId !== authUserId && req.user?.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Unauthorized to view this user's achievements" 
      });
    }
    
    const achievements = await typedDb
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch user achievements" 
    });
  }
});

// POST /api/gamification/achievements - Create a new achievement
router.post("/achievements", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }
    
    const { achievementType, title, description, icon, badgeColor, criteria, progress } = req.body;
    
    const newAchievement = await typedDb.insert(userAchievements).values({
      userId,
      achievementType,
      title,
      description,
      icon,
      badgeColor: badgeColor || "#3B82F6",
      criteria,
      progress: progress || {},
      earnedAt: new Date(),
      isNotified: false
    }).returning();
    
    res.json({
      success: true,
      data: newAchievement[0]
    });
  } catch (error) {
    console.error("Error creating achievement:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create achievement" 
    });
  }
});

// PUT /api/gamification/achievements/:achievementId - Update achievement
router.put("/achievements/:achievementId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { achievementId } = req.params;
    const { title, description, icon, badgeColor, progress } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated" 
      });
    }
    
    const existingAchievement = await typedDb
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.id, achievementId),
        eq(userAchievements.userId, userId)
      ))
      .limit(1);
    
    if (!existingAchievement.length) {
      return res.status(404).json({ 
        success: false, 
        error: "Achievement not found" 
      });
    }
    
    const updatedAchievement = await typedDb
      .update(userAchievements)
      .set({
        title,
        description,
        icon,
        badgeColor,
        progress
      })
      .where(eq(userAchievements.id, achievementId))
      .returning();
    
    res.json({
      success: true,
      data: updatedAchievement[0]
    });
  } catch (error) {
    console.error("Error updating achievement:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update achievement" 
    });
  }
});

// ===== ADMIN ENDPOINTS =====

// POST /api/gamification/badges - Create new badge (admin only)
router.post("/badges", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, icon, category, rarity, requirements, points, imageUrl } = req.body;
    
    const newBadge = await typedDb.insert(badges).values({
      name,
      description,
      icon,
      category,
      rarity,
      requirements,
      points: points || 10,
      imageUrl,
      isActive: true
    }).returning();
    
    res.json({
      success: true,
      data: newBadge[0]
    });
  } catch (error) {
    console.error("Error creating badge:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create badge" 
    });
  }
});

// PUT /api/gamification/badges/:badgeId - Update badge (admin only)
router.put("/badges/:badgeId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { badgeId } = req.params;
    const { name, description, icon, category, rarity, requirements, points, isActive, imageUrl } = req.body;
    
    const updatedBadge = await typedDb
      .update(badges)
      .set({
        name,
        description,
        icon,
        category,
        rarity,
        requirements,
        points,
        isActive,
        imageUrl,
        updatedAt: new Date()
      })
      .where(eq(badges.id, badgeId))
      .returning();
    
    if (!updatedBadge.length) {
      return res.status(404).json({ 
        success: false, 
        error: "Badge not found" 
      });
    }
    
    res.json({
      success: true,
      data: updatedBadge[0]
    });
  } catch (error) {
    console.error("Error updating badge:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update badge" 
    });
  }
});

// ===== HELPER FUNCTIONS =====

function calculateTradingProgress(trades: any[], requirements: any, currentProgress: any) {
  const progress = { ...currentProgress };
  
  if (requirements.totalTrades) {
    progress.totalTrades = Math.min(trades.length, requirements.totalTrades);
  }
  
  if (requirements.profitableTrades) {
    const profitableTrades = trades.filter(t => 
      t.pnl && Number(t.pnl) > 0
    ).length;
    progress.profitableTrades = Math.min(profitableTrades, requirements.profitableTrades);
  }
  
  if (requirements.totalProfit) {
    const totalProfit = trades.reduce((sum, t) => 
      sum + (t.pnl ? Number(t.pnl) : 0), 0
    );
    progress.totalProfit = Math.min(totalProfit, requirements.totalProfit);
  }
  
  return progress;
}

function calculateConsistencyProgress(trades: any[], requirements: any, currentProgress: any) {
  const progress = { ...currentProgress };
  
  if (requirements.consecutiveWins) {
    const closedTrades = trades.filter(t => t.status === "closed" && t.pnl);
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (const trade of closedTrades) {
      if (Number(trade.pnl) > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    progress.consecutiveWins = Math.min(maxStreak, requirements.consecutiveWins);
  }
  
  if (requirements.dailyTrades) {
    const tradesByDay = new Map();
    trades.forEach(trade => {
      const day = trade.entryDate?.split('T')[0];
      if (day) {
        tradesByDay.set(day, (tradesByDay.get(day) || 0) + 1);
      }
    });
    
    const maxDailyTrades = Math.max(...Array.from(tradesByDay.values()), 0);
    progress.dailyTrades = Math.min(maxDailyTrades, requirements.dailyTrades);
  }
  
  return progress;
}

function calculateSkillProgress(trades: any[], requirements: any, currentProgress: any) {
  const progress = { ...currentProgress };
  
  if (requirements.winRate) {
    const closedTrades = trades.filter(t => t.status === "closed" && t.pnl);
    if (closedTrades.length > 0) {
      const winRate = (closedTrades.filter(t => Number(t.pnl) > 0).length / closedTrades.length) * 100;
      progress.winRate = Math.min(winRate, requirements.winRate);
    }
  }
  
  if (requirements.riskRewardRatio) {
    const tradesWithRR = trades.filter(t => t.entryPrice && t.stopLoss && t.takeProfit);
    if (tradesWithRR.length > 0) {
      const avgRR = tradesWithRR.reduce((sum, trade) => {
        const entry = Number(trade.entryPrice);
        const stop = Number(trade.stopLoss);
        const take = Number(trade.takeProfit);
        const risk = Math.abs(entry - stop);
        const reward = Math.abs(take - entry);
        return sum + (reward / risk);
      }, 0) / tradesWithRR.length;
      
      progress.riskRewardRatio = Math.min(avgRR, requirements.riskRewardRatio);
    }
  }
  
  return progress;
}

async function calculateSocialProgress(userId: string, requirements: any, currentProgress: any) {
  const progress = { ...currentProgress };
  
  // This would typically involve checking social interactions
  // For now, we'll use placeholder logic
  
  if (requirements.socialPosts) {
    // Placeholder: would need to check social posts table
    progress.socialPosts = Math.min(0, requirements.socialPosts);
  }
  
  if (requirements.mentorshipSessions) {
    // Placeholder: would need to check mentorship sessions table
    progress.mentorshipSessions = Math.min(0, requirements.mentorshipSessions);
  }
  
  return progress;
}

function calculateIndianProgress(trades: any[], requirements: any, currentProgress: any) {
  const progress = { ...currentProgress };
  
  if (requirements.indianStocks) {
    // Check for trades in Indian stocks (symbols ending with .NS, .BO, etc.)
    const indianTrades = trades.filter(t => 
      t.symbol?.endsWith('.NS') || t.symbol?.endsWith('.BO') || 
      t.symbol?.includes('NIFTY') || t.symbol?.includes('BANKNIFTY')
    ).length;
    
    progress.indianStocks = Math.min(indianTrades, requirements.indianStocks);
  }
  
  if (requirements.festiveTrading) {
    // Placeholder: would need to check if trades occurred during Indian festivals
    progress.festiveTrading = Math.min(0, requirements.festiveTrading);
  }
  
  return progress;
}

function checkBadgeEarned(progress: any, requirements: any): boolean {
  for (const [key, value] of Object.entries(requirements)) {
    if (progress[key] < (value as number)) {
      return false;
    }
  }
  return true;
}

export default router;
