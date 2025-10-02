import { db } from "../../../db";
import { trades, users } from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

// Type the db import properly
const typedDb = db as any;

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  score: number;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  riskAdjustedScore: number;
  improvementStreak: number;
  disciplineScore: number;
}

export interface LeaderboardFilter {
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category: 'overall' | 'risk-adjusted' | 'improvement' | 'discipline';
  minTrades?: number;
}

export class LeaderboardEngine {
  async getLeaderboard(filter: LeaderboardFilter): Promise<LeaderboardEntry[]> {
    let dateFilter = gte(trades.createdAt, new Date(0));
    
    // Apply period filter
    const now = new Date();
    switch (filter.period) {
      case 'daily':
        dateFilter = gte(trades.createdAt, new Date(now.setDate(now.getDate() - 1)));
        break;
      case 'weekly':
        dateFilter = gte(trades.createdAt, new Date(now.setDate(now.getDate() - 7)));
        break;
      case 'monthly':
        dateFilter = gte(trades.createdAt, new Date(now.setMonth(now.getMonth() - 1)));
        break;
    }

    // Get user trade statistics
    const userStats = await typedDb
      .select({
        userId: trades.userId,
        username: users.username,
        // avatar: users.avatar, // Avatar not in schema
        totalTrades: sql<number>`count(*)`,
        winningTrades: sql<number>`sum(case when ${trades.pnl} > 0 then 1 else 0 end)`,
        totalPnl: sql<number>`sum(${trades.pnl})`,
        avgWin: sql<number>`avg(case when ${trades.pnl} > 0 then ${trades.pnl} end)`,
        avgLoss: sql<number>`avg(case when ${trades.pnl} < 0 then abs(${trades.pnl}) end)`,
        lastTradeDate: sql<Date>`max(${trades.createdAt})`,
        firstTradeDate: sql<Date>`min(${trades.createdAt})`
      })
      .from(trades)
      .leftJoin(users, eq(trades.userId, users.id))
      .where(and(dateFilter, sql`${trades.pnl} is not null`))
      .groupBy(trades.userId, users.username);

    // Calculate scores and rankings
    const entries: LeaderboardEntry[] = await Promise.all(userStats.map(async (stat: any, index: number) => {
      const winRate = stat.totalTrades > 0 ? (stat.winningTrades / stat.totalTrades) * 100 : 0;
      const profitFactor = stat.avgLoss > 0 ? stat.avgWin / stat.avgLoss : 0;
      
      // Risk-adjusted score (Sharpe ratio-like calculation)
      const riskAdjustedScore = this.calculateRiskAdjustedScore(
        stat.totalPnl,
        stat.totalTrades,
        winRate,
        profitFactor
      );
      
      // Improvement streak (consecutive profitable months)
      const improvementStreak = await this.calculateImprovementStreak(stat.userId);
      
      // Discipline score (based on stop-loss usage, consistent sizing, etc.)
      const disciplineScore = await this.calculateDisciplineScore(stat.userId);
      
      // Final score based on category
      let finalScore = 0;
      switch (filter.category) {
        case 'overall':
          finalScore = (riskAdjustedScore * 0.4) + (winRate * 0.3) + (disciplineScore * 0.2) + (improvementStreak * 0.1);
          break;
        case 'risk-adjusted':
          finalScore = riskAdjustedScore;
          break;
        case 'improvement':
          finalScore = improvementStreak * 10;
          break;
        case 'discipline':
          finalScore = disciplineScore;
          break;
      }

      return {
        userId: stat.userId,
        username: stat.username || 'Anonymous',
        avatar: stat.avatar,
        rank: 0, // Will be set after sorting
        score: finalScore,
        totalTrades: stat.totalTrades,
        winRate,
        totalPnl: stat.totalPnl || 0,
        riskAdjustedScore,
        improvementStreak,
        disciplineScore
      };
    }));

    // Filter by minimum trades if specified
    const filteredEntries = filter && filter.minTrades
      ? entries.filter(entry => entry.totalTrades >= filter.minTrades!)
      : entries;

    // Sort by score and assign ranks
    const sortedEntries = filteredEntries
      .sort((a: any, b: any) => b.score - a.score)
      .map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1
      }));

    return sortedEntries.slice(0, 100); // Top 100
  }

  private calculateRiskAdjustedScore(totalPnl: number, totalTrades: number, winRate: number, profitFactor: number): number {
    
    // Normalize PNL by number of trades
    const avgPnlPerTrade = totalPnl / totalTrades;
    
    // Risk-adjusted score considering win rate and profit factor
    const consistencyScore = winRate * (profitFactor > 1 ? profitFactor : 1);
    const sizeAdjustedScore = avgPnlPerTrade * Math.sqrt(totalTrades); // Square root for diminishing returns
    
    return Math.max(0, (consistencyScore * 0.6) + (sizeAdjustedScore * 0.4));
  }

  private async calculateImprovementStreak(userId: string): Promise<number> {
    // Get monthly performance to calculate improvement streak
    const monthlyStats = await typedDb
      .select({
        month: sql<string>`to_char(${trades.createdAt}, 'YYYY-MM')`,
        pnl: sql<number>`sum(${trades.pnl})`
      })
      .from(trades)
      .where(and(
        eq(trades.userId, userId),
        sql`${trades.pnl} is not null`
      ))
      .groupBy(sql`to_char(${trades.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${trades.createdAt}, 'YYYY-MM')`);

    let streak = 0;
    let maxStreak = 0;
    
    for (let i = 1; i < monthlyStats.length; i++) {
      if (monthlyStats[i].pnl > monthlyStats[i - 1].pnl) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }

    return maxStreak;
  }

  private async calculateDisciplineScore(userId: string): Promise<number> {
    // Get user's trades to calculate discipline metrics
    const userTrades = await typedDb
      .select()
      .from(trades)
      .where(eq(trades.userId, userId));

    if (userTrades.length === 0) return 0;

    let disciplineScore = 0;
    let metricsCount = 0;

    // Check stop-loss usage
    const tradesWithStopLoss = userTrades.filter((trade: any) => trade.stopLoss !== null).length;
    if (userTrades.length > 0) {
      disciplineScore += (tradesWithStopLoss / userTrades.length) * 25;
      metricsCount++;
    }

    // Check take-profit usage
    const tradesWithTakeProfit = userTrades.filter((trade: any) => trade.takeProfit !== null).length;
    if (userTrades.length > 0) {
      disciplineScore += (tradesWithTakeProfit / userTrades.length) * 25;
      metricsCount++;
    }

    // Check consistent position sizing (calculate coefficient of variation)
    const quantities = userTrades.map((trade: any) => trade.quantity).filter((q: any) => q > 0);
    if (quantities.length > 1) {
      const avg = quantities.reduce((a: any, b: any) => a + b, 0) / quantities.length;
      const variance = quantities.reduce((a: any, b: any) => a + Math.pow(b - avg, 2), 0) / quantities.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avg;
      const consistencyScore = Math.max(0, (1 - cv) * 25); // Lower CV = higher consistency
      disciplineScore += consistencyScore;
      metricsCount++;
    }

    // Check trade frequency consistency
    const tradeDates = userTrades.map((trade: any) => new Date(trade.createdAt)).sort((a: any, b: any) => a.getTime() - b.getTime());
    if (tradeDates.length > 1) {
      const intervals = [];
      for (let i = 1; i < tradeDates.length; i++) {
        intervals.push(tradeDates[i].getTime() - tradeDates[i - 1].getTime());
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avgInterval;
      const frequencyScore = Math.max(0, (1 - cv) * 25);
      disciplineScore += frequencyScore;
      metricsCount++;
    }

    return metricsCount > 0 ? disciplineScore : 0;
  }

  async getUserRank(userId: string, filter: LeaderboardFilter): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard(filter);
    return leaderboard.find(entry => entry.userId === userId) || null;
  }

  async getTopPerformers(limit: number = 10): Promise<LeaderboardEntry[]> {
    const filter: LeaderboardFilter = {
      period: 'monthly',
      category: 'overall',
      minTrades: 5
    };
    return (await this.getLeaderboard(filter)).slice(0, limit);
  }
}

export const leaderboardEngine = new LeaderboardEngine();
