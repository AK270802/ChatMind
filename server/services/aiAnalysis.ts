import { Trade } from "@shared/schema";
import { multiModelClient, AIMessage } from "./ai/multiModelClient";
import { promptTemplates } from "./ai/promptTemplates";
import { coachPersonas, getCoachPersona, adaptPromptForPersona } from "./ai/coachPersonas";
import { ExplainableAIEngine, ExplainableAnalysis } from "./ai/explainableAI";
import { IndianMarketContextProvider } from "./ai/marketContext";
import { indianMarketContext } from "./ai/indianMarketContext";

export interface AIInsight {
  type: 'positive' | 'warning' | 'suggestion' | 'metric';
  icon: string;
  message: string;
  confidence?: number;
  evidence?: string[];
  actionable?: string;
}

export interface AIAnalysisResult {
  insights: AIInsight[];
  improvements: string[];
  metrics: {
    winRate: number;
    avgWinningTrade: number;
    avgLosingTrade: number;
    profitFactor: number;
    riskRewardRatio: number;
    maxDrawdown: number;
    avgHoldingPeriod: number;
  };
  recommendations: string[];
  explainableAnalysis?: ExplainableAnalysis;
  marketContext?: string[];
  coachPersona?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
  modelUsed?: string;
  reportId?: string;
  generatedAt?: string;
}

/**
 * Enhanced AI analysis function with Ollama integration, coach personas, and explainable AI
 * Provides contextual analysis for Indian traders with multiple coaching approaches
 */
