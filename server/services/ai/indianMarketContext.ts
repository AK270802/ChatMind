import { Trade } from "@shared/schema";

export interface IndianMarketEvent {
  type: 'budget' | 'festival' | 'ipo' | 'earnings' | 'policy' | 'holiday';
  name: string;
  date: Date;
  impact: 'high' | 'medium' | 'low';
  description: string;
  sectors: string[];
}

export interface MarketContext {
  currentSession: 'pre-market' | 'regular' | 'post-market' | 'closed';
  marketEvents: IndianMarketEvent[];
  sectorSentiment: Record<string, 'bullish' | 'bearish' | 'neutral'>;
  volatilityIndex: number;
  fiiDiiActivity: {
    fii: number; // Foreign Institutional Investors
    dii: number; // Domestic Institutional Investors
  };
}

export class IndianMarketContext {
  private marketEvents: IndianMarketEvent[] = [
    {
      type: 'budget',
      name: 'Union Budget 2024',
      date: new Date('2024-02-01'),
      impact: 'high',
      description: 'Annual Union Budget presentation by Finance Minister',
      sectors: ['banking', 'infrastructure', 'automobile', 'consumer']
    },
    {
      type: 'festival',
      name: 'Diwali Muhurat Trading',
      date: new Date('2024-11-01'),
      impact: 'medium',
      description: 'Special Diwali trading session with traditional Muhurat trading',
      sectors: ['all']
    },
    {
      type: 'holiday',
      name: 'Independence Day',
      date: new Date('2024-08-15'),
      impact: 'low',
      description: 'Market closed for Independence Day',
      sectors: ['all']
    }
  ];

  getCurrentMarketContext(): MarketContext {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Determine market session
    let currentSession: MarketContext['currentSession'] = 'closed';
    
    if (currentDay >= 1 && currentDay <= 5) { // Monday to Friday
      if (currentHour >= 9 && currentHour < 15) {
        currentSession = 'regular';
      } else if (currentHour >= 15 && currentHour < 16) {
        currentSession = 'post-market';
      } else if (currentHour >= 7 && currentHour < 9) {
        currentSession = 'pre-market';
      }
    }

    // Get upcoming market events
    const upcomingEvents = this.marketEvents.filter(event => {
      const daysDiff = Math.ceil((event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff <= 30; // Events within next 30 days
    });

    // Mock sector sentiment (in real implementation, this would come from market data APIs)
    const sectorSentiment: Record<string, 'bullish' | 'bearish' | 'neutral'> = {
      'banking': 'bullish',
      'technology': 'neutral',
      'pharmaceuticals': 'bearish',
      'automobile': 'bullish',
      'consumer': 'neutral',
      'energy': 'bearish',
      'infrastructure': 'bullish'
    };

    return {
      currentSession,
      marketEvents: upcomingEvents,
      sectorSentiment,
      volatilityIndex: 18.5, // Mock VIX value
      fiiDiiActivity: {
        fii: -1250, // FII net investment in crores (negative means selling)
        dii: 890    // DII net investment in crores
      }
    };
  }

  getRelevantContextForTrades(trades: Trade[]): string {
    const context = this.getCurrentMarketContext();
    const tradedSectors = this.extractSectors(trades);
    
    let contextString = `Current Market Context:\n`;
    contextString += `- Market Session: ${context.currentSession}\n`;
    contextString += `- Volatility Index (VIX): ${context.volatilityIndex}\n`;
    contextString += `- FII Activity: ${context.fiiDiiActivity.fii > 0 ? 'Buying' : 'Selling'} ₹${Math.abs(context.fiiDiiActivity.fii)} crore\n`;
    contextString += `- DII Activity: ${context.fiiDiiActivity.dii > 0 ? 'Buying' : 'Selling'} ₹${Math.abs(context.fiiDiiActivity.dii)} crore\n\n`;
    
    if (context.marketEvents.length > 0) {
      contextString += `Upcoming Market Events:\n`;
      context.marketEvents.forEach(event => {
        const daysUntil = Math.ceil((event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        contextString += `- ${event.name} in ${daysUntil} days (${event.impact} impact)\n`;
      });
      contextString += `\n`;
    }
    
    contextString += `Sector Sentiment for Your Trades:\n`;
    tradedSectors.forEach((sector: string) => {
      const sentiment = context.sectorSentiment[sector] || 'neutral';
      const emoji = sentiment === 'bullish' ? '📈' : sentiment === 'bearish' ? '📉' : '➡️';
      contextString += `- ${sector.charAt(0).toUpperCase() + sector.slice(1)}: ${emoji} ${sentiment.toUpperCase()}\n`;
    });
    
    return contextString;
  }

  private extractSectors(trades: Trade[]): string[] {
    const sectors = new Set<string>();
    for (const trade of trades) {
      sectors.add(this.getSector(trade.symbol));
    }
    return Array.from(sectors);
  }

  private getSector(symbol: string): string {
    // Simplified sector mapping - in production this would be more comprehensive
    const sectorMap: Record<string, string> = {
      'HDFCBANK': 'banking',
      'ICICIBANK': 'banking',
      'SBIN': 'banking',
      'AXISBANK': 'banking',
      'KOTAKBANK': 'banking',
      'TCS': 'technology',
      'INFY': 'technology',
      'WIPRO': 'technology',
      'HCLTECH': 'technology',
      'TECHM': 'technology',
      'SUNPHARMA': 'pharmaceuticals',
      'DRREDDY': 'pharmaceuticals',
      'CIPLA': 'pharmaceuticals',
      'LUPIN': 'pharmaceuticals',
      'DIVISLAB': 'pharmaceuticals',
      'TATAMOTORS': 'automobile',
      'MARUTI': 'automobile',
      'BAJAJ-AUTO': 'automobile',
      'HEROMOTOCO': 'automobile',
      'EICHERMOT': 'automobile',
      'HINDUNILVR': 'consumer',
      'ITC': 'consumer',
      'NESTLEIND': 'consumer',
      'BRITANNIA': 'consumer',
      'DABUR': 'consumer',
      'RELIANCE': 'energy',
      'ONGC': 'energy',
      'NTPC': 'energy',
      'POWERGRID': 'energy',
      'COALINDIA': 'energy',
      'LT': 'infrastructure',
      'ADANIPORTS': 'infrastructure',
      'SBILIFE': 'banking',
      'HDFCLIFE': 'banking',
      'ICICIGI': 'banking'
    };
    
    return sectorMap[symbol] || 'other';
  }
}

export const indianMarketContext = new IndianMarketContext();
