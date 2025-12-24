import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinancialPerformanceChart } from "@/components/charts/financial-performance-chart";
import { FinancialRiskRewardChart } from "@/components/charts/financial-risk-reward-chart";
import { Brain, CheckCircle, AlertTriangle, Lightbulb, TrendingUp, Download, RefreshCw, Settings, Upload, Trash2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: reports = [], isLoading: reportsLoading } = useQuery<AIAnalysisReport[]>({
    queryKey: ["/api/analysis/reports"],
  });

  const { data: trades = [] } = useQuery<any[]>({
    queryKey: ["/api/trades"],
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await apiRequest("DELETE", `/api/analysis/reports/${reportId}`);
      if (!res.ok) {
        throw new Error("Failed to delete report");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/reports"] });
      toast({ title: "Report deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete report", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const uploadTradesMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      // Use fetch directly for FormData since apiRequest might JSON-stringify
      const res = await fetch("/api/trades/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload trades");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ 
        title: "Trades imported successfully", 
        description: `${data.message || 'Trades have been added to your history.'} Generate a new report to analyze them.`
      });
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Import failed", 
        description: error.message, 
        variant: "destructive" 
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadTradesMutation.mutate(file);
    }
  };

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

  const mockMetrics: AnalysisMetrics = {
    tradingFrequency: { daily: 0, weekly: 0, monthly: 0 },
    positionSizing: { average: 0, maximum: 0, portfolioPercentage: 0 },
    holdTimes: { avgWinners: 0, avgLosers: 0, optimal: 0 }
  };

  // Calculate real metrics from trades
  const calculatedMetrics = useMemo(() => {
    if (!trades || trades.length === 0) return mockMetrics;

    // Filter trades with PnL
    const closedTrades = trades.filter((t: any) => t.status === 'closed' || t.exitPrice);
    const winningTrades = closedTrades.filter((t: any) => Number(t.pnl) > 0);
    const losingTrades = closedTrades.filter((t: any) => Number(t.pnl) < 0);

    // Trading Frequency
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTrades = trades.filter((t: any) => new Date(t.entryDate) >= oneMonthAgo);
    
    const monthlyFreq = recentTrades.length;
    const weeklyFreq = Number((monthlyFreq / 4).toFixed(1));
    const dailyFreq = Number((monthlyFreq / 30).toFixed(1));

    // Position Sizing
    const positions = trades.map((t: any) => Number(t.quantity) * Number(t.entryPrice));
    const totalPositionValue = positions.reduce((a: number, b: number) => a + b, 0);
    const avgPosition = positions.length ? totalPositionValue / positions.length : 0;
    const maxPosition = Math.max(...positions, 0);

    // Hold Times (in days)
    const calculateAvgHoldTime = (tradeList: any[]) => {
      if (!tradeList.length) return 0;
      const totalDays = tradeList.reduce((acc: number, t: any) => {
        if (!t.entryDate || !t.exitDate) return acc;
        const start = new Date(t.entryDate).getTime();
        const end = new Date(t.exitDate).getTime();
        return acc + (end - start);
      }, 0);
      return Number((totalDays / tradeList.length / (1000 * 60 * 60 * 24)).toFixed(1));
    };

    const avgWinnersHold = calculateAvgHoldTime(winningTrades);
    const avgLosersHold = calculateAvgHoldTime(losingTrades);

    return {
      tradingFrequency: {
        daily: dailyFreq,
        weekly: weeklyFreq,
        monthly: monthlyFreq
      },
      positionSizing: {
        average: Math.round(avgPosition),
        maximum: Math.round(maxPosition),
        portfolioPercentage: 0 // Need portfolio balance for this
      },
      holdTimes: {
        avgWinners: avgWinnersHold,
        avgLosers: avgLosersHold,
        optimal: 0 // This would come from AI analysis
      }
    };
  }, [trades]);

  // Use calculated metrics if available, otherwise mock
  const metrics = trades.length > 0 ? calculatedMetrics : mockMetrics;

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
    risk: Math.random() * 2 + 0.5, // This should ideally come from stop loss
    reward: Math.random() * 3 + 1, // This should come from take profit
    symbol: trade.symbol || 'N/A',
    pnl: Number(trade.pnl || 0)
  })) : [];

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
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline" 
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadTradesMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadTradesMutation.isPending ? "Importing..." : "Import CSV"}
            </Button>

            <Select value={selectedCoachPersona} onValueChange={setSelectedCoachPersona}>
              <SelectTrigger className="w-48 border-white/10 bg-black/20">
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
        <Card className="glass border-white/10 mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-b border-white/5 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4 shadow-lg shadow-purple-500/20">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center text-xl">
                    AI Trading Coach Analysis
                    {latestReport?.modelUsed && (
                      <Badge variant="outline" className="ml-3 text-xs bg-blue-500/10 text-blue-300 border-blue-500/30">
                        {latestReport.modelUsed}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-slate-400 mt-1">
                    Daily performance review and recommendations
                    {latestReport?.coachPersona && (
                      <span className="ml-2 text-blue-400 font-medium">
                        • {latestReport.coachPersona.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {latestReport && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => deleteReportMutation.mutate(latestReport.id)}
                  title="Delete this report"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {reportsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : latestReport ? (
              <div className="space-y-6">
                <div className="bg-slate-800/30 rounded-xl p-6 border border-white/5">
                  <h4 className="font-semibold mb-4 text-emerald-400 flex items-center text-lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Key Insights for {new Date(latestReport.createdAt).toLocaleDateString()}
                  </h4>
                  <ul className="space-y-4">
                    {latestReport.insights && latestReport.insights.map((insight, index) => (
                      <li key={index} className="flex items-start bg-slate-900/40 p-3 rounded-lg border border-white/5">
                        <div className="mt-0.5 mr-3 shrink-0">
                          {getInsightIcon(insight.type)}
                        </div>
                        <span className="text-slate-300 leading-relaxed">{insight.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {latestReport.improvements && latestReport.improvements.length > 0 && (
                    <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <h5 className="font-semibold text-red-400 mb-4 flex items-center text-lg">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Areas for Improvement
                      </h5>
                      <ul className="space-y-3">
                        {latestReport.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start text-slate-300">
                            <span className="mr-2 text-red-500/50">•</span>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestReport.recommendations && latestReport.recommendations.length > 0 && (
                    <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                      <h5 className="font-semibold text-blue-400 mb-4 flex items-center text-lg">
                        <Lightbulb className="h-5 w-5 mr-2" />
                        Recommendations
                      </h5>
                      <ul className="space-y-3">
                        {latestReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start text-slate-300">
                            <span className="mr-2 text-blue-500/50">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
                <Brain className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold mb-2 text-slate-200">No analysis reports yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Import your trades via CSV and generate your first AI analysis to get personalized insights and coaching.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button onClick={() => generateReportMutation.mutate()}>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
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
                  <span className="font-semibold">{metrics.tradingFrequency.daily} trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weekly Avg</span>
                  <span className="font-semibold">{metrics.tradingFrequency.weekly} trades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Avg</span>
                  <span className="font-semibold">{metrics.tradingFrequency.monthly} trades</span>
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
                  <span className="font-semibold">${metrics.positionSizing.average.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Position</span>
                  <span className="font-semibold">${metrics.positionSizing.maximum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">% of Portfolio</span>
                  <span className="font-semibold">{metrics.positionSizing.portfolioPercentage}%</span>
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
                  <span className="font-semibold">{metrics.holdTimes.avgWinners} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Losers</span>
                  <span className="font-semibold text-red-400">{metrics.holdTimes.avgLosers} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Optimal</span>
                  <span className="font-semibold">{metrics.holdTimes.optimal || 'N/A'} days</span>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => deleteReportMutation.mutate(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
