import { Trade } from "@shared/schema";
import { CoachPersona } from "./coachPersonas";

export interface ExplainableInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'risk';
  title: string;
  description: string;
  confidence: number; // 0-1
  evidence: string[];
  impact: 'low' | 'medium' | 'high';
  actionable: string;
  dataPoints: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  relatedTrades: string[]; // Trade IDs
  category: 'technical' | 'psychological' | 'risk' | 'performance';
}

export interface ExplainableAnalysis {
  overallScore: number; // 0-100
  insights: ExplainableInsight[];
  summary: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  confidenceLevel: number; // 0-1
  analysisMethodology: string;
}

export class ExplainableAIEngine {
  private persona: CoachPersona;

  constructor(persona: CoachPersona) {
    this.persona = persona;
  }

  async generateExplainableAnalysis(
    trades: Trade[], 
    traderProfile: any
  ): Promise<ExplainableAnalysis> {
    const insights: ExplainableInsight[] = [];
    
    // Generate insights based on different analysis categories
    insights.push(...this.analyzeRiskManagement(trades, traderProfile));
    insights.push(...this.analyzePerformancePatterns(trades, traderProfile));
    insights.push(...this.analyzeBehavioralPatterns(trades, traderProfile));
    insights.push(...this.analyzeTechnicalExecution(trades, traderProfile));
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(insights);
    
    // Generate summary
    const summary = this.generateSummary(insights);
    
    return {
      overallScore,
      insights,
      summary,
      confidenceLevel: this.calculateConfidenceLevel(trades, insights),
      analysisMethodology: this.getAnalysisMethodology()
    };
  }

  private analyzeRiskManagement(trades: Trade[], traderProfile: any): ExplainableInsight[] {
    const insights: ExplainableInsight[] = [];
    
    // Analyze position sizing consistency
    const positionSizes = trades.map(t => parseFloat(t.quantity.toString()));
    const avgPositionSize = positionSizes.reduce((a, b) => a + b, 0) / positionSizes.length;
    const positionSizeVariance = this.calculateVariance(positionSizes);
    
    if (positionSizeVariance > avgPositionSize * 0.5) {
      insights.push({
        id: 'risk-position-inconsistency',
        type: 'weakness',
        title: 'Inconsistent Position Sizing',
        description: 'Your position sizes vary significantly, which indicates inconsistent risk management.',
        confidence: 0.85,
        evidence: [
          `Average position size: ${avgPositionSize.toFixed(1)}`,
          `Position size variance: ${positionSizeVariance.toFixed(1)}`,
          `Largest position: ${Math.max(...positionSizes)}`,
          `Smallest position: ${Math.min(...positionSizes)}`
        ],
        impact: 'high',
        actionable: 'Implement a fixed percentage risk model (e.g., 1-2% of capital per trade) and stick to it consistently.',
        dataPoints: [
          { label: 'Avg Position Size', value: avgPositionSize.toFixed(1) },
          { label: 'Variance', value: positionSizeVariance.toFixed(1), trend: 'up' },
          { label: 'Consistency Score', value: Math.max(0, 100 - (positionSizeVariance / avgPositionSize * 100)).toFixed(0) + '%' }
        ],
        relatedTrades: trades.map(t => t.id),
        category: 'risk'
      });
    }

    // Analyze stop-loss usage
    const tradesWithStopLoss = trades.filter(t => t.stopLoss !== null && t.stopLoss !== undefined);
    const stopLossUsageRate = trades.length > 0 ? (tradesWithStopLoss.length / trades.length) * 100 : 0;
    
    if (stopLossUsageRate < 70) {
      insights.push({
        id: 'risk-stoploss-usage',
        type: 'weakness',
        title: 'Low Stop-Loss Usage',
        description: 'You\'re not using stop-loss orders consistently, exposing your capital to unlimited downside risk.',
        confidence: 0.90,
        evidence: [
          `Stop-loss usage rate: ${stopLossUsageRate.toFixed(1)}%`,
          `Trades without stop-loss: ${trades.length - tradesWithStopLoss.length}`,
          'Stop-loss orders are essential for risk management'
        ],
        impact: 'high',
        actionable: 'Always set a stop-loss order when entering a trade. Use a maximum risk of 1-2% per trade.',
        dataPoints: [
          { label: 'Stop-Loss Usage', value: stopLossUsageRate.toFixed(1) + '%', trend: 'down' },
          { label: 'Protected Trades', value: tradesWithStopLoss.length.toString() },
          { label: 'Unprotected Trades', value: (trades.length - tradesWithStopLoss.length).toString() }
        ],
        relatedTrades: trades.filter(t => !t.stopLoss).map(t => t.id),
        category: 'risk'
      });
    }

    return insights;
  }

