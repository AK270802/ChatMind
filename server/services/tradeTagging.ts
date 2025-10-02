import { Trade } from "@shared/schema";

export interface TradeTag {
  id: string;
  type: 'emotion' | 'strategy' | 'event' | 'pattern' | 'risk';
  value: string;
  category: string;
  description: string;
  color: string;
  icon: string;
}

export interface TradeTaggingResult {
  tradeId: string;
  suggestedTags: TradeTag[];
  confidence: number;
  reasoning: string[];
}

export class TradeTaggingService {
  private emotionTags: TradeTag[] = [
    {
      id: 'emotion-fearful',
      type: 'emotion',
      value: 'fearful',
      category: 'Negative Emotions',
      description: 'Trading driven by fear of loss or market uncertainty',
      color: '#ef4444',
      icon: '😰'
    },
    {
      id: 'emotion-greedy',
      type: 'emotion',
      value: 'greedy',
      category: 'Negative Emotions',
      description: 'Trading driven by excessive optimism or FOMO',
      color: '#f97316',
      icon: '🤑'
    },
    {
      id: 'emotion-confident',
      type: 'emotion',
      value: 'confident',
      category: 'Positive Emotions',
      description: 'Trading with strong conviction and analysis',
      color: '#22c55e',
      icon: '😎'
    },
    {
      id: 'emotion-anxious',
      type: 'emotion',
      value: 'anxious',
      category: 'Negative Emotions',
      description: 'Trading with worry and overthinking',
      color: '#eab308',
      icon: '😟'
    },
    {
      id: 'emotion-calm',
      type: 'emotion',
      value: 'calm',
      category: 'Positive Emotions',
      description: 'Trading with emotional balance and patience',
      color: '#3b82f6',
      icon: '😌'
    },
    {
      id: 'emotion-excited',
      type: 'emotion',
      value: 'excited',
      category: 'Positive Emotions',
      description: 'Trading with enthusiasm and energy',
      color: '#8b5cf6',
      icon: '🤩'
    }
  ];

  private strategyTags: TradeTag[] = [
    {
      id: 'strategy-trend-following',
      type: 'strategy',
      value: 'trend-following',
      category: 'Technical Strategies',
      description: 'Following established market trends',
      color: '#06b6d4',
      icon: '📈'
    },
    {
      id: 'strategy-breakout',
      type: 'strategy',
      value: 'breakout',
      category: 'Technical Strategies',
      description: 'Trading price breakouts from consolidation',
      color: '#0ea5e9',
      icon: '🚀'
    },
    {
      id: 'strategy-reversal',
      type: 'strategy',
      value: 'reversal',
      category: 'Technical Strategies',
      description: 'Trading trend reversals at key levels',
      color: '#ec4899',
      icon: '🔄'
    },
    {
      id: 'strategy-scalping',
      type: 'strategy',
      value: 'scalping',
      category: 'Time-based Strategies',
      description: 'Quick trades for small profits',
      color: '#f59e0b',
      icon: '⚡'
    },
    {
      id: 'strategy-swing',
      type: 'strategy',
      value: 'swing',
      category: 'Time-based Strategies',
      description: 'Holding positions for several days',
      color: '#10b981',
      icon: '🌊'
    },
    {
      id: 'strategy-position',
      type: 'strategy',
      value: 'position',
      category: 'Time-based Strategies',
      description: 'Long-term investment approach',
      color: '#6366f1',
      icon: '📊'
    },
    {
      id: 'strategy-value-investing',
      type: 'strategy',
      value: 'value-investing',
      category: 'Fundamental Strategies',
      description: 'Buying undervalued stocks',
      color: '#84cc16',
      icon: '💰'
    },
    {
      id: 'strategy-growth-investing',
      type: 'strategy',
      value: 'growth-investing',
      category: 'Fundamental Strategies',
      description: 'Investing in high-growth companies',
      color: '#14b8a6',
      icon: '🌱'
    }
  ];

