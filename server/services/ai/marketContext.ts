import { Trade } from "@shared/schema";

export interface IndianMarketContext {
  marketPhase: 'bull' | 'bear' | 'sideways' | 'volatile';
  keyEvents: MarketEvent[];
  sectorTrends: SectorTrend[];
  regulatoryEnvironment: RegulatoryUpdate[];
  marketSentiment: 'positive' | 'neutral' | 'negative';
  riskFactors: string[];
  opportunities: string[];
}

export interface MarketEvent {
  id: string;
  name: string;
  type: 'budget' | 'rbi_policy' | 'election' | 'festival' | 'earnings' | 'ipo' | 'global';
  date: Date;
  impact: 'high' | 'medium' | 'low';
  description: string;
  affectedSectors: string[];
}

export interface SectorTrend {
  sector: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: 'strong' | 'moderate' | 'weak';
  keyDrivers: string[];
  riskFactors: string[];
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  type: 'sebi' | 'rbi' | 'government' | 'exchange';
  date: Date;
  impact: 'high' | 'medium' | 'low';
  description: string;
  affectedAreas: string[];
}

export class IndianMarketContextProvider {
  private currentContext: IndianMarketContext;

  constructor() {
    this.currentContext = this.initializeMarketContext();
  }

  getCurrentContext(): IndianMarketContext {
    return this.currentContext;
  }

  updateContext(trades: Trade[]): IndianMarketContext {
    // Analyze recent trades to understand trader's market exposure
    const sectorExposure = this.analyzeSectorExposure(trades);
    const recentPerformance = this.analyzeRecentPerformance(trades);
    
    // Update context based on current market conditions and trader activity
    this.currentContext = {
      ...this.currentContext,
      sectorTrends: this.updateSectorTrends(sectorExposure),
      marketSentiment: this.determineMarketSentiment(recentPerformance),
      riskFactors: this.updateRiskFactors(trades),
      opportunities: this.identifyOpportunities(trades, sectorExposure)
    };

    return this.currentContext;
  }

