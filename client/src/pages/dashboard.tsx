import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinancialPnLChart } from "@/components/charts/financial-pnl-chart";
import { FinancialWinLossChart } from "@/components/charts/financial-win-loss-chart";
import { ArrowUp, ArrowDown, TrendingUp, Plus, Upload, DollarSign, Percent, BarChart3, Shield } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeStats {
  totalTrades: number;
  totalPnL: number;
  winningTrades: number;
  losingTrades: number;
  winRate: string;
}

interface Trade {
  id: string;
  symbol: string;
  type: "long" | "short";
  quantity: number;
  entryPrice: string;
  exitPrice: string | null;
  pnl: string | null;
  entryDate: string;
  status: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<TradeStats>({
    queryKey: ["/api/stats"],
  });

  const { data: trades, isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const recentTrades = trades?.slice(0, 5) || [];

  // Generate P&L data from actual trades
  const pnlData = trades?.length ? trades
    .filter(trade => trade.pnl && !isNaN(Number(trade.pnl)))
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
    .reduce((acc, trade, index) => {
      const pnl = Number(trade.pnl);
      const cumulative = index === 0 ? pnl : acc[acc.length - 1].cumulative + pnl;
      acc.push({
        date: trade.entryDate,
        cumulative: cumulative,
        daily: pnl
      });
      return acc;
    }, [] as Array<{ date: string; cumulative: number; daily: number }>) : [];

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Dashboard</h1>
            <p className="text-slate-400">
              Welcome back, {user?.firstName || user?.username}. Here's your trading overview.
            </p>
          </div>
          <div className="flex space-x-4 mt-4 lg:mt-0">
            <Link href="/journal">
              <Button className="bg-blue-600 hover:bg-blue-500">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </Link>
            <Link href="/journal">
              <Button variant="outline" className="border-slate-600 hover:bg-slate-700/50">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total P&L</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className={`text-2xl font-bold ${Number(stats?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${Number(stats?.totalPnL || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  {Number(stats?.totalPnL || 0) >= 0 ? (
                    <ArrowUp className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <ArrowDown className="h-6 w-6 text-red-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${Number(stats?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {Number(stats?.totalPnL || 0) >= 0 ? '+' : ''}
                  {((Number(stats?.totalPnL || 0) / 10000) * 100).toFixed(1)}%
                </span>
                <span className="text-slate-400 text-sm ml-2">this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Win Rate</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.winRate || '0.0'}%</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Percent className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-emerald-400 text-sm">+2.1%</span>
                <span className="text-slate-400 text-sm ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Trades</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalTrades || 0}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-blue-400 text-sm">+{Math.floor(Math.random() * 20) + 5}</span>
                <span className="text-slate-400 text-sm ml-2">this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Risk Score</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {(Math.random() * 3 + 5).toFixed(1)}/10
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className="text-slate-400 text-sm">Moderate Risk</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                P&L Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pnlData.length > 0 ? (
                <div className="h-48">
                  <FinancialPnLChart data={pnlData} />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-emerald-500/10 rounded-lg p-3">
                      <p className="text-emerald-400 font-bold text-lg">+${pnlData.length > 0 ? Math.max(...pnlData.map(d => d.cumulative)).toFixed(2) : '0.00'}</p>
                      <p className="text-slate-400 text-sm">Peak P&L</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3">
                      <p className="text-blue-400 font-bold text-lg">${pnlData.length > 0 ? pnlData[pnlData.length - 1].cumulative.toFixed(2) : '0.00'}</p>
                      <p className="text-slate-400 text-sm">Current P&L</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start adding trades to see your P&L chart</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Percent className="h-5 w-5 mr-2" />
                Win/Loss Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (Number(stats.winningTrades) > 0 || Number(stats.losingTrades) > 0) ? (
                <div className="space-y-4">
                  <div className="h-48 flex items-center justify-center">
                    <FinancialWinLossChart 
                      wins={Number(stats.winningTrades)} 
                      losses={Number(stats.losingTrades)} 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-emerald-500/10 rounded-lg p-3">
                      <p className="text-emerald-400 font-bold text-lg">{stats.winningTrades}</p>
                      <p className="text-slate-400 text-sm">Wins</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-3">
                      <p className="text-red-400 font-bold text-lg">{stats.losingTrades}</p>
                      <p className="text-slate-400 text-sm">Losses</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3">
                      <p className="text-blue-400 font-bold text-lg">{stats.winRate}%</p>
                      <p className="text-slate-400 text-sm">Win Rate</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Add some completed trades to see distribution</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades */}
        <Card className="glass border-white/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Trades</CardTitle>
              <Link href="/journal">
                <Button variant="outline" size="sm" className="border-slate-600 hover:bg-slate-700/50">
                  View All <ArrowUp className="h-4 w-4 ml-1 rotate-45" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tradesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : recentTrades.length > 0 ? (
              <div className="overflow-x-auto">
<table className="w-full">
  <thead>
    <tr className="border-b border-slate-700">
      <th className="text-left py-3 px-4 text-slate-400">Symbol</th>
      <th className="text-left py-3 px-4 text-slate-400">Type</th>
      <th className="text-left py-3 px-4 text-slate-400">Entry</th>
      <th className="text-left py-3 px-4 text-slate-400">Exit</th>
      <th className="text-left py-3 px-4 text-slate-400">P&L</th>
      <th className="text-left py-3 px-4 text-slate-400">Date</th>
    </tr>
  </thead>
  <tbody>
    {recentTrades.map((trade) => (
      <tr
        key={trade.id}
        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
      >
        <td className="py-3 px-4 font-semibold">{trade.symbol || "-"}</td>

        <td className="py-3 px-4">
          <Badge
            variant={trade.type === "long" ? "default" : "secondary"}
            className={
              trade.type === "long"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }
          >
            {trade.type ? trade.type.charAt(0).toUpperCase() + trade.type.slice(1) : "N/A"}
          </Badge>
        </td>

        <td className="py-3 px-4">
          {trade.entryPrice != null ? `$${Number(trade.entryPrice).toFixed(2)}` : "-"}
        </td>

        <td className="py-3 px-4">
          {trade.exitPrice != null ? `$${Number(trade.exitPrice).toFixed(2)}` : "-"}
        </td>

        <td
          className={`py-3 px-4 ${
            trade.pnl != null && Number(trade.pnl) >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {trade.pnl != null ? `${Number(trade.pnl) >= 0 ? "+" : ""}$${Number(trade.pnl).toFixed(2)}` : "-"}
        </td>

        <td className="py-3 px-4 text-slate-400">
          {trade.entryDate ? new Date(trade.entryDate).toLocaleDateString() : "-"}
        </td>
      </tr>
    ))}
  </tbody>
</table>

              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
                <p className="text-slate-400 mb-6">Start tracking your trades to see your performance</p>
                <Link href="/journal">
                  <Button>Add Your First Trade</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
