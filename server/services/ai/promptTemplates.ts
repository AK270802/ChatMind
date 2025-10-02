import { Trade } from "@shared/schema";

export interface PromptTemplate {
  name: string;
  systemPrompt: string;
  userPrompt: (trades: Trade[], context?: any) => string;
}

// Helper functions
const findConsecutiveLosses = (trades: Trade[]): number => {
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (const trade of trades) {
    if (trade.pnl && parseFloat(trade.pnl.toString()) < 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
};

const extractSectors = (trades: Trade[]): string[] => {
  const sectors = new Set<string>();
  for (const trade of trades) {
    sectors.add(getSector(trade.symbol));
  }
  return Array.from(sectors);
};

const analyzeSectorPerformance = (trades: Trade[], sectors: string[]): Record<string, any> => {
  const performance: Record<string, any> = {};
  
  for (const sector of sectors) {
    const sectorTrades = trades.filter(trade => getSector(trade.symbol) === sector);
    const winningTrades = sectorTrades.filter(t => t.pnl && parseFloat(t.pnl.toString()) > 0).length;
    const totalPnL = sectorTrades.reduce((sum, trade) => sum + (trade.pnl ? parseFloat(trade.pnl.toString()) : 0), 0);
    
    performance[sector] = {
      trades: sectorTrades.length,
      winRate: sectorTrades.length > 0 ? ((winningTrades / sectorTrades.length) * 100).toFixed(1) : 0,
      totalPnL
    };
  }
  
  return performance;
};

const getMostTradedSymbols = (trades: Trade[], limit: number): [string, number][] => {
  const symbolCounts: Record<string, number> = {};
  
  for (const trade of trades) {
    symbolCounts[trade.symbol] = (symbolCounts[trade.symbol] || 0) + 1;
  }
  
  return Object.entries(symbolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit) as [string, number][];
};

const getSector = (symbol: string): string => {
  const sectorMap: Record<string, string> = {
    // Oil & Gas
    'RELIANCE': 'Oil & Gas',
    'GAIL': 'Oil & Gas',
    'ONGC': 'Oil & Gas',
    'IOC': 'Oil & Gas',
    'BPCL': 'Oil & Gas',
    'HINDPETRO': 'Oil & Gas',
    'COALINDIA': 'Oil & Gas',
    
    // IT
    'TCS': 'IT',
    'INFY': 'IT',
    'WIPRO': 'IT',
    'TECHM': 'IT',
    'HCLTECH': 'IT',
    
    // Banking
    'HDFCBANK': 'Banking',
    'ICICIBANK': 'Banking',
    'KOTAKBANK': 'Banking',
    'SBIN': 'Banking',
    'AXISBANK': 'Banking',
    'INDUSINDBK': 'Banking',
    'HDFC': 'Banking',
    'FEDERALBNK': 'Banking',
    'IDFCFIRSTB': 'Banking',
    'PNB': 'Banking',
    'BANKBARODA': 'Banking',
    'CANBK': 'Banking',
    'UNIONBANK': 'Banking',
    'MAHABANK': 'Banking',
    'BANKINDIA': 'Banking',
    'IOB': 'Banking',
    'CUB': 'Banking',
    'KARURVYSYA': 'Banking',
    'RBLBANK': 'Banking',
    'YESBANK': 'Banking',
    'IDBI': 'Banking',
    
    // Financial Services
    'BAJFINANCE': 'Financial Services',
    'BAJAJFINSV': 'Financial Services',
    'JIOFIN': 'Financial Services',
    
    // Insurance
    'SBILIFE': 'Insurance',
    'HDFCLIFE': 'Insurance',
    'ICICIGI': 'Insurance',
    'MAXLIFE': 'Insurance',
    
    // Auto
    'TATAMOTORS': 'Auto',
    'MARUTI': 'Auto',
    'M&M': 'Auto',
    'EICHERMOT': 'Auto',
    'ASHOKLEY': 'Auto',
    'BAJAJAUTO': 'Auto',
    'HEROMOTOCO': 'Auto',
    'TVSMOTOR': 'Auto',
    'FORCEMOT': 'Auto',
    
    // Auto Ancillary
    'BOSCHLTD': 'Auto Ancillary',
    'BharatForge': 'Auto Ancillary',
    'MOTHERSON': 'Auto Ancillary',
    'APOLLOTYRE': 'Auto Ancillary',
    'MRF': 'Auto Ancillary',
    'CEAT': 'Auto Ancillary',
    'JKTYRE': 'Auto Ancillary',
    'BALKRISIND': 'Auto Ancillary',
    'EXIDEIND': 'Auto Ancillary',
    'AMARAJABAT': 'Auto Ancillary',
    
    // Telecom
    'BHARTIARTL': 'Telecom',
    'IDEA': 'Telecom',
    
    // FMCG
    'TATACONSUM': 'FMCG',
    'HINDUNILVR': 'FMCG',
    'ITC': 'FMCG',
    'NESTLEIND': 'FMCG',
    'DABUR': 'FMCG',
    'BRITANNIA': 'FMCG',
    'VADILALIND': 'FMCG',
    'COLPAL': 'FMCG',
    'GODREJCP': 'FMCG',
    'MARICO': 'FMCG',
    'RADICO': 'FMCG',
    'UBL': 'FMCG',
    'VBL': 'FMCG',
    
    // Paints
    'ASIANPAINT': 'Paints',
    'BERGEPAINT': 'Paints',
    'KANSAINER': 'Paints',
    
    // Cement
    'SHREECEM': 'Cement',
    'ULTRACEMCO': 'Cement',
    'ACC': 'Cement',
    'AMBUJACEM': 'Cement',
    'INDIACEM': 'Cement',
    'BIRLACORPN': 'Cement',
    'JKCEMENT': 'Cement',
    'DALBHARAT': 'Cement',
    'DECCANCE': 'Cement',
    'HEIDELBERG': 'Cement',
    'ORIENTCEM': 'Cement',
    'SANGHIIND': 'Cement',
    'STARCEM': 'Cement',
    'WATERBASE': 'Cement',
    'GUJALKALI': 'Cement',
    'JKLAKSHMI': 'Cement',
    'BANG': 'Cement',
    'RAMCOCEM': 'Cement',
    
    // Metals
    'JSWSTEEL': 'Metals',
    'TATASTEEL': 'Metals',
    'HINDALCO': 'Metals',
    'VEDL': 'Metals',
    'NMDC': 'Metals',
    'SAIL': 'Metals',
    'MOIL': 'Metals',
    'NATIONALUM': 'Metals',
    'JINDALSTEL': 'Metals',
    
    // Infrastructure
    'ADANIENT': 'Infrastructure',
    'ADANIPORTS': 'Infrastructure',
    'LT': 'Infrastructure',
    'GMRINFRA': 'Infrastructure',
    
    // Pharma
    'SUNPHARMA': 'Pharma',
    'DRREDDY': 'Pharma',
    'CIPLA': 'Pharma',
    'LUPIN': 'Pharma',
    'AUROPHARMA': 'Pharma',
    'DIVISLAB': 'Pharma',
    'TORNTPHARM': 'Pharma',
    'WOCKPHARMA': 'Pharma',
    'CADILAHC': 'Pharma',
    'BIOCON': 'Pharma',
    'PIIND': 'Pharma',
    'ALKEM': 'Pharma',
    'GLENMARK': 'Pharma',
    'IPCALAB': 'Pharma',
    'LAURUSLABS': 'Pharma',
    'SYNGENE': 'Pharma',
    
    // Healthcare
    'LALPATHLAB': 'Healthcare',
    'APOLLOHOSP': 'Healthcare',
    'FORTIS': 'Healthcare',
    'MAXHEALTH': 'Healthcare',
    'NARAYANAHR': 'Healthcare',
    
    // Real Estate
    'SUNTECK': 'Real Estate',
    'DLF': 'Real Estate',
    'OBEROIRLTY': 'Real Estate',
    'PRESTIGE': 'Real Estate',
    'PHOENIXLTD': 'Real Estate',
    'BRIGADE': 'Real Estate',
    'GODREJPROP': 'Real Estate',
    'UNITECH': 'Real Estate',
    'HDIL': 'Real Estate',
    'IBREALEST': 'Real Estate',
    'ANANTRAJ': 'Real Estate',
    
    // Media & Entertainment
    'PVR': 'Media & Entertainment',
    'INOXLEISURE': 'Media & Entertainment',
    'ZEEENT': 'Media & Entertainment',
    'SUNTV': 'Media & Entertainment',
    'NETWORK18': 'Media & Entertainment',
    'TV18BRDCST': 'Media & Entertainment',
    'DISHTV': 'Media & Entertainment',
    
    // Internet
    'NAUKRI': 'Internet',
    'PAGEIND': 'Internet',
    'JUSTDIAL': 'Internet',
    'INFOEDGE': 'Internet',
    'MATRIMONY': 'Internet',
    
    // Consumer Durables
    'TITAN': 'Consumer Durables',
    'WHIRLPOOL': 'Consumer Durables',
    'VOLTAS': 'Consumer Durables',
    'CROMPTON': 'Consumer Durables',
    'HAVELLS': 'Consumer Durables',
    
    // Power
    'TATAPOWER': 'Power',
    'ADANIPOWER': 'Power',
    'JSWENERGY': 'Power',
    'NHPC': 'Power',
    'NLCINDIA': 'Power',
    'PTC': 'Power',
    'TORNTPOWER': 'Power',
    'POWERGRID': 'Power',
    'NTPC': 'Power',
    'SJVN': 'Power',
    'CESC': 'Power',
    
    // Textiles
    'WELSPUNIND': 'Textiles',
    'ARVIND': 'Textiles',
    'BOMBAYDYEING': 'Textiles',
    'CENTURYTEX': 'Textiles',
    'HIMATSEIDE': 'Textiles',
    'SUTLEJTEX': 'Textiles',
    'TRIDENT': 'Textiles',
    'TCNSBRANDS': 'Textiles',
    'RAYMOND': 'Textiles',
    'SRF': 'Textiles',
    'KPRMILL': 'Textiles',
    
    // Chemicals
    'HIKAL': 'Chemicals',
    'AARTIIND': 'Chemicals',
    'CHAMBLFERT': 'Chemicals',
    'COROMANDEL': 'Chemicals',
    'DEEPAKFERT': 'Chemicals',
    'GUJFLUORO': 'Chemicals',
    'INDOAMIN': 'Chemicals',
    'JUBLPHARMA': 'Chemicals',
    'LINDEINDIA': 'Chemicals',
    'SOLARINDS': 'Chemicals',
    'SUMICHEM': 'Chemicals',
    'TATACHEM': 'Chemicals',
    'UVSL': 'Chemicals',
    
    // Capital Goods
    'SIEMENS': 'Capital Goods',
    'ABB': 'Capital Goods',
    'BHEL': 'Capital Goods',
    'CUMMINSIND': 'Capital Goods',
    'THERMAX': 'Capital Goods',
    'WELCORP': 'Capital Goods',
    'ALOKINDS': 'Capital Goods',
    'AMTEKAUTO': 'Capital Goods',
    'ANUJ': 'Capital Goods',
    'APARINDS': 'Capital Goods',
    'ARE&M': 'Capital Goods',
    'ARTEMIS': 'Capital Goods'
  };
  
  return sectorMap[symbol.toUpperCase()] || 'Other';
};

export const promptTemplates: Record<string, PromptTemplate> = {
  dailyAnalysis: {
    name: 'Daily Trading Analysis',
    systemPrompt: `You are an expert trading coach specializing in the Indian stock market. Your role is to provide personalized, actionable feedback based on the trader's performance.

Key considerations for Indian market context:
- NSE and BSE trading hours: 9:15 AM to 3:30 PM IST
- Indian market events: Budget announcements, RBI policy decisions, festival seasons
- Common Indian trader psychology: Emotional trading during market volatility, overtrading tendencies
- Regulatory environment: SEBI guidelines, circuit breakers, settlement cycles

Your analysis should be:
1. Specific and data-driven
2. Culturally relevant to Indian traders
3. Actionable with clear next steps
4. Supportive but honest about areas for improvement
5. Focused on risk management and discipline

Always provide your response in this format:
## Key Insights
[2-3 key observations about their trading]

## Strengths
[What they're doing well]

## Areas for Improvement
[Specific areas needing attention]

## Actionable Recommendations
[Concrete steps they can take]

## Market Context
[Any relevant Indian market context]`,
    userPrompt: (trades: Trade[], context?: any) => {
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.pnl && parseFloat(t.pnl.toString()) > 0).length;
      const losingTrades = trades.filter(t => t.pnl && parseFloat(t.pnl.toString()) < 0).length;
      const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
      
      const totalPnL = trades.reduce((sum, trade) => {
        return sum + (trade.pnl ? parseFloat(trade.pnl.toString()) : 0);
      }, 0);
      
      const avgWin = winningTrades > 0 ? 
        trades.filter(t => t.pnl && parseFloat(t.pnl.toString()) > 0)
          .reduce((sum, trade) => sum + parseFloat(trade.pnl!.toString()), 0) / winningTrades : 0;
      
      const avgLoss = losingTrades > 0 ?
        trades.filter(t => t.pnl && parseFloat(t.pnl.toString()) < 0)
          .reduce((sum, trade) => sum + Math.abs(parseFloat(trade.pnl!.toString())), 0) / losingTrades : 0;

      return `Analyze the following trading data for an Indian trader:

Trading Statistics:
- Total Trades: ${totalTrades}
- Winning Trades: ${winningTrades}
- Losing Trades: ${losingTrades}
- Win Rate: ${winRate}%
- Total P&L: ₹${totalPnL.toFixed(2)}
- Average Win: ₹${avgWin.toFixed(2)}
- Average Loss: ₹${avgLoss.toFixed(2)}

Recent Trades:
${trades.slice(-10).map(trade => 
  `- ${trade.symbol}: ${trade.type} ${trade.quantity} @ ₹${trade.entryPrice} → ${trade.exitPrice || 'Open'} P&L: ₹${trade.pnl || 'N/A'}`
).join('\n')}

Additional Context:
- Trading Experience: ${context?.tradingExperience || 'Not specified'}
- Risk Tolerance: ${context?.riskTolerance || 'Moderate'}
- Current Market Focus: ${context?.marketFocus || 'Indian equities'}

Please provide comprehensive analysis and recommendations for improvement.`;
    }
  },

  behavioralAnalysis: {
    name: 'Behavioral Trading Analysis',
    systemPrompt: `You are a behavioral finance expert specializing in Indian trader psychology. Your focus is on identifying psychological patterns, emotional biases, and behavioral tendencies that affect trading performance.

Indian Trader Psychology Context:
- High emotional attachment to stocks (cultural bias towards long-term holding)
- Overconfidence during bull markets, fear during bear markets
- Social influence from family/friends on trading decisions
- Tendency to trade based on news and rumors
- Difficulty in accepting losses quickly

Your analysis should identify:
1. Emotional patterns in trading (fear, greed, FOMO, panic)
2. Behavioral biases (overtrading, revenge trading, position sizing issues)
3. Psychological strengths and weaknesses
4. Specific behavioral recommendations
5. Mindset improvement strategies

Format your response as:
## Behavioral Insights
[Key psychological observations]

## Emotional Patterns
[Identified emotional tendencies]

## Behavioral Biases
[Specific biases affecting performance]

## Mindset Recommendations
[Psychological improvement strategies]

## Action Steps
[Concrete behavioral changes]`,
    userPrompt: (trades: Trade[], context?: any) => {
      // Analyze trading patterns for behavioral insights
      const tradesByDay = trades.reduce((acc, trade) => {
        const date = new Date(trade.entryDate).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(trade);
        return acc;
      }, {} as Record<string, Trade[]>);
      
      const avgTradesPerDay = Object.values(tradesByDay).reduce((sum, dayTrades) => sum + dayTrades.length, 0) / Object.keys(tradesByDay).length;
      const maxTradesInDay = Math.max(...Object.values(tradesByDay).map(dayTrades => dayTrades.length));
      
      const consecutiveLosses = findConsecutiveLosses(trades);
      const quickExits = trades.filter(trade => 
        trade.exitDate && trade.entryDate && 
        (new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) < 24 * 60 * 60 * 1000
      ).length;

      return `Analyze the behavioral patterns of this Indian trader:

Trading Behavior Data:
- Average Trades Per Day: ${avgTradesPerDay.toFixed(1)}
- Maximum Trades in Single Day: ${maxTradesInDay}
- Quick Exits (Same Day): ${quickExits}
- Longest Consecutive Loss Streak: ${consecutiveLosses}

Trading Frequency Pattern:
${Object.entries(tradesByDay).slice(-7).map(([date, dayTrades]) => 
  `${date}: ${dayTrades.length} trades`
).join('\n')}

Recent Performance Pattern:
${trades.slice(-5).map((trade, index) => {
  const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 0;
  const emoji = pnl > 0 ? '📈' : pnl < 0 ? '📉' : '➡️';
  return `${emoji} ${trade.symbol}: ${trade.type} → ${pnl > 0 ? '+' : ''}₹${Math.abs(pnl).toFixed(2)}`;
}).join('\n')}

Trader Profile:
- Experience Level: ${context?.tradingExperience || 'Unknown'}
- Risk Tolerance: ${context?.riskTolerance || 'Unknown'}
- Common Strategy: ${context?.preferredStrategy || 'Unknown'}

Provide detailed behavioral analysis and psychological recommendations.`;
    }
  },

  marketContext: {
    name: 'Indian Market Context Analysis',
    systemPrompt: `You are an expert in Indian stock market analysis with deep knowledge of:
- NSE, BSE, and MCX operations
- Indian economic indicators and their market impact
- Sector-specific trends and cycles
- Regulatory changes by SEBI and RBI
- Indian corporate actions and their effects
- Festival seasons and market behavior patterns
- Budget announcements and policy impacts
- Global market influences on Indian markets

Your analysis should:
1. Connect trading performance to current market conditions
2. Identify sector-specific opportunities and risks
3. Consider regulatory and economic factors
4. Provide market-aware recommendations
5. Suggest strategies aligned with current market trends

Format your response as:
## Market Context
[Current Indian market conditions]

## Sector Analysis
[Relevant sector performance and outlook]

## Regulatory Environment
[Key SEBI/RBI considerations]

## Market-Aligned Strategies
[Strategies suited for current conditions]

## Risk Considerations
[Market-specific risk factors]`,
    userPrompt: (trades: Trade[], context?: any) => {
      const sectors = extractSectors(trades);
      const sectorPerformance = analyzeSectorPerformance(trades, sectors);
      
      return `Analyze this trader's performance in the context of current Indian market conditions:

Trader's Sector Exposure:
${Object.entries(sectorPerformance).map(([sector, perf]) => 
  `${sector}: ${perf.trades} trades, ${perf.winRate}% win rate, ₹${(perf as any).totalPnL.toFixed(2)} P&L`
).join('\n')}

Most Traded Symbols:
${getMostTradedSymbols(trades, 5).map(([symbol, count]) => 
  `${symbol}: ${count} trades`
).join('\n')}

Recent Trading Activity:
${trades.slice(-5).map(trade => 
  `${trade.symbol} (${getSector(trade.symbol)}): ${trade.type} → ₹${trade.pnl || 'N/A'}`
).join('\n')}

Current Market Context (provided):
- Market Phase: ${context?.marketPhase || 'Unknown'}
- Key Events: ${context?.keyEvents || 'None specified'}
- Sector Focus: ${context?.sectorFocus || 'Diversified'}

Provide market-contextual analysis and recommendations specific to Indian market conditions.`;
    }
  }
};