export async function generateAIAnalysis(
  trades: Trade[], 
  traderProfile?: any,
  coachPersonaId: string = 'mentor-guru'
): Promise<AIAnalysisResult> {
  try {
    // Get Indian market context
    const marketContext = indianMarketContext.getCurrentMarketContext();
    const marketContextString = indianMarketContext.getRelevantContextForTrades(trades);
    
    // Get coach persona
    const coachPersona = getCoachPersona(coachPersonaId);
    
    // Calculate basic metrics
    const metrics = calculateMetrics(trades);
    
    // Initialize explainable AI engine
    const explainableEngine = new ExplainableAIEngine(coachPersona);
    
    // Generate explainable analysis
    const explainableAnalysis = await explainableEngine.generateExplainableAnalysis(trades, {
      ...traderProfile,
      marketContext: marketContextString
    });
    
    // Prepare context for AI analysis
    const context = {
      metrics,
      tradeCount: trades.length,
      totalPnL: trades.reduce((sum: number, trade: Trade) => sum + getPnL(trade), 0),
      marketContext: marketContextString,
      traderExperience: traderProfile?.experienceLevel || 'beginner',
      riskTolerance: traderProfile?.riskTolerance || 'moderate',
      tradingGoals: traderProfile?.goals || ['profitability', 'consistency']
    };
    
    // Get the appropriate prompt template
    const template = promptTemplates.dailyAnalysis;
    
    // Adapt prompt for the selected coach persona
    const messages = adaptPromptForPersona(
      template.systemPrompt,
      coachPersona,
      trades,
      context
    );
    
    // Add Indian market context to the user prompt
    const userMessage = messages.find(m => m.role === 'user');
    if (userMessage) {
      userMessage.content += `\n\n=== INDIAN MARKET CONTEXT ===\n${marketContextString}`;
    }
    
    // Generate AI response using multi-model client (Ollama with fallbacks)
    const aiResponse = await multiModelClient.generateResponse(messages);
    
    // Parse AI response to extract insights
    const insights = parseAIResponse(aiResponse.content);
    
    // Convert explainable insights to AI insights
    const explainableInsights = convertExplainableToAIInsights(explainableAnalysis.insights);
    
    // Combine insights from both sources
    const allInsights = [...insights, ...explainableInsights];
    
    // Extract recommendations from AI response
    const recommendations = extractRecommendations(aiResponse.content);
    
    // Add market-specific recommendations based on context
    const marketRecommendations = generateMarketSpecificRecommendations(marketContext, trades);
    
    return {
      insights: allInsights,
      improvements: recommendations,
      metrics,
      recommendations: [...recommendations, ...marketRecommendations],
      explainableAnalysis,
      marketContext: [marketContextString],
      coachPersona: {
        id: coachPersona.id,
        name: coachPersona.name,
        description: coachPersona.description,
        icon: coachPersona.icon,
        color: coachPersona.color
      },
      modelUsed: aiResponse.model,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return generateFallbackAnalysis(trades);
  }
}

/**
 * Generate market-specific recommendations based on Indian market context
 */
function generateMarketSpecificRecommendations(marketContext: any, trades: Trade[]): string[] {
  const recommendations: string[] = [];
  
  // Check for high volatility periods
  if (marketContext.volatilityIndex > 20) {
    recommendations.push('Consider reducing position sizes during high volatility periods (VIX > 20)');
  }
  
  // Check FII/DII activity
  if (marketContext.fiiDiiActivity.fii < -1000) {
    recommendations.push('FII selling pressure detected - maintain defensive positions and strict stop-losses');
  }
  
  if (marketContext.fiiDiiActivity.dii > 500) {
    recommendations.push('DII buying support present - look for quality stock opportunities');
  }
  
  // Check for upcoming market events
  if (marketContext.marketEvents.length > 0) {
    const highImpactEvents = marketContext.marketEvents.filter((e: any) => e.impact === 'high');
    if (highImpactEvents.length > 0) {
      recommendations.push('Major market events approaching - consider reducing exposure and hedging positions');
    }
  }
  
  // Check market session timing
  if (marketContext.currentSession === 'pre-market') {
    recommendations.push('Pre-market session active - monitor gap openings and adjust entry strategies');
  } else if (marketContext.currentSession === 'post-market') {
    recommendations.push('Post-market session - review day\'s performance and plan for tomorrow');
  }
  
  return recommendations;
}

/**
 * Calculate trading metrics from trade data
 */
function calculateMetrics(trades: Trade[]) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== null);
  const winningTrades = closedTrades.filter(t => t.pnl !== null && parseFloat(t.pnl.toString()) > 0);
  const losingTrades = closedTrades.filter(t => t.pnl !== null && parseFloat(t.pnl.toString()) < 0);
  
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const avgWinningTrade = winningTrades.length > 0 ?
    winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl!.toString()), 0) / winningTrades.length : 0;
  
  const avgLosingTrade = losingTrades.length > 0 ?
    Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl!.toString()), 0) / losingTrades.length) : 0;
  
  const profitFactor = avgLosingTrade > 0 ? avgWinningTrade / avgLosingTrade : 0;
  
  // Simple risk-reward ratio calculation
  const riskRewardRatio = avgLosingTrade > 0 ? avgWinningTrade / avgLosingTrade : 0;
  
  // Calculate max drawdown (simplified)
  const pnlSeries = closedTrades.map(t => parseFloat(t.pnl!.toString()));
  const cumulativePnL = pnlSeries.reduce((acc, pnl, index) => {
    const prevCumulative = index > 0 ? acc[index - 1] : 0;
    acc.push(prevCumulative + pnl);
    return acc;
  }, [] as number[]);
  
  const maxCumulative = Math.max(...cumulativePnL);
  const minCumulative = Math.min(...cumulativePnL);
  const maxDrawdown = maxCumulative > 0 ? ((maxCumulative - minCumulative) / maxCumulative) * 100 : 0;
  
  // Calculate average holding period
  const holdingPeriods = closedTrades
    .filter(t => t.exitDate && t.entryDate)
    .map(t => new Date(t.exitDate!).getTime() - new Date(t.entryDate).getTime());
  
  const avgHoldingPeriod = holdingPeriods.length > 0 ?
    holdingPeriods.reduce((sum, period) => sum + period, 0) / holdingPeriods.length : 0;
  
  return {
    winRate: Math.round(winRate * 100) / 100,
    avgWinningTrade: Math.round(avgWinningTrade * 100) / 100,
    avgLosingTrade: Math.round(avgLosingTrade * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    avgHoldingPeriod: Math.round(avgHoldingPeriod / (1000 * 60 * 60 * 24) * 100) / 100 // Convert to days
  };
}

/**
 * Convert explainable insights to AI insights format
 */
function convertExplainableToAIInsights(explainableInsights: any[]): AIInsight[] {
  return explainableInsights.map(insight => {
    let icon = '💡';
    let type: AIInsight['type'] = 'suggestion';
    
    switch (insight.type) {
      case 'strength':
        icon = '🎯';
        type = 'positive';
        break;
      case 'weakness':
        icon = '⚠️';
        type = 'warning';
        break;
      case 'opportunity':
        icon = '🚀';
        type = 'suggestion';
        break;
      case 'risk':
        icon = '🛡️';
        type = 'warning';
        break;
    }
    
    return {
      type,
      icon,
      message: insight.title,
      confidence: insight.confidence,
      evidence: insight.evidence,
      actionable: insight.actionable
    };
  });
}