  private eventTags: TradeTag[] = [
    {
      id: 'event-earnings',
      type: 'event',
      value: 'earnings',
      category: 'Corporate Events',
      description: 'Trading around earnings announcements',
      color: '#dc2626',
      icon: '📰'
    },
    {
      id: 'event-budget',
      type: 'event',
      value: 'budget',
      category: 'Economic Events',
      description: 'Trading around Union Budget announcements',
      color: '#7c3aed',
      icon: '🇮🇳'
    },
    {
      id: 'event-rbi-policy',
      type: 'event',
      value: 'rbi-policy',
      category: 'Economic Events',
      description: 'Trading around RBI policy decisions',
      color: '#059669',
      icon: '🏦'
    },
    {
      id: 'event-festive-season',
      type: 'event',
      value: 'festive-season',
      category: 'Seasonal Events',
      description: 'Trading during festive seasons',
      color: '#ea580c',
      icon: '🎉'
    },
    {
      id: 'election',
      type: 'event',
      value: 'election',
      category: 'Political Events',
      description: 'Trading during election periods',
      color: '#b91c1c',
      icon: '🗳️'
    }
  ];

  private patternTags: TradeTag[] = [
    {
      id: 'pattern-overtrading',
      type: 'pattern',
      value: 'overtrading',
      category: 'Behavioral Patterns',
      description: 'Excessive trading frequency',
      color: '#dc2626',
      icon: '🔄'
    },
    {
      id: 'pattern-revenge-trading',
      type: 'pattern',
      value: 'revenge-trading',
      category: 'Behavioral Patterns',
      description: 'Trading to recover losses quickly',
      color: '#b91c1c',
      icon: '⚔️'
    },
    {
      id: 'pattern-impulsive',
      type: 'pattern',
      value: 'impulsive',
      category: 'Behavioral Patterns',
      description: 'Making quick, unplanned trades',
      color: '#f59e0b',
      icon: '💥'
    },
    {
      id: 'pattern-patient',
      type: 'pattern',
      value: 'patient',
      category: 'Positive Patterns',
      description: 'Waiting for optimal setups',
      color: '#22c55e',
      icon: '⏳'
    },
    {
      id: 'pattern-disciplined',
      type: 'pattern',
      value: 'disciplined',
      category: 'Positive Patterns',
      description: 'Following trading plan consistently',
      color: '#3b82f6',
      icon: '📋'
    }
  ];

  private riskTags: TradeTag[] = [
    {
      id: 'risk-high-risk',
      type: 'risk',
      value: 'high-risk',
      category: 'Risk Levels',
      description: 'Taking excessive risk relative to account size',
      color: '#dc2626',
      icon: '⚠️'
    },
    {
      id: 'risk-conservative',
      type: 'risk',
      value: 'conservative',
      category: 'Risk Levels',
      description: 'Taking minimal, calculated risks',
      color: '#22c55e',
      icon: '🛡️'
    },
    {
      id: 'risk-calculated',
      type: 'risk',
      value: 'calculated',
      category: 'Risk Levels',
      description: 'Taking appropriate risk with proper analysis',
      color: '#3b82f6',
      icon: '🎯'
    },
    {
      id: 'risk-no-stop-loss',
      type: 'risk',
      value: 'no-stop-loss',
      category: 'Risk Management',
      description: 'Trading without stop-loss protection',
      color: '#ef4444',
      icon: '❌'
    },
    {
      id: 'risk-proper-position-sizing',
      type: 'risk',
      value: 'proper-position-sizing',
      category: 'Risk Management',
      description: 'Using appropriate position sizes',
      color: '#22c55e',
      icon: '✅'
    }
  ];

  private allTags: TradeTag[];

  constructor() {
    this.allTags = [
      ...this.emotionTags,
      ...this.strategyTags,
      ...this.eventTags,
      ...this.patternTags,
      ...this.riskTags
    ];
  }