  getContextualInsights(trades: Trade[]): string[] {
    const insights: string[] = [];
    const context = this.getCurrentContext();
    
    // Market phase insights
    switch (context.marketPhase) {
      case 'bull':
        insights.push("Current bull market conditions favor momentum strategies and growth stocks.");
        insights.push("Consider pyramiding winning positions and using trailing stop-losses.");
        break;
      case 'bear':
        insights.push("Bear market conditions require defensive positioning and capital preservation.");
        insights.push("Focus on quality stocks with strong balance sheets and reduce position sizes.");
        break;
      case 'volatile':
        insights.push("High volatility conditions require wider stop-losses and smaller position sizes.");
        insights.push("Consider range-bound strategies and avoid chasing momentum.");
        break;
      case 'sideways':
        insights.push("Sideways market conditions favor stock-specific strategies over index trading.");
        insights.push("Focus on relative strength and sector rotation opportunities.");
        break;
    }

    // Key events insights
    const upcomingEvents = context.keyEvents
      .filter(event => new Date(event.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    if (upcomingEvents.length > 0) {
      insights.push(`Upcoming key events: ${upcomingEvents.map(e => e.name).join(', ')}`);
      insights.push("Consider reducing exposure ahead of major events and maintaining liquidity.");
    }

    // Sector-specific insights
    const dominantSectors = this.getDominantSectors(trades);
    dominantSectors.forEach(sector => {
      const sectorTrend = context.sectorTrends.find(t => t.sector === sector);
      if (sectorTrend) {
        switch (sectorTrend.trend) {
          case 'bullish':
            insights.push(`${sector} sector showing bullish momentum - consider increasing exposure to quality stocks.`);
            break;
          case 'bearish':
            insights.push(`${sector} sector under pressure - consider reducing exposure or hedging positions.`);
            break;
          case 'neutral':
            insights.push(`${sector} sector in consolidation - stock selection is crucial, avoid index exposure.`);
            break;
        }
      }
    });

    // Regulatory insights
    const recentRegulatory = context.regulatoryEnvironment
      .filter(reg => {
        const daysSinceUpdate = (new Date().getTime() - new Date(reg.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate <= 30; // Last 30 days
      });

    if (recentRegulatory.length > 0) {
      insights.push("Recent regulatory changes may impact trading strategies - ensure compliance with new guidelines.");
    }

    return insights;
  }

  private initializeMarketContext(): IndianMarketContext {
    return {
      marketPhase: 'volatile', // Default to volatile for Indian markets
      keyEvents: this.getInitialMarketEvents(),
      sectorTrends: this.getInitialSectorTrends(),
      regulatoryEnvironment: this.getInitialRegulatoryUpdates(),
      marketSentiment: 'neutral',
      riskFactors: [
        'Global market volatility',
        'RBI monetary policy changes',
        'FIIs/DIIs flow volatility',
        'Geopolitical tensions',
        'Monsoon season impact'
      ],
      opportunities: [
        'PSU banking sector momentum',
        'IT sector correction opportunities',
        'Renewable energy growth story',
        'Defense sector government spending',
        'Digital economy expansion'
      ]
    };
  }

  private getInitialMarketEvents(): MarketEvent[] {
    const currentYear = new Date().getFullYear();
    
    return [
      {
        id: 'budget-2024',
        name: 'Union Budget 2024',
        type: 'budget',
        date: new Date(currentYear, 1, 1), // February 1st
        impact: 'high',
        description: 'Annual Union Budget announcement with potential tax changes and sector allocations',
        affectedSectors: ['Banking', 'Infrastructure', 'Auto', 'FMCG', 'Defense']
      },
      {
        id: 'rbi-policy-feb',
        name: 'RBI Monetary Policy',
        type: 'rbi_policy',
        date: new Date(currentYear, 1, 8), // February 8th
        impact: 'high',
        description: 'RBI monetary policy committee meeting on interest rates and liquidity measures',
        affectedSectors: ['Banking', 'Real Estate', 'Auto', 'Infrastructure']
      },
      {
        id: 'election-results',
        name: 'General Election Results',
        type: 'election',
        date: new Date(currentYear, 5, 4), // June 4th
        impact: 'high',
        description: 'Lok Sabha election results and government formation impact on markets',
        affectedSectors: ['All sectors']
      },
      {
        id: 'diwali-season',
        name: 'Diwali Festival Season',
        type: 'festival',
        date: new Date(currentYear, 10, 1), // November 1st (approximate)
        impact: 'medium',
        description: 'Diwali festival season with increased consumer spending and market activity',
        affectedSectors: ['FMCG', 'Auto', 'Jewelry', 'Retail', 'Banking']
      },
      {
        id: 'q2-earnings',
        name: 'Q2 Earnings Season',
        type: 'earnings',
        date: new Date(currentYear, 9, 15), // October 15th
        impact: 'medium',
        description: 'Second quarter earnings season for Indian companies',
        affectedSectors: ['All sectors']
      }
    ];
  }

  private getInitialSectorTrends(): SectorTrend[] {
    return [
      {
        sector: 'Banking',
        trend: 'bullish',
        momentum: 'moderate',
        keyDrivers: ['Credit growth', 'NPA improvement', 'Rate stability'],
        riskFactors: ['RBI policy changes', 'Geopolitical risks', 'Monsoon impact']
      },
      {
        sector: 'IT',
        trend: 'bearish',
        momentum: 'weak',
        keyDrivers: ['Global demand', 'Rupee movement', 'Deal pipeline'],
        riskFactors: ['Recession fears', 'H1B visa issues', 'Competition']
      },
      {
        sector: 'Auto',
        trend: 'neutral',
        momentum: 'moderate',
        keyDrivers: ['Festival demand', 'EV transition', 'Rural demand'],
        riskFactors: ['Input costs', 'Interest rates', 'Competition']
      },
      {
        sector: 'Infrastructure',
        trend: 'bullish',
        momentum: 'strong',
        keyDrivers: ['Government spending', 'Capex cycle', 'Order book'],
        riskFactors: ['Execution delays', 'Funding constraints', 'Policy changes']
      },
      {
        sector: 'FMCG',
        trend: 'neutral',
        momentum: 'weak',
        keyDrivers: ['Rural demand', 'Urban consumption', 'Input costs'],
        riskFactors: ['Inflation pressure', 'Competition', 'Monsoon impact']
      },
      {
        sector: 'Pharma',
        trend: 'bullish',
        momentum: 'moderate',
        keyDrivers: ['US FDA approvals', 'Domestic demand', 'R&D pipeline'],
        riskFactors: ['Regulatory risks', 'Competition', 'Pricing pressure']
      },
      {
        sector: 'Energy',
        trend: 'neutral',
        momentum: 'moderate',
        keyDrivers: ['Oil prices', 'Demand growth', 'Government policies'],
        riskFactors: ['Geopolitical risks', 'Regulatory changes', 'Transition risks']
      },
      {
        sector: 'Metals',
        trend: 'bearish',
        momentum: 'weak',
        keyDrivers: ['China demand', 'Global growth', 'Infrastructure spending'],
        riskFactors: ['Recession fears', 'Overcapacity', 'Environmental regulations']
      }
    ];
  }

  private getInitialRegulatoryUpdates(): RegulatoryUpdate[] {
    const currentDate = new Date();
    
    return [
      {
        id: 'sebi-margin-rules',
        title: 'SEBI New Margin Requirements',
        type: 'sebi',
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15),
        impact: 'high',
        description: 'SEBI introduces new margin requirements for intraday trading and F&O positions',
        affectedAreas: ['Intraday trading', 'F&O', 'Margin requirements', 'Leverage']
      },
      {
        id: 'rbi-liquidity-measures',
        title: 'RBI Liquidity Measures',
        type: 'rbi',
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 8),
        impact: 'medium',
        description: 'RBI announces liquidity measures to support market stability',
        affectedAreas: ['Banking liquidity', 'Interest rates', 'Money markets']
      },
      {
        id: 'fpi-investment-rules',
        title: 'FPI Investment Rules Update',
        type: 'sebi',
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1),
        impact: 'medium',
        description: 'SEBI updates FPI investment rules and compliance requirements',
        affectedAreas: ['FPI flows', 'Market liquidity', 'Compliance requirements']
      }
    ];
  }

  private analyzeSectorExposure(trades: Trade[]): Record<string, number> {
    const sectorExposure: Record<string, number> = {};
    
    trades.forEach(trade => {
      const sector = this.getSector(trade.symbol);
      const tradeValue = parseFloat(trade.quantity.toString()) * parseFloat(trade.entryPrice.toString());
      
      if (!sectorExposure[sector]) {
        sectorExposure[sector] = 0;
      }
      sectorExposure[sector] += tradeValue;
    });

    return sectorExposure;
  }

  private analyzeRecentPerformance(trades: Trade[]): {
    totalPnL: number;
    winRate: number;
    avgHoldingPeriod: number;
  } {
    const recentTrades = trades.filter(trade => {
      const daysSinceTrade = (new Date().getTime() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceTrade <= 30; // Last 30 days
    });

    const closedTrades = recentTrades.filter(t => t.status === 'closed' && t.pnl !== null);
    const winningTrades = closedTrades.filter(t => t.pnl !== null && parseFloat(t.pnl.toString()) > 0);
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl!.toString()), 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    const holdingPeriods = closedTrades
      .filter(t => t.exitDate && t.entryDate)
      .map(t => new Date(t.exitDate!).getTime() - new Date(t.entryDate).getTime());
    
    const avgHoldingPeriod = holdingPeriods.length > 0 
      ? holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length 
      : 0;

    return { totalPnL, winRate, avgHoldingPeriod };
  }

  private updateSectorTrends(sectorExposure: Record<string, number>): SectorTrend[] {
    const baseTrends = this.getInitialSectorTrends();
    
    return baseTrends.map(trend => {
      const exposure = sectorExposure[trend.sector] || 0;
      
      // Adjust momentum based on exposure (simplified logic)
      if (exposure > 100000) { // High exposure
        return {
          ...trend,
          momentum: trend.momentum === 'strong' ? 'strong' : 'moderate'
        };
      }
      
      return trend;
    });
  }

  private determineMarketSentiment(recentPerformance: any): 'positive' | 'neutral' | 'negative' {
    if (recentPerformance.totalPnL > 0 && recentPerformance.winRate > 50) {
      return 'positive';
    } else if (recentPerformance.totalPnL < 0 && recentPerformance.winRate < 40) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  private updateRiskFactors(trades: Trade[]): string[] {
    const baseRiskFactors = [
      'Global market volatility',
      'RBI monetary policy changes',
      'FIIs/DIIs flow volatility',
      'Geopolitical tensions',
      'Monsoon season impact'
    ];

    // Add trade-specific risk factors
    const sectorConcentration = this.analyzeSectorConcentration(trades);
    if (sectorConcentration > 0.6) {
      baseRiskFactors.push('High sector concentration risk');
    }

    const leverageRisk = this.analyzeLeverageRisk(trades);
    if (leverageRisk > 0.5) {
      baseRiskFactors.push('High leverage usage risk');
    }

    return baseRiskFactors;
  }

  private identifyOpportunities(trades: Trade[], sectorExposure: Record<string, number>): string[] {
    const baseOpportunities = [
      'PSU banking sector momentum',
      'IT sector correction opportunities',
      'Renewable energy growth story',
      'Defense sector government spending',
      'Digital economy expansion'
    ];

    // Add personalized opportunities based on current exposure
    const underExposedSectors = Object.entries(sectorExposure)
      .filter(([, exposure]) => exposure < 50000)
      .map(([sector]) => sector);

    underExposedSectors.forEach(sector => {
      baseOpportunities.push(`Consider increasing exposure to ${sector} sector`);
    });

    return baseOpportunities.slice(0, 8); // Limit to top 8 opportunities
  }

  private getDominantSectors(trades: Trade[]): string[] {
    const sectorCount: Record<string, number> = {};
    
    trades.forEach(trade => {
      const sector = this.getSector(trade.symbol);
      sectorCount[sector] = (sectorCount[sector] || 0) + 1;
    });

    return Object.entries(sectorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sector]) => sector);
  }