/**
 * Parse AI response and extract insights
 */
function parseAIResponse(aiResponse: string): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Extract key insights from AI response
  const lines = aiResponse.split('\n');
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('##')) {
      currentSection = trimmed.replace('##', '').trim().toLowerCase();
    } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      const insightText = trimmed.replace(/^[-•*]\s*/, '');
      
      if (currentSection.includes('key insights') || currentSection.includes('strengths')) {
        insights.push({
          type: 'positive',
          icon: '🎯',
          message: insightText,
          confidence: 0.8
        });
      } else if (currentSection.includes('areas for improvement') || currentSection.includes('weaknesses')) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          message: insightText,
          confidence: 0.8
        });
      } else if (currentSection.includes('recommendations') || currentSection.includes('actionable')) {
        insights.push({
          type: 'suggestion',
          icon: '💡',
          message: insightText,
          confidence: 0.7
        });
      }
    }
  }
  
  return insights;
}

/**
 * Extract recommendations from AI response
 */
function extractRecommendations(aiResponse: string): string[] {
  const recommendations: string[] = [];
  const lines = aiResponse.split('\n');
  let inRecommendationsSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('recommendations') || trimmed.toLowerCase().includes('actionable')) {
      inRecommendationsSection = true;
      continue;
    }
    
    if (inRecommendationsSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
      recommendations.push(trimmed.replace(/^[-•*]\s*/, ''));
    }
    
    if (trimmed.startsWith('##') && !trimmed.toLowerCase().includes('recommendations')) {
      inRecommendationsSection = false;
    }
  }
  
  return recommendations;
}

/**
 * Generate fallback recommendations when Ollama is not available
 */
function generateFallbackRecommendations(metrics: any, trades: Trade[]): string[] {
  const recommendations: string[] = [];
  
  if (metrics.winRate < 45) {
    recommendations.push('Focus on improving your trade selection criteria and timing');
    recommendations.push('Consider paper trading to refine your strategy before risking real capital');
  }
  
  if (metrics.profitFactor < 1.5) {
    recommendations.push('Aim for higher risk-reward ratios (minimum 1:2)');
    recommendations.push('Let your winning trades run and cut losses quickly');
  }
  
  if (metrics.maxDrawdown > 20) {
    recommendations.push('Implement stricter risk management rules');
    recommendations.push('Reduce position sizes during losing streaks');
  }
  
  if (trades.length > 0) {
    const tradesWithStopLoss = trades.filter(t => t.stopLoss !== null && t.stopLoss !== undefined);
    const stopLossRate = (tradesWithStopLoss.length / trades.length) * 100;
    
    if (stopLossRate < 70) {
      recommendations.push('Always use stop-loss orders to limit downside risk');
      recommendations.push('Set stop-losses at logical support/resistance levels');
    }
  }
  
  // Add general trading advice
  recommendations.push('Keep a detailed trading journal to track your progress');
  recommendations.push('Review your trades regularly to identify patterns and areas for improvement');
  recommendations.push('Focus on risk management first, profits will follow');
  
  return recommendations;
}

/**
 * Generate fallback analysis when AI system fails
 */
function generateFallbackAnalysis(trades: Trade[]): AIAnalysisResult {
  const metrics = calculateMetrics(trades);
  
  const insights: AIInsight[] = [
    {
      type: 'metric',
      icon: '📊',
      message: `Win Rate: ${metrics.winRate}%`
    },
    {
      type: 'metric',
      icon: '💰',
      message: `Profit Factor: ${metrics.profitFactor}`
    },
    {
      type: 'suggestion',
      icon: '💡',
      message: 'Focus on risk management and consistent strategy execution'
    }
  ];
  
  const improvements = [
    'Review and refine your entry criteria',
    'Implement consistent position sizing',
    'Use stop-loss orders for all trades'
  ];
  
  const recommendations = [
    'Keep a detailed trading journal',
    'Analyze your winning and losing trades',
    'Focus on process over outcomes',
    'Implement proper risk management'
  ];
  
  return {
    insights,
    improvements,
    metrics,
    recommendations
  };
}

