import { db } from "../../../db";
import { trades, users } from "@shared/schema";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";

// Type the db import properly
const typedDb = db as any;

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trading' | 'consistency' | 'skill' | 'social' | 'indian';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  points: number;
}

export interface BadgeRequirement {
  type: 'trade_count' | 'win_rate' | 'profit_streak' | 'total_pnl' | 'risk_score' | 'social_engagement' | 'broker_count' | 'market_condition';
  value: number | string;
  operator: 'gte' | 'lte' | 'eq';
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress: number; // 0-100 for progress tracking
  metadata?: Record<string, any>;
}

export interface AchievementProgress {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  progress: number;
  isEarned: boolean;
  earnedAt?: Date;
  nextMilestone?: string;
}

export class BadgeEngine {
  private badges: Badge[] = [
    // Trading Badges
    {
      id: 'first_trade',
      name: 'First Steps',
      description: 'Complete your first trade',
      icon: '🎯',
      category: 'trading',
      rarity: 'common',
      points: 10,
      requirements: [{ type: 'trade_count', value: 1, operator: 'gte' }]
    },
    {
      id: 'trader_novice',
      name: 'Novice Trader',
      description: 'Complete 10 trades',
      icon: '📈',
      category: 'trading',
      rarity: 'common',
      points: 25,
      requirements: [{ type: 'trade_count', value: 10, operator: 'gte' }]
    },
    {
      id: 'trader_expert',
      name: 'Expert Trader',
      description: 'Complete 100 trades',
      icon: '🏆',
      category: 'trading',
      rarity: 'rare',
      points: 100,
      requirements: [{ type: 'trade_count', value: 100, operator: 'gte' }]
    },
    {
      id: 'trader_master',
      name: 'Trading Master',
      description: 'Complete 1000 trades',
      icon: '👑',
      category: 'trading',
      rarity: 'legendary',
      points: 500,
      requirements: [{ type: 'trade_count', value: 1000, operator: 'gte' }]
    },

    // Consistency Badges
    {
      id: 'consistent_winner',
      name: 'Consistent Winner',
      description: 'Maintain 60% win rate over 50 trades',
      icon: '🎪',
      category: 'consistency',
      rarity: 'rare',
      points: 75,
      requirements: [
        { type: 'trade_count', value: 50, operator: 'gte' },
        { type: 'win_rate', value: 60, operator: 'gte' }
      ]
    },
    {
      id: 'profit_streak_5',
      name: 'Hot Streak',
      description: '5 profitable trades in a row',
      icon: '🔥',
      category: 'consistency',
      rarity: 'rare',
      points: 50,
      requirements: [{ type: 'profit_streak', value: 5, operator: 'gte' }]
    },
    {
      id: 'profit_streak_10',
      name: 'Unstoppable',
      description: '10 profitable trades in a row',
      icon: '⚡',
      category: 'consistency',
      rarity: 'epic',
      points: 150,
      requirements: [{ type: 'profit_streak', value: 10, operator: 'gte' }]
    },

    // Skill Badges
    {
      id: 'risk_manager',
      name: 'Risk Manager',
      description: 'Use stop-loss on 90% of trades',
      icon: '🛡️',
      category: 'skill',
      rarity: 'rare',
      points: 60,
      requirements: [{ type: 'risk_score', value: 90, operator: 'gte' }]
    },
    {
      id: 'profitable_trader',
      name: 'Profitable Trader',
      description: 'Achieve ₹50,000 total profit',
      icon: '💰',
      category: 'skill',
      rarity: 'rare',
      points: 80,
      requirements: [{ type: 'total_pnl', value: 50000, operator: 'gte' }]
    },
    {
      id: 'wealth_builder',
      name: 'Wealth Builder',
      description: 'Achieve ₹5,00,000 total profit',
      icon: '💎',
      category: 'skill',
      rarity: 'epic',
      points: 200,
      requirements: [{ type: 'total_pnl', value: 500000, operator: 'gte' }]
    },

    // Social Badges
    {
      id: 'storyteller',
      name: 'Storyteller',
      description: 'Share your first trade story',
      icon: '📝',
      category: 'social',
      rarity: 'common',
      points: 15,
      requirements: [{ type: 'social_engagement', value: 1, operator: 'gte' }]
    },
    {
      id: 'community_helper',
      name: 'Community Helper',
      description: 'Get 50 likes on your trade stories',
      icon: '🤝',
      category: 'social',
      rarity: 'rare',
      points: 40,
      requirements: [{ type: 'social_engagement', value: 50, operator: 'gte' }]
    },

    // Indian Market Specific Badges
    {
      id: 'budget_day_specialist',
      name: 'Budget Day Specialist',
      description: 'Trade profitably on Budget Day',
      icon: '🇮🇳',
      category: 'indian',
      rarity: 'epic',
      points: 120,
      requirements: [{ type: 'market_condition', value: 'budget_day', operator: 'eq' }]
    },
    {
      id: 'fo_master',
      name: 'F&O Master',
      description: 'Complete 50 profitable F&O trades',
      icon: '📊',
      category: 'indian',
      rarity: 'epic',
      points: 180,
      requirements: [
        { type: 'trade_count', value: 50, operator: 'gte' },
        { type: 'market_condition', value: 'fo', operator: 'eq' }
      ]
    },
    {
      id: 'streak_king',
      name: 'Streak King',
      description: 'Maintain 30-day trading streak',
      icon: '👑',
      category: 'indian',
      rarity: 'legendary',
      points: 300,
      requirements: [{ type: 'market_condition', value: 'daily_streak_30', operator: 'eq' }]
    },
    {
      id: 'news_whisperer',
      name: 'News Whisperer',
      description: 'Profit from 10 news-based trades',
      icon: '📰',
      category: 'indian',
      rarity: 'rare',
      points: 90,
      requirements: [{ type: 'market_condition', value: 'news_based', operator: 'gte' }]
    },
    {
      id: 'ipo_expert',
      name: 'IPO Expert',
      description: 'Successfully trade 5 IPO listings',
      icon: '🚀',
      category: 'indian',
      rarity: 'rare',
      points: 100,
      requirements: [{ type: 'market_condition', value: 'ipo', operator: 'gte' }]
    }
  ];

  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const userStats = await this.getUserStats(userId);
    const newBadges: UserBadge[] = [];