  private analyzeSectorConcentration(trades: Trade[]): number {
    const sectorCount: Record<string, number> = {};
    
    trades.forEach(trade => {
      const sector = this.getSector(trade.symbol);
      sectorCount[sector] = (sectorCount[sector] || 0) + 1;
    });

    const totalTrades = trades.length;
    const maxSectorTrades = Math.max(...Object.values(sectorCount));
    
    return maxSectorTrades / totalTrades;
  }

  private analyzeLeverageRisk(trades: Trade[]): number {
    // Simple leverage risk analysis based on position sizes
    const positionSizes = trades.map(t => parseFloat(t.quantity.toString()) * parseFloat(t.entryPrice.toString()));
    const avgPositionSize = positionSizes.reduce((a, b) => a + b, 0) / positionSizes.length;
    
    // Assume high leverage if position sizes are very large relative to average
    const largePositions = positionSizes.filter(size => size > avgPositionSize * 2).length;
    
    return largePositions / positionSizes.length;
  }

  private getSector(symbol: string): string {
    // Simplified sector mapping for Indian stocks
    const sectorMap: Record<string, string> = {
      'RELIANCE': 'Energy',
      'TCS': 'IT',
      'INFY': 'IT',
      'HDFCBANK': 'Banking',
      'ICICIBANK': 'Banking',
      'SBIN': 'Banking',
      'KOTAKBANK': 'Banking',
      'AXISBANK': 'Banking',
      'ITC': 'FMCG',
      'HINDUNILVR': 'FMCG',
      'BAJFINANCE': 'Financials',
      'SBILIFE': 'Insurance',
      'HDFCLIFE': 'Insurance',
      'MARUTI': 'Auto',
      'TATAMOTORS': 'Auto',
      'M&M': 'Auto',
      'ASIANPAINT': 'Paints',
      'NESTLEIND': 'FMCG',
      'ULTRACEMCO': 'Cement',
      'TATASTEEL': 'Metals',
      'JSWSTEEL': 'Metals',
      'COALINDIA': 'Energy',
      'ONGC': 'Energy',
      'NTPC': 'Energy',
      'POWERGRID': 'Power',
      'ADANIPORTS': 'Infrastructure',
      'LT': 'Infrastructure',
      'SUNPHARMA': 'Pharma',
      'DRREDDY': 'Pharma'
    };
    
    return sectorMap[symbol.toUpperCase()] || 'Other';
  }
}