// Helper function to safely get P&L value
function getPnL(trade: Trade): number {
  return trade.pnl ? parseFloat(trade.pnl.toString()) : 0;
}

// Helper function to check if trade has positive P&L
function isWinningTrade(trade: Trade): boolean {
  return trade.pnl !== null && parseFloat(trade.pnl.toString()) > 0;
}

// Helper function to check if trade has negative P&L
function isLosingTrade(trade: Trade): boolean {
  return trade.pnl !== null && parseFloat(trade.pnl.toString()) < 0;
}

/**
 * Generate a downloadable report in various formats
 */
export function generateDownloadableReport(analysis: AIAnalysisResult, format: 'pdf' | 'csv' | 'json' = 'json'): string {
  const reportData = {
    title: 'AI Trading Analysis Report',
    generatedAt: analysis.generatedAt,
    modelUsed: analysis.modelUsed,
    coachPersona: analysis.coachPersona,
    metrics: analysis.metrics,
    insights: analysis.insights,
    recommendations: analysis.recommendations,
    improvements: analysis.improvements,
    marketContext: analysis.marketContext
  };

  switch (format) {
    case 'json':
      return JSON.stringify(reportData, null, 2);
    
    case 'csv':
      const csvRows = [
        ['Metric', 'Value'],
        ['Win Rate', `${analysis.metrics.winRate}%`],
        ['Average Winning Trade', `$${analysis.metrics.avgWinningTrade}`],
        ['Average Losing Trade', `$${analysis.metrics.avgLosingTrade}`],
        ['Profit Factor', analysis.metrics.profitFactor],
        ['Risk-Reward Ratio', analysis.metrics.riskRewardRatio],
        ['Max Drawdown', `${analysis.metrics.maxDrawdown}%`],
        ['Average Holding Period', `${analysis.metrics.avgHoldingPeriod} days`],
        ['', ''],
        ['Insight Type', 'Message'],
        ...analysis.insights.map(insight => [insight.type, insight.message]),
        ['', ''],
        ['Recommendation'],
        ...analysis.recommendations.map(rec => [rec])
      ];
      return csvRows.map(row => row.join(',')).join('\n');
    
    case 'pdf':
      // For PDF generation, we'll return HTML that can be converted to PDF
      return generateHTMLReport(reportData);
    
    default:
      return JSON.stringify(reportData, null, 2);
  }
}

/**
 * Generate HTML report for PDF conversion
 */
function generateHTMLReport(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>${data.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
        .insight { margin: 10px 0; padding: 10px; background-color: #f5f5f5; }
        .recommendation { margin: 5px 0; }
        .positive { color: green; }
        .warning { color: orange; }
        .suggestion { color: blue; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.title}</h1>
        <p>Generated: ${new Date(data.generatedAt).toLocaleString()}</p>
        <p>AI Model: ${data.modelUsed}</p>
    </div>
    
    <div class="section">
        <h2>Trading Metrics</h2>
        <div class="metric">Win Rate: ${data.metrics.winRate}%</div>
        <div class="metric">Avg Winning Trade: $${data.metrics.avgWinningTrade}</div>
        <div class="metric">Avg Losing Trade: $${data.metrics.avgLosingTrade}</div>
        <div class="metric">Profit Factor: ${data.metrics.profitFactor}</div>
        <div class="metric">Risk-Reward Ratio: ${data.metrics.riskRewardRatio}</div>
        <div class="metric">Max Drawdown: ${data.metrics.maxDrawdown}%</div>
        <div class="metric">Avg Holding Period: ${data.metrics.avgHoldingPeriod} days</div>
    </div>
    
    <div class="section">
        <h2>Key Insights</h2>
        ${data.insights.map((insight: any) => 
          `<div class="insight ${insight.type}">
            <strong>${insight.type.toUpperCase()}:</strong> ${insight.message}
          </div>`
        ).join('')}
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        ${data.recommendations.map((rec: string) => 
          `<div class="recommendation">• ${rec}</div>`
        ).join('')}
    </div>
    
    ${data.improvements && data.improvements.length > 0 ? `
    <div class="section">
        <h2>Areas for Improvement</h2>
        ${data.improvements.map((imp: string) => 
          `<div class="recommendation">• ${imp}</div>`
        ).join('')}
    </div>
    ` : ''}
</body>
</html>
  `;
}