    for (const badge of this.badges) {
      if (await this.isBadgeEarned(userId, badge.id)) {
        continue; // Already earned
      }

      const progress = this.calculateBadgeProgress(badge, userStats);
      
      if (progress >= 100) {
        const userBadge: UserBadge = {
          id: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          badgeId: badge.id,
          earnedAt: new Date(),
          progress: 100,
          metadata: {
            stats: userStats,
            requirements: badge.requirements
          }
        };

        newBadges.push(userBadge);
        // In a real implementation, save to database here
      }
    }

    return newBadges;
  }

  private async getUserStats(userId: string) {
    const [tradeStats] = await typedDb
      .select({
        totalTrades: count(),
        winningTrades: sql<number>`sum(case when ${trades.pnl} > 0 then 1 else 0 end)`,
        totalPnl: sql<number>`sum(${trades.pnl})`,
        tradesWithStopLoss: sql<number>`sum(case when ${trades.stopLoss} is not null then 1 else 0 end)`,
        lastTradeDate: sql<Date>`max(${trades.createdAt})`,
        firstTradeDate: sql<Date>`min(${trades.createdAt})`
      })
      .from(trades)
      .where(eq(trades.userId, userId));

    const winRate = tradeStats.totalTrades > 0 ? (tradeStats.winningTrades / tradeStats.totalTrades) * 100 : 0;
    const riskScore = tradeStats.totalTrades > 0 ? (tradeStats.tradesWithStopLoss / tradeStats.totalTrades) * 100 : 0;

    // Get profit streak
    const profitStreak = await this.calculateProfitStreak(userId);

    return {
      totalTrades: tradeStats.totalTrades || 0,
      winRate,
      totalPnl: tradeStats.totalPnl || 0,
      riskScore,
      profitStreak,
      socialEngagement: 0, // Would come from social features
      brokerCount: 0, // Would come from broker integration
      marketConditions: [] // Would come from trade analysis
    };
  }

  private async calculateProfitStreak(userId: string): Promise<number> {
    const userTrades = await typedDb
      .select({ pnl: trades.pnl, createdAt: trades.createdAt })
      .from(trades)
      .where(and(eq(trades.userId, userId), sql`${trades.pnl} is not null`))
      .orderBy(desc(trades.createdAt));

    let streak = 0;
    for (const trade of userTrades) {
      if (trade.pnl > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateBadgeProgress(badge: Badge, userStats: any): number {
    let totalProgress = 0;
    let requirementsMet = 0;

    for (const requirement of badge.requirements) {
      const progress = this.calculateRequirementProgress(requirement, userStats);
      totalProgress += progress;
      
      if (progress >= 100) {
        requirementsMet++;
      }
    }

    // Average progress across all requirements
    return badge.requirements.length > 0 ? totalProgress / badge.requirements.length : 0;
  }

  private calculateRequirementProgress(requirement: BadgeRequirement, userStats: any): number {
    let currentValue = 0;

    switch (requirement.type) {
      case 'trade_count':
        currentValue = userStats.totalTrades;
        break;
      case 'win_rate':
        currentValue = userStats.winRate;
        break;
      case 'profit_streak':
        currentValue = userStats.profitStreak;
        break;
      case 'total_pnl':
        currentValue = userStats.totalPnl;
        break;
      case 'risk_score':
        currentValue = userStats.riskScore;
        break;
      case 'social_engagement':
        currentValue = userStats.socialEngagement;
        break;
      case 'broker_count':
        currentValue = userStats.brokerCount;
        break;
      default:
        currentValue = 0;
    }

    switch (requirement.operator) {
      case 'gte':
        if (typeof requirement.value === 'number') {
          return Math.min(100, (currentValue / requirement.value) * 100);
        }
        return currentValue.toString() === requirement.value ? 100 : 0;
      case 'lte':
        if (typeof requirement.value === 'number') {
          return Math.min(100, (requirement.value / currentValue) * 100);
        }
        return currentValue.toString() === requirement.value ? 100 : 0;
      case 'eq':
        if (typeof requirement.value === 'number') {
          return currentValue === requirement.value ? 100 : 0;
        }
        return currentValue.toString() === requirement.value ? 100 : 0;
      default:
        return 0;
    }
  }

  private async isBadgeEarned(userId: string, badgeId: string): Promise<boolean> {
    // In a real implementation, check database
    return false;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    // In a real implementation, get from database
    return [];
  }

  async getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
    const userStats = await this.getUserStats(userId);
    const userBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = new Set(userBadges.map(badge => badge.badgeId));

    return this.badges.map(badge => {
      const isEarned = earnedBadgeIds.has(badge.id);
      const progress = this.calculateBadgeProgress(badge, userStats);
      const earnedBadge = userBadges.find(b => b.badgeId === badge.id);

      return {
        badgeId: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        progress,
        isEarned,
        earnedAt: earnedBadge?.earnedAt,
        nextMilestone: this.getNextMilestone(badge, userStats)
      };
    });
  }

  private getNextMilestone(badge: Badge, userStats: any): string | undefined {
    if (badge.requirements.length === 0) return undefined;

    // For simplicity, just show progress on the first requirement
    const requirement = badge.requirements[0];
    let currentValue = 0;

    switch (requirement.type) {
      case 'trade_count':
        currentValue = userStats.totalTrades;
        return `${currentValue}/${requirement.value} trades`;
      case 'win_rate':
        currentValue = userStats.winRate;
        return `${currentValue.toFixed(1)}%/${requirement.value}%`;
      case 'profit_streak':
        currentValue = userStats.profitStreak;
        return `${currentValue}/${requirement.value} streak`;
      case 'total_pnl':
        currentValue = userStats.totalPnl;
        return `₹${currentValue.toLocaleString()}/₹${requirement.value.toLocaleString()}`;
      default:
        return undefined;
    }
  }

  async getBadgesByCategory(category: string): Promise<Badge[]> {
    return this.badges.filter(badge => badge.category === category);
  }

  async getTotalPoints(userId: string): Promise<number> {
    const userBadges = await this.getUserBadges(userId);
    return userBadges.reduce((total, userBadge) => {
      const badge = this.badges.find(b => b.id === userBadge.badgeId);
      return total + (badge?.points || 0);
    }, 0);
  }

  async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; username: string; points: number; badgeCount: number }>> {
    // In a real implementation, this would query the database
    return [];
  }
}

export const badgeEngine = new BadgeEngine();