  /**
   * Analyze a trade and suggest relevant tags
   */
  async analyzeTrade(trade: Trade, userContext?: any): Promise<TradeTaggingResult> {
    const suggestedTags: TradeTag[] = [];
    const reasoning: string[] = [];
    let confidenceScore = 0;

    // Analyze based on trade characteristics
    const analysis = this.analyzeTradeCharacteristics(trade);
    
    // Suggest tags based on analysis
    suggestedTags.push(...this.suggestEmotionTags(analysis, userContext));
    suggestedTags.push(...this.suggestStrategyTags(trade, analysis));
    suggestedTags.push(...this.suggestRiskTags(trade, analysis));
    suggestedTags.push(...this.suggestPatternTags(analysis, userContext));

    // Calculate confidence based on how many indicators we have
    confidenceScore = Math.min(suggestedTags.length * 0.2, 1.0);

    // Remove duplicates and limit to top suggestions
    const uniqueTags = this.removeDuplicateTags(suggestedTags).slice(0, 5);

    return {
      tradeId: trade.id,
      suggestedTags: uniqueTags,
      confidence: confidenceScore,
      reasoning: this.generateReasoning(uniqueTags, analysis)
    };
  }

  /**
   * Get all available tags by category
   */
  getTagsByCategory(category?: string): TradeTag[] {
    if (category) {
      return this.allTags.filter(tag => tag.category === category);
    }
    return this.allTags;
  }

  /**
   * Get tags by type
   */
  getTagsByType(type: string): TradeTag[] {
    return this.allTags.filter(tag => tag.type === type);
  }