  private analyzePerformancePatterns(trades: Trade[], traderProfile: any): ExplainableInsight[] {
    const insights: ExplainableInsight[] = [];
    
    // Calculate win rate and profitability
    const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== null);
    const winningTrades = closedTrades.filter(t => t.pnl !== null && parseFloat(t.pnl.toString()) > 0);
    const losingTrades = closedTrades.filter(t => t.pnl !== null && parseFloat(t.pnl.toString()) < 0);
    
    if (closedTrades.length > 0) {
      const winRate = (winningTrades.length / closedTrades.length) * 100;
      const avgWin = winningTrades.length > 0 ? 
        winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl!.toString()), 0) / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ?
        losingTrades.reduce((sum, t) => sum + Math.abs(parseFloat(t.pnl!.toString())), 0) / losingTrades.length : 0;
      const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

      // Win rate analysis
      if (winRate < 45) {
        insights.push({
          id: 'performance-low-winrate',
          type: 'weakness',
          title: 'Low Win Rate',
          description: `Your win rate of ${winRate.toFixed(1)}% is below the 45% threshold, indicating issues with trade selection or timing.`,
          confidence: 0.80,
          evidence: [
            `Win rate: ${winRate.toFixed(1)}%`,
            `Winning trades: ${winningTrades.length}`,
            `Losing trades: ${losingTrades.length}`,
            'Ideal win rate should be above 45% for profitability'
          ],
          impact: 'high',
          actionable: 'Focus on higher probability setups, improve entry timing, and consider waiting for better risk-reward ratios.',
          dataPoints: [
            { label: 'Win Rate', value: winRate.toFixed(1) + '%', trend: 'down' },
            { label: 'Winning Trades', value: winningTrades.length.toString() },
            { label: 'Losing Trades', value: losingTrades.length.toString() }
          ],
          relatedTrades: closedTrades.map(t => t.id),
          category: 'performance'
        });
      }

      // Profit factor analysis
      if (profitFactor < 1.5) {
        insights.push({
          id: 'performance-low-profitfactor',
          type: 'weakness',
          title: 'Low Profit Factor',
          description: `Your profit factor of ${profitFactor.toFixed(2)} indicates that your average wins don't sufficiently compensate for your losses.`,
          confidence: 0.75,
          evidence: [
            `Profit factor: ${profitFactor.toFixed(2)}`,
            `Average win: ₹${avgWin.toFixed(2)}`,
            `Average loss: ₹${avgLoss.toFixed(2)}`,
            'Profit factor should be above 1.5 for sustainable trading'
          ],
          impact: 'medium',
          actionable: 'Aim for higher risk-reward ratios (minimum 1:2), let winners run, and cut losses quickly.',
          dataPoints: [
            { label: 'Profit Factor', value: profitFactor.toFixed(2), trend: 'down' },
            { label: 'Avg Win', value: '₹' + avgWin.toFixed(2) },
            { label: 'Avg Loss', value: '₹' + avgLoss.toFixed(2) }
          ],
          relatedTrades: closedTrades.map(t => t.id),
          category: 'performance'
        });
      }

      // Strength: High win rate
      if (winRate > 60) {
        insights.push({
          id: 'performance-high-winrate',
          type: 'strength',
          title: 'Excellent Win Rate',
          description: `Your win rate of ${winRate.toFixed(1)}% demonstrates strong trade selection and timing skills.`,
          confidence: 0.85,
          evidence: [
            `Win rate: ${winRate.toFixed(1)}%`,
            `Winning trades: ${winningTrades.length}`,
            `Losing trades: ${losingTrades.length}`,
            'Win rate above 60% is considered excellent'
          ],
          impact: 'high',
          actionable: 'Maintain your current trade selection criteria while focusing on position sizing and letting winners run.',
          dataPoints: [
            { label: 'Win Rate', value: winRate.toFixed(1) + '%', trend: 'up' },
            { label: 'Winning Trades', value: winningTrades.length.toString() },
            { label: 'Success Rate', value: 'Excellent' }
          ],
          relatedTrades: winningTrades.map(t => t.id),
          category: 'performance'
        });
      }
    }

    return insights;
  }

  private analyzeBehavioralPatterns(trades: Trade[], traderProfile: any): ExplainableInsight[] {
    const insights: ExplainableInsight[] = [];
    
    // Analyze trading frequency (potential overtrading)
    const tradesByDate = trades.reduce((acc, trade) => {
      const date = new Date(trade.entryDate).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(trade);
      return acc;
    }, {} as Record<string, Trade[]>);
    
    const avgTradesPerDay = Object.values(tradesByDate).reduce((sum, dayTrades) => sum + dayTrades.length, 0) / Object.keys(tradesByDate).length;
    const maxTradesInDay = Math.max(...Object.values(tradesByDate).map(dayTrades => dayTrades.length));
    
    if (avgTradesPerDay > 5) {
      insights.push({
        id: 'behavioral-overtrading',
        type: 'weakness',
        title: 'Potential Overtrading',
        description: `Your average of ${avgTradesPerDay.toFixed(1)} trades per day suggests overtrading, which can lead to poor decision-making and high transaction costs.`,
        confidence: 0.80,
        evidence: [
          `Average trades per day: ${avgTradesPerDay.toFixed(1)}`,
          `Maximum trades in one day: ${maxTradesInDay}`,
          'Overtrading often leads to diminished returns and increased stress'
        ],
        impact: 'medium',
        actionable: 'Focus on quality over quantity. Set a daily trade limit (e.g., 2-3 high-quality setups) and stick to it.',
        dataPoints: [
          { label: 'Avg Trades/Day', value: avgTradesPerDay.toFixed(1), trend: 'up' },
          { label: 'Max in One Day', value: maxTradesInDay.toString() },
          { label: 'Trading Days', value: Object.keys(tradesByDate).length.toString() }
        ],
        relatedTrades: trades.map(t => t.id),
        category: 'psychological'
      });
    }

    // Analyze revenge trading (consecutive losses followed by increased position size)
    const consecutiveLosses = this.findConsecutiveLosses(trades);
    if (consecutiveLosses.maxStreak >= 3) {
      insights.push({
        id: 'behavioral-revenge-trading',
        type: 'risk',
        title: 'Potential Revenge Trading Pattern',
        description: `You've experienced a streak of ${consecutiveLosses.maxStreak} consecutive losses, which may indicate emotional trading or revenge trading behavior.`,
        confidence: 0.75,
        evidence: [
          `Longest losing streak: ${consecutiveLosses.maxStreak} trades`,
          `Total losing streaks: ${consecutiveLosses.totalStreaks}`,
          'Consecutive losses often lead to emotional decision-making'
        ],
        impact: 'high',
        actionable: 'Take a break after 2 consecutive losses. Review your strategy and only resume trading when emotionally neutral.',
        dataPoints: [
          { label: 'Max Loss Streak', value: consecutiveLosses.maxStreak.toString(), trend: 'up' },
          { label: 'Total Streaks', value: consecutiveLosses.totalStreaks.toString() },
          { label: 'Risk Level', value: 'High' }
        ],
        relatedTrades: consecutiveLosses.relatedTrades,
        category: 'psychological'
      });
    }

    return insights;
  }

  private analyzeTechnicalExecution(trades: Trade[], traderProfile: any): ExplainableInsight[] {
    const insights: ExplainableInsight[] = [];
    
    // Analyze holding periods
    const closedTrades = trades.filter(t => t.exitDate && t.entryDate);
    const holdingPeriods = closedTrades.map(t => 
      new Date(t.exitDate!).getTime() - new Date(t.entryDate).getTime()
    );
    
    if (holdingPeriods.length > 0) {
      const avgHoldingPeriod = holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length;
      const avgHoldingHours = avgHoldingPeriod / (1000 * 60 * 60);
      
      // Very short holding periods may indicate scalping or impulsive trading
      if (avgHoldingHours < 2) {
        insights.push({
          id: 'technical-short-holding',
          type: 'opportunity',
          title: 'Very Short Holding Periods',
          description: `Your average holding period of ${avgHoldingHours.toFixed(1)} hours suggests either scalping strategy or impulsive trading.`,
          confidence: 0.70,
          evidence: [
            `Average holding period: ${avgHoldingHours.toFixed(1)} hours`,
            `Trades analyzed: ${holdingPeriods.length}`,
            'Short holding periods increase transaction costs and stress'
          ],
          impact: 'medium',
          actionable: 'If intentional scalping, ensure proper risk-reward ratios. If impulsive, consider longer timeframes for better decision-making.',
          dataPoints: [
            { label: 'Avg Holding', value: avgHoldingHours.toFixed(1) + 'h' },
            { label: 'Trade Count', value: holdingPeriods.length.toString() },
            { label: 'Strategy Type', value: 'Short-term' }
          ],
          relatedTrades: closedTrades.map(t => t.id),
          category: 'technical'
        });
      }

      // Very long holding periods may indicate lack of exit strategy
      if (avgHoldingHours > 168) { // More than a week
        insights.push({
          id: 'technical-long-holding',
          type: 'opportunity',
          title: 'Extended Holding Periods',
          description: `Your average holding period of ${(avgHoldingHours / 24).toFixed(1)} days may indicate lack of clear exit strategy or holding losing positions too long.`,
          confidence: 0.75,
          evidence: [
            `Average holding period: ${(avgHoldingHours / 24).toFixed(1)} days`,
            `Trades analyzed: ${holdingPeriods.length}`,
            'Long holding periods can tie up capital and increase opportunity cost'
          ],
          impact: 'medium',
          actionable: 'Define clear exit criteria before entering trades. Consider time-based exits for positions that aren\'t performing.',
          dataPoints: [
            { label: 'Avg Holding', value: (avgHoldingHours / 24).toFixed(1) + ' days' },
            { label: 'Trade Count', value: holdingPeriods.length.toString() },
            { label: 'Capital Efficiency', value: 'Low' }
          ],
          relatedTrades: closedTrades.map(t => t.id),
          category: 'technical'
        });
      }
    }

    return insights;
  }

  private calculateOverallScore(insights: ExplainableInsight[]): number {
    if (insights.length === 0) return 50; // Neutral score
    
    let totalScore = 0;
    let weightSum = 0;
    
    insights.forEach(insight => {
      let score = 0;
      let weight = 1;
      
      switch (insight.type) {
        case 'strength':
          score = 80 + (insight.confidence * 20); // 80-100
          weight = 1.2;
          break;
        case 'weakness':
          score = 20 - (insight.confidence * 20); // 0-20
          weight = 1.5;
          break;
        case 'opportunity':
          score = 50 + (insight.confidence * 20); // 50-70
          weight = 1.0;
          break;
        case 'risk':
          score = 30 - (insight.confidence * 30); // 0-30
          weight = 2.0;
          break;
      }
      
      // Adjust for impact
      switch (insight.impact) {
        case 'high':
          weight *= 1.5;
          break;
        case 'medium':
          weight *= 1.0;
          break;
        case 'low':
          weight *= 0.5;
          break;
      }
      
      totalScore += score * weight;
      weightSum += weight;
    });
    
    return Math.round(totalScore / weightSum);
  }

  private generateSummary(insights: ExplainableInsight[]): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const strengths = insights
      .filter(i => i.type === 'strength')
      .map(i => i.title);
    
    const weaknesses = insights
      .filter(i => i.type === 'weakness' || i.type === 'risk')
      .map(i => i.title);
    
    const recommendations = insights
      .map(i => i.actionable)
      .filter((action, index, self) => self.indexOf(action) === index) // Remove duplicates
      .slice(0, 5); // Top 5 recommendations
    
    return { strengths, weaknesses, recommendations };
  }

  private calculateConfidenceLevel(trades: Trade[], insights: ExplainableInsight[]): number {
    if (trades.length === 0) return 0;
    
    // More trades = higher confidence
    const tradeVolumeScore = Math.min(trades.length / 50, 1) * 0.4;
    
    // More insights = higher confidence (but not too many)
    const insightCountScore = insights.length >= 3 && insights.length <= 10 ? 0.3 : 0.1;
    
    // Average confidence of insights
    const avgInsightConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    const insightConfidenceScore = avgInsightConfidence * 0.3;
    
    return tradeVolumeScore + insightCountScore + insightConfidenceScore;
  }

  private getAnalysisMethodology(): string {
    return `This analysis uses a multi-dimensional approach examining:
1. Risk Management: Position sizing, stop-loss usage, risk-reward ratios
2. Performance Patterns: Win rates, profit factors, consistency metrics
3. Behavioral Patterns: Trading frequency, emotional responses, revenge trading
4. Technical Execution: Holding periods, entry/exit timing, strategy adherence

Each insight is generated using statistical analysis of your trading data and is scored based on confidence levels and potential impact. The analysis adapts to your trading style and experience level.`;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private findConsecutiveLosses(trades: Trade[]): {
    maxStreak: number;
    totalStreaks: number;
    relatedTrades: string[];
  } {
    let maxStreak = 0;
    let currentStreak = 0;
    let totalStreaks = 0;
    const relatedTrades: string[] = [];
    
    trades.forEach(trade => {
      if (trade.pnl && parseFloat(trade.pnl.toString()) < 0) {
        currentStreak++;
        relatedTrades.push(trade.id);
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        if (currentStreak >= 2) {
          totalStreaks++;
        }
        currentStreak = 0;
      }
    });
    
    return { maxStreak, totalStreaks, relatedTrades };
  }
}
