import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinancialPerformanceChart } from "@/components/charts/financial-performance-chart";
import { FinancialRiskRewardChart } from "@/components/charts/financial-risk-reward-chart";
import { Brain, CheckCircle, AlertTriangle, Lightbulb, TrendingUp, Download, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AIInsight {
  type: 'positive' | 'warning' | 'suggestion' | 'metric';
  icon: string;
  message: string;
}

interface AIAnalysisReport {
  id: string;
  insights: AIInsight[];
  improvements?: string[];
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
  createdAt: string;
  modelUsed?: string;
  coachPersona?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
}

interface AnalysisMetrics {
  tradingFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  positionSizing: {
    average: number;
    maximum: number;
    portfolioPercentage: number;
  };
  holdTimes: {
    avgWinners: number;
    avgLosers: number;
    optimal: number;
  };
}

export default function AnalysisPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedCoachPersona, setSelectedCoachPersona] = useState('mentor-guru');

  const { data: reports = [], isLoading: reportsLoading } = useQuery<AIAnalysisReport[]>({
    queryKey: ["/api/analysis/reports"],
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingReport(true);
      const res = await apiRequest("POST", "/api/analysis/generate", {
        coachPersonaId: selectedCoachPersona
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/reports"] });
      toast({ 
        title: "AI analysis report generated successfully", 
        description: `Generated using ${data.modelUsed || 'AI model'}`
      });
      setIsGeneratingReport(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to generate report", 
        description: error.message, 
        variant: "destructive" 
      });
      setIsGeneratingReport(false);
    }
  });

  // Download report function
  const downloadReport = async (reportId: string, format: 'json' | 'csv' | 'pdf' = 'json') => {
    try {
      const response = await fetch(`/api/analysis/download/${reportId}?format=${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-analysis-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'html' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Report downloaded successfully" });
    } catch (error) {
      toast({ 
        title: "Failed to download report", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive" 
      });
    }
  };

  const latestReport = reports[0];

  // Generate sample data for charts
  const monthlyData = [
    { month: "Jan", return: 8.5, trades: 25 },
    { month: "Feb", return: 12.3, trades: 32 },
    { month: "Mar", return: -3.2, trades: 28 },
    { month: "Apr", return: 15.7, trades: 35 },
    { month: "May", return: 9.8, trades: 30 },
    { month: "Jun", return: 11.4, trades: 27 }
  ];

  const riskRewardData = trades && Array.isArray(trades) ? trades.slice(0, 20).map((trade: any) => ({
    risk: Math.random() * 2 + 0.5,
    reward: Math.random() * 3 + 1,
    symbol: trade.symbol || 'N/A',
    pnl: Number(trade.pnl || 0)
  })) : [];

  const mockMetrics: AnalysisMetrics = {
    tradingFrequency: {
      daily: 2.3,
      weekly: 16.1,
      monthly: 70.5
    },
    positionSizing: {
      average: 2450,
      maximum: 8200,
      portfolioPercentage: 4.2
    },
    holdTimes: {
      avgWinners: 2.1,
      avgLosers: 3.8,
      optimal: 1.5
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-blue-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Trading Analysis</h1>
          <div className="flex items-center space-x-4">
            <Select value={selectedCoachPersona} onValueChange={setSelectedCoachPersona}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Coach Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentor-guru">Mentor Guru</SelectItem>
                <SelectItem value="technical-analyst">Technical Analyst</SelectItem>
                <SelectItem value="risk-manager">Risk Manager</SelectItem>
                <SelectItem value="psychology-coach">Psychology Coach</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => generateReportMutation.mutate()}
              disabled={isGeneratingReport}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isGeneratingReport ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Generate AI Report
            </Button>
          </div>
        </div>

        {/* AI Analysis Card */}
        <Card className="glass border-white/10 mb-8">
          <CardHeader>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center">
                  AI Trading Coach Analysis
                  {latestReport?.modelUsed && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {latestReport.modelUsed}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-slate-400">
                  Daily performance review and recommendations
                  {latestReport?.coachPersona && (
                    <span className="ml-2 text-blue-400">
                      • {latestReport.coachPersona.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : latestReport ? (
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h4 className="font-semibold mb-3 text-emerald-400">
                  Key Insights for {new Date(latestReport.createdAt).toLocaleDateString()}:
                </h4>
                <ul className="space-y-3 mb-6">
                  {latestReport.insights && latestReport.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      {getInsightIcon(insight.type)}
                      <span className="ml-3 text-slate-300">{insight.message}</span>
                    </li>
                  ))}
                </ul>
                
                {latestReport.improvements && latestReport.improvements.length > 0 && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h5 className="font-semibold text-red-400 mb-2">⚠️ Areas for Improvement:</h5>
                    <ul className="text-slate-300 space-y-1">
                      {latestReport.improvements.map((improvement, index) => (
                        <li key={index}>• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestReport.recommendations && latestReport.recommendations.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h5 className="font-semibold text-blue-400 mb-2">💡 Recommendations:</h5>
                    <ul className="text-slate-300 space-y-1">
                      {latestReport.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No analysis reports yet</h3>
                <p className="text-slate-400 mb-6">Generate your first AI analysis to get personalized insights</p>
                <Button onClick={() => generateReportMutation.mutate()}>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialPerformanceChart data={monthlyData} />
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Risk-Reward Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialRiskRewardChart data={riskRewardData} />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Trading Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Avg</span>
                  <span className="font-semibold">{mockMetrics.tradingFrequency.daily} trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weekly Avg</span>
                  <span className="font-semibold">{mockMetrics.tradingFrequency.weekly} trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Avg</span>
                  <span className="font-semibold">{mockMetrics.tradingFrequency.monthly} trades</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Position Sizing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Position</span>
                  <span className="font-semibold">${mockMetrics.positionSizing.average.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Position</span>
                  <span className="font-semibold">${mockMetrics.positionSizing.maximum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">% of Portfolio</span>
                  <span className="font-semibold">{mockMetrics.positionSizing.portfolioPercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Hold Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Winners</span>
                  <span className="font-semibold">{mockMetrics.holdTimes.avgWinners} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Losers</span>
                  <span className="font-semibold text-red-400">{mockMetrics.holdTimes.avgLosers} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Optimal</span>
                  <span className="font-semibold">{mockMetrics.holdTimes.optimal} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report History */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Brain className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold">AI Analysis Report</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {report.insights.slice(0, 3).map((insight, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className={
                              insight.type === 'positive' 
                                ? 'border-emerald-500/30 text-emerald-400' 
                                : insight.type === 'warning'
                                ? 'border-yellow-500/30 text-yellow-400'
                                : 'border-blue-500/30 text-blue-400'
                            }
                          >
                            {insight.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-400 hover:text-blue-300"
                        onClick={() => downloadReport(report.id, 'json')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-400 hover:text-green-300"
                        onClick={() => downloadReport(report.id, 'csv')}
                      >
                        CSV
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-purple-400 hover:text-purple-300"
                        onClick={() => downloadReport(report.id, 'pdf')}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <p className="text-slate-400">No analysis reports found. Generate your first report to see history.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