  /**
   * Search tags by keyword
   */
  searchTags(query: string): TradeTag[] {
    const lowercaseQuery = query.toLowerCase();
    return this.allTags.filter(tag => 
      tag.value.toLowerCase().includes(lowercaseQuery) ||
      tag.description.toLowerCase().includes(lowercaseQuery) ||
      tag.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  private analyzeTradeCharacteristics(trade: Trade) {
    const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 0;
    const isWinning = pnl > 0;
    const isLosing = pnl < 0;
    
    // Calculate risk/reward ratio if possible
    let riskRewardRatio = 0;
    if (trade.entryPrice && trade.stopLoss && trade.takeProfit) {
      const entryPrice = parseFloat(trade.entryPrice.toString());
      const stopLoss = parseFloat(trade.stopLoss.toString());
      const takeProfit = parseFloat(trade.takeProfit.toString());
      
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(takeProfit - entryPrice);
      riskRewardRatio = risk > 0 ? reward / risk : 0;
    }

    // Calculate holding period
    let holdingPeriodHours = 0;
    if (trade.entryDate && trade.exitDate) {
      const entryTime = new Date(trade.entryDate).getTime();
      const exitTime = new Date(trade.exitDate).getTime();
      holdingPeriodHours = (exitTime - entryTime) / (1000 * 60 * 60);
    }

    return {
      isWinning,
      isLosing,
      pnl,
      riskRewardRatio,
      holdingPeriodHours,
      hasStopLoss: !!trade.stopLoss,
      hasTakeProfit: !!trade.takeProfit,
      quantity: trade.quantity || 0,
      symbol: trade.symbol
    };
  }

  private suggestEmotionTags(analysis: any, userContext?: any): TradeTag[] {
    const tags: TradeTag[] = [];

    // Based on P&L
    if (analysis.isLosing && Math.abs(analysis.pnl) > 1000) {
      tags.push(this.emotionTags.find(t => t.value === 'fearful')!);
      tags.push(this.emotionTags.find(t => t.value === 'anxious')!);
    } else if (analysis.isWinning && analysis.pnl > 1000) {
      tags.push(this.emotionTags.find(t => t.value === 'confident')!);
      tags.push(this.emotionTags.find(t => t.value === 'excited')!);
    }

    // Based on risk management
    if (!analysis.hasStopLoss) {
      tags.push(this.emotionTags.find(t => t.value === 'greedy')!);
    }

    return tags.filter(Boolean);
  }

  private suggestStrategyTags(trade: Trade, analysis: any): TradeTag[] {
    const tags: TradeTag[] = [];

    // Based on holding period
    if (analysis.holdingPeriodHours < 1) {
      tags.push(this.strategyTags.find(t => t.value === 'scalping')!);
    } else if (analysis.holdingPeriodHours > 48) {
      tags.push(this.strategyTags.find(t => t.value === 'swing')!);
    } else if (analysis.holdingPeriodHours > 168) { // More than a week
      tags.push(this.strategyTags.find(t => t.value === 'position')!);
    }

    // Based on existing strategy field
    if (trade.strategy) {
      const strategyLower = trade.strategy.toLowerCase();
      if (strategyLower.includes('trend')) {
        tags.push(this.strategyTags.find(t => t.value === 'trend-following')!);
      } else if (strategyLower.includes('breakout')) {
        tags.push(this.strategyTags.find(t => t.value === 'breakout')!);
      } else if (strategyLower.includes('reversal')) {
        tags.push(this.strategyTags.find(t => t.value === 'reversal')!);
      } else if (strategyLower.includes('value')) {
        tags.push(this.strategyTags.find(t => t.value === 'value-investing')!);
      } else if (strategyLower.includes('growth')) {
        tags.push(this.strategyTags.find(t => t.value === 'growth-investing')!);
      }
    }

    return tags.filter(Boolean);
  }

  private suggestRiskTags(trade: Trade, analysis: any): TradeTag[] {
    const tags: TradeTag[] = [];

    // Based on position size
    if (analysis.quantity > 100) {
      tags.push(this.riskTags.find(t => t.value === 'high-risk')!);
    } else if (analysis.quantity < 10) {
      tags.push(this.riskTags.find(t => t.value === 'conservative')!);
    }

    // Based on risk management
    if (analysis.hasStopLoss && analysis.hasTakeProfit) {
      tags.push(this.riskTags.find(t => t.value === 'calculated')!);
      tags.push(this.riskTags.find(t => t.value === 'proper-position-sizing')!);
    } else if (!analysis.hasStopLoss) {
      tags.push(this.riskTags.find(t => t.value === 'no-stop-loss')!);
    }

    return tags.filter(Boolean);
  }

  private suggestPatternTags(analysis: any, userContext?: any): TradeTag[] {
    const tags: TradeTag[] = [];

    // This would typically require user context and historical data
    // For now, we'll make some basic assumptions

    if (userContext?.recentTrades && userContext.recentTrades.length > 5) {
      const recentTrades = userContext.recentTrades;
      const timeBetweenTrades = this.calculateAverageTimeBetweenTrades(recentTrades);
      
      if (timeBetweenTrades < 60) { // Less than 1 hour between trades
        tags.push(this.patternTags.find(t => t.value === 'overtrading')!);
        tags.push(this.patternTags.find(t => t.value === 'impulsive')!);
      } else if (timeBetweenTrades > 1440) { // More than 1 day between trades
        tags.push(this.patternTags.find(t => t.value === 'patient')!);
      }
    }

    return tags.filter(Boolean);
  }

  private calculateAverageTimeBetweenTrades(trades: any[]): number {
    if (trades.length < 2) return 0;
    
    const sortedTrades = trades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let totalMinutes = 0;
    
    for (let i = 1; i < sortedTrades.length; i++) {
      const timeDiff = new Date(sortedTrades[i].entryDate).getTime() - new Date(sortedTrades[i-1].entryDate).getTime();
      totalMinutes += timeDiff / (1000 * 60);
    }
    
    return totalMinutes / (sortedTrades.length - 1);
  }

  private removeDuplicateTags(tags: TradeTag[]): TradeTag[] {
    const seen = new Set<string>();
    return tags.filter(tag => {
      if (seen.has(tag.id)) {
        return false;
      }
      seen.add(tag.id);
      return true;
    });
  }

  private generateReasoning(tags: TradeTag[], analysis: any): string[] {
    const reasoning: string[] = [];

    tags.forEach(tag => {
      switch (tag.type) {
        case 'emotion':
          if (tag.value === 'fearful') {
            reasoning.push('Large losing trade suggests fear-driven decision making');
          } else if (tag.value === 'confident') {
            reasoning.push('Profitable trade indicates confident trading approach');
          }
          break;
        case 'strategy':
          if (tag.value === 'scalping') {
            reasoning.push('Short holding period indicates scalping strategy');
          } else if (tag.value === 'swing') {
            reasoning.push('Multi-day holding period suggests swing trading');
          }
          break;
        case 'risk':
          if (tag.value === 'high-risk') {
            reasoning.push('Large position size indicates high-risk approach');
          } else if (tag.value === 'no-stop-loss') {
            reasoning.push('Missing stop-loss shows poor risk management');
          }
          break;
      }
    });

    return reasoning;
  }
}

export const tradeTaggingService = new TradeTaggingService();
